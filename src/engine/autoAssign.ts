import { EventItem, Staff, Assignment, AvailabilityBlock, AppSettings } from '../types';
import { checkStaffAssignmentConflict } from './conflictCheck';

export interface AutoAssignSlot {
  event: EventItem;
  roleId?: string;
  roleName?: string;
}

export interface AutoAssignProposal {
  slot: AutoAssignSlot;
  assignedStaff?: Staff;
  reason?: string;
  status: 'assigned' | 'unassigned';
}

export interface AutoAssignResult {
  proposals: AutoAssignProposal[];
  newAssignments: Assignment[];
  summary: {
    totalSlots: number;
    assignedCount: number;
    unassignedCount: number;
  };
}

export function runAutoAssign(
  events: EventItem[],
  staffList: Staff[],
  existingAssignments: Assignment[],
  availabilityBlocks: AvailabilityBlock[],
  settings: AppSettings = { timezone: 'Asia/Seoul', minimum_gap_minutes: 0, max_daily_minutes: 600, max_weekly_minutes: 2400 }
): AutoAssignResult {
  const proposals: AutoAssignProposal[] = [];
  const currentAssignments = [...existingAssignments];
  const newAssignments: Assignment[] = [];

  // Track staff workload (hours)
  const staffWorkloadHours = new Map<string, number>();
  for (const s of staffList) {
    staffWorkloadHours.set(s.id, 0);
  }

  for (const asgn of existingAssignments) {
    if (asgn.status === 'cancelled') continue;
    const ev = events.find((e) => e.id === asgn.event_id);
    if (ev && ev.starts_at && ev.ends_at) {
      const durationHours = (new Date(ev.ends_at).getTime() - new Date(ev.starts_at).getTime()) / (1000 * 60 * 60);
      const curr = staffWorkloadHours.get(asgn.staff_id) || 0;
      staffWorkloadHours.set(asgn.staff_id, curr + durationHours);
    }
  }

  // Filter events: only events with known time can be auto-assigned
  const assignableEvents = events.filter((e) => e.time_status === 'known' && e.starts_at && e.ends_at && e.status !== 'cancelled');

  for (const event of assignableEvents) {
    // Check existing assignments for this event
    const eventAsgns = currentAssignments.filter((a) => a.event_id === event.id && a.status !== 'cancelled');

    // Assume 3 slots per event if not otherwise specified in requirements
    const neededCount = 3;
    const remainingSlots = Math.max(0, neededCount - eventAsgns.length);

    for (let slotIdx = 0; slotIdx < remainingSlots; slotIdx++) {
      const slot: AutoAssignSlot = { event, roleName: '진행/운영' };

      // Candidate search: active staff, not already assigned to this event
      const alreadyAssignedStaffIds = new Set(
        currentAssignments.filter((a) => a.event_id === event.id && a.status !== 'cancelled').map((a) => a.staff_id)
      );

      const eligibleStaff: Staff[] = [];
      const rejectReasons: string[] = [];

      for (const staff of staffList) {
        if (!staff.is_active) {
          rejectReasons.push(`${staff.display_name}: 비활성 직원`);
          continue;
        }
        if (alreadyAssignedStaffIds.has(staff.id)) {
          continue;
        }

        const conflict = checkStaffAssignmentConflict(
          staff.id,
          event,
          events,
          currentAssignments,
          availabilityBlocks,
          settings
        );

        if (conflict.hasConflict) {
          rejectReasons.push(`${staff.display_name}: ${conflict.reason}`);
          continue;
        }

        eligibleStaff.push(staff);
      }

      if (eligibleStaff.length === 0) {
        proposals.push({
          slot,
          status: 'unassigned',
          reason: rejectReasons.length > 0 ? rejectReasons.slice(0, 3).join(', ') : '적격 가용 인원 없음',
        });
        continue;
      }

      // Sort by workload (fairness) then deterministic ID
      eligibleStaff.sort((a, b) => {
        const loadA = staffWorkloadHours.get(a.id) || 0;
        const loadB = staffWorkloadHours.get(b.id) || 0;
        if (loadA !== loadB) return loadA - loadB;
        return a.id.localeCompare(b.id);
      });

      const selected = eligibleStaff[0];
      const durationHours = (new Date(event.ends_at!).getTime() - new Date(event.starts_at!).getTime()) / (1000 * 60 * 60);
      staffWorkloadHours.set(selected.id, (staffWorkloadHours.get(selected.id) || 0) + durationHours);

      const newAsgn: Assignment = {
        id: `asgn-auto-${event.id}-${selected.id}-${Date.now()}-${slotIdx}`,
        event_id: event.id,
        staff_id: selected.id,
        staff_name: selected.display_name,
        role_name: slot.roleName,
        status: 'confirmed',
        source: 'auto',
        locked: false,
        occupied_start: event.starts_at,
        occupied_end: event.ends_at,
      };

      currentAssignments.push(newAsgn);
      newAssignments.push(newAsgn);

      proposals.push({
        slot,
        assignedStaff: selected,
        status: 'assigned',
      });
    }
  }

  const assignedCount = proposals.filter((p) => p.status === 'assigned').length;
  const unassignedCount = proposals.filter((p) => p.status === 'unassigned').length;

  return {
    proposals,
    newAssignments,
    summary: {
      totalSlots: proposals.length,
      assignedCount,
      unassignedCount,
    },
  };
}
