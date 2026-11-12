import { EventItem, Assignment, AvailabilityBlock, AppSettings } from '../types';

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  code?: 'OVERLAP' | 'MIN_GAP_VIOLATION' | 'UNAVAILABLE' | 'TIME_UNKNOWN';
}

export function parseMinutes(isoTime: string): number {
  const d = new Date(isoTime);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Checks if assigning a staff member to targetEvent causes any conflict
 */
export function checkStaffAssignmentConflict(
  staffId: string,
  targetEvent: EventItem,
  existingEvents: EventItem[],
  existingAssignments: Assignment[],
  availabilityBlocks: AvailabilityBlock[],
  settings: AppSettings = { timezone: 'Asia/Seoul', minimum_gap_minutes: 0, max_daily_minutes: 600, max_weekly_minutes: 2400 }
): ConflictCheckResult {
  // If targetEvent has unknown time, we cannot assert time conflict, but also cannot confirm
  if (targetEvent.time_status === 'unknown' || !targetEvent.starts_at || !targetEvent.ends_at) {
    return {
      hasConflict: false,
      reason: '시간 미정 공연입니다.',
      code: 'TIME_UNKNOWN',
    };
  }

  const targetStart = new Date(targetEvent.starts_at).getTime();
  const targetEnd = new Date(targetEvent.ends_at).getTime();

  // 1. Check Availability Blocks
  for (const block of availabilityBlocks) {
    if (block.staff_id === staffId && block.on_date === targetEvent.occurs_on) {
      if (block.block_type === 'all_day_unavailability' || block.all_day) {
        return {
          hasConflict: true,
          reason: `해당 일자 종일 불가 (${block.description || '휴무'})`,
          code: 'UNAVAILABLE',
        };
      }
      if (block.block_type === 'event_exclusion' && block.event_id === targetEvent.id) {
        return {
          hasConflict: true,
          reason: `해당 공연 지정 제외 (${block.description})`,
          code: 'UNAVAILABLE',
        };
      }
      if (block.start_at && block.end_at) {
        const blockStart = new Date(block.start_at).getTime();
        const blockEnd = new Date(block.end_at).getTime();
        // Half-open interval [start, end)
        if (targetStart < blockEnd && targetEnd > blockStart) {
          return {
            hasConflict: true,
            reason: `개인 일정 겹침 (${block.description})`,
            code: 'OVERLAP',
          };
        }
      }
    }
  }

  // 2. Check Existing Assignments for Overlap & Minimum Gap
  const staffAssignments = existingAssignments.filter(
    (a) => a.staff_id === staffId && a.status !== 'cancelled' && a.event_id !== targetEvent.id
  );

  const minGapMs = settings.minimum_gap_minutes * 60 * 1000;

  for (const asgn of staffAssignments) {
    const ev = existingEvents.find((e) => e.id === asgn.event_id);
    if (!ev || ev.time_status === 'unknown' || !ev.starts_at || !ev.ends_at) continue;

    const evStart = new Date(ev.starts_at).getTime();
    const evEnd = new Date(ev.ends_at).getTime();

    // Check direct time overlap [start, end)
    if (targetStart < evEnd && targetEnd > evStart) {
      return {
        hasConflict: true,
        reason: `'${ev.title}' 일정과 시간이 겹칩니다 (${ev.occurs_on} ${new Date(ev.starts_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}~${new Date(ev.ends_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})`,
        code: 'OVERLAP',
      };
    }

    // Check minimum gap between events
    if (minGapMs > 0) {
      // If target is after ev, gap = targetStart - evEnd
      if (targetStart >= evEnd && targetStart - evEnd < minGapMs) {
        return {
          hasConflict: true,
          reason: `'${ev.title}' 공연 후 최소 이동/휴식 간격(${settings.minimum_gap_minutes}분) 부족`,
          code: 'MIN_GAP_VIOLATION',
        };
      }
      // If target is before ev, gap = evStart - targetEnd
      if (evStart >= targetEnd && evStart - targetEnd < minGapMs) {
        return {
          hasConflict: true,
          reason: `'${ev.title}' 공연 전 최소 이동/휴식 간격(${settings.minimum_gap_minutes}분) 부족`,
          code: 'MIN_GAP_VIOLATION',
        };
      }
    }
  }

  return { hasConflict: false };
}
