import {
  ParsedEventCandidate,
  ParsedAssignmentCandidate,
  ParsedUnavailabilityCandidate,
  ReviewItem,
  ParseResult,
  Staff,
  Venue,
} from '../types';

export interface ParseOptions {
  baseYear?: number;
  baseMonth?: number;
  staffList?: Staff[];
  venueList?: Venue[];
}

export function parseMemo(text: string, options: ParseOptions = {}): ParseResult {
  const lines = text.split('\n');
  const events: ParsedEventCandidate[] = [];
  const assignments: ParsedAssignmentCandidate[] = [];
  const unavailabilities: ParsedUnavailabilityCandidate[] = [];
  const reviewNeeded: ReviewItem[] = [];

  let currentYear = options.baseYear;
  let currentMonth = options.baseMonth;

  // Scan text for Month header e.g. "11월 인원정리", "11월"
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const monthMatch = trimmed.match(/^(\d{1,2})월/);
    if (monthMatch) {
      currentMonth = parseInt(monthMatch[1], 10);
      break;
    }
  }

  // If no year specified, default to 2026 if requested or options
  if (!currentYear) {
    currentYear = 2026;
  }
  if (!currentMonth) {
    currentMonth = 11;
  }

  const staffMap = new Map<string, Staff[]>();
  if (options.staffList) {
    for (const s of options.staffList) {
      const arr = staffMap.get(s.display_name) || [];
      arr.push(s);
      staffMap.set(s.display_name, arr);
      if (s.aliases) {
        for (const alias of s.aliases) {
          const aArr = staffMap.get(alias) || [];
          aArr.push(s);
          staffMap.set(alias, aArr);
        }
      }
    }
  }

  let currentVenueHeader = '';
  let currentOrganizerHint = '';
  let activeDate = '';
  let inUnavailabilitySection = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('—') || trimmed.startsWith('---') || trimmed.startsWith('===')) {
      inUnavailabilitySection = true;
      continue;
    }

    // Check if line is month title
    if (trimmed.includes('인원정리') || (trimmed.endsWith('월') && !trimmed.includes('일'))) {
      const mMatch = trimmed.match(/(\d{1,2})월/);
      if (mMatch) {
        currentMonth = parseInt(mMatch[1], 10);
      }
      continue;
    }

    // Check if line is a Date Header: e.g. "13일" or "11/13" or "11월 13일"
    const dateHeaderMatch = trimmed.match(/^(\d{1,2})일$/);
    if (dateHeaderMatch) {
      const dayNum = parseInt(dateHeaderMatch[1], 10);
      activeDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      continue;
    }

    // Check if line is a Venue Header: e.g. "을숙도문화회관 (김하늘)" or "서울예술의전당 자유소극장 (정다은)"
    const venueHeaderMatch = trimmed.match(/^([^(]+)\s*(?:\(([^)]+)\))?$/);
    if (
      venueHeaderMatch &&
      !trimmed.match(/^\d{1,2}일/) &&
      !trimmed.includes('불가') &&
      !trimmed.includes('워크샵') &&
      !trimmed.includes('공연보러감')
    ) {
      const possibleVenue = venueHeaderMatch[1].trim();
      const possibleHint = venueHeaderMatch[2]?.trim() || '';

      // Check if this looks like a venue or performance title rather than a staff line
      if (
        possibleVenue.includes('회관') ||
        possibleVenue.includes('극장') ||
        possibleVenue.includes('센터') ||
        possibleVenue.includes('소극장') ||
        possibleVenue.includes('대공연장') ||
        possibleVenue.includes('홀') ||
        possibleVenue.includes('아트')
      ) {
        currentVenueHeader = possibleVenue;
        currentOrganizerHint = possibleHint;
        inUnavailabilitySection = false;
        continue;
      }
    }

    // Case A: Performance Schedule Line: e.g. "03일 김하늘 박서준 오지민"
    const dayStaffMatch = trimmed.match(/^(\d{1,2})일\s+(.+)$/);
    if (dayStaffMatch && currentVenueHeader) {
      const dayNum = parseInt(dayStaffMatch[1], 10);
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const staffNames = dayStaffMatch[2].split(/\s+/).filter(Boolean);

      const eventTempId = `evt-${dateStr}-${currentVenueHeader}`;
      events.push({
        tempId: eventTempId,
        title: `${currentVenueHeader} 일정`,
        venueName: currentVenueHeader,
        date: dateStr,
        organizerHint: currentOrganizerHint || undefined,
        line: idx + 1,
        status: 'approved',
      });

      // Time unknown review item
      reviewNeeded.push({
        tempId: `rev-time-${eventTempId}`,
        type: 'TIME_UNKNOWN',
        title: '시간 미정',
        description: `${dayStaffMatch[1]}일 공연의 시작/종료 시간이 입력되지 않았습니다.`,
        rawLine: rawLine,
        line: idx + 1,
        targetRef: eventTempId,
      });

      for (const name of staffNames) {
        // Exclude organizer hint if it was in parenthesis and we already noted it
        const candidateId = `asgn-${eventTempId}-${name}`;
        const staffMatches = staffMap.get(name) || [];

        let status: 'approved' | 'pending_review' | 'conflict' = 'approved';
        let conflictReason: string | undefined = undefined;

        if (staffMatches.length > 1) {
          status = 'pending_review';
          reviewNeeded.push({
            tempId: `rev-ambig-${candidateId}`,
            type: 'AMBIGUOUS_STAFF',
            title: '이름 중복 가능',
            description: `${name} (동명이인 여부 확인 필요: ${staffMatches.length}명 등록됨)`,
            rawLine: rawLine,
            line: idx + 1,
            targetRef: candidateId,
          });
        }

        assignments.push({
          tempId: candidateId,
          eventTempId: eventTempId,
          venueName: currentVenueHeader,
          date: dateStr,
          staffName: name,
          matchedStaffId: staffMatches.length === 1 ? staffMatches[0].id : undefined,
          line: idx + 1,
          status,
          conflictReason,
        });
      }
      continue;
    }

    // Case B: Unavailability / External commitment line
    // e.g. "손예진 부산포 공연 불가"
    // e.g. "윤도현 불가"
    // e.g. "손창민 불가"
    // e.g. "한도윤 학교 워크샵"
    // e.g. "이나영 저녁 8시 공연보러감"
    // e.g. "김하늘 금정"
    const targetDate = activeDate || `${currentYear}-${String(currentMonth).padStart(2, '0')}-13`;

    // 1) Specific event exclusion: e.g. "손예진 부산포 공연 불가"
    const specificExclusionMatch = trimmed.match(/^([가-힣a-zA-Z0-9]+)\s+(.+?)\s*공연\s*불가$/);
    if (specificExclusionMatch) {
      const name = specificExclusionMatch[1].trim();
      const exclTarget = specificExclusionMatch[2].trim();
      unavailabilities.push({
        tempId: `unav-excl-${idx}`,
        staffName: name,
        date: targetDate,
        type: 'event_exclusion',
        description: `${exclTarget} 공연 제외`,
        line: idx + 1,
        status: 'approved',
      });
      continue;
    }

    // 2) All day unavailability: e.g. "윤도현 불가", "손창민 불가"
    const allDayMatch = trimmed.match(/^([가-힣a-zA-Z0-9]+)\s+불가$/);
    if (allDayMatch) {
      const name = allDayMatch[1].trim();
      unavailabilities.push({
        tempId: `unav-allday-${idx}`,
        staffName: name,
        date: targetDate,
        type: 'all_day_unavailability',
        description: '종일 불가',
        line: idx + 1,
        status: 'approved',
      });
      continue;
    }

    // 3) External commitment with workshop: e.g. "한도윤 학교 워크샵"
    const workshopMatch = trimmed.match(/^([가-힣a-zA-Z0-9]+)\s+(.+워크샵.*)$/);
    if (workshopMatch) {
      const name = workshopMatch[1].trim();
      const desc = workshopMatch[2].trim();
      unavailabilities.push({
        tempId: `unav-ext-${idx}`,
        staffName: name,
        date: targetDate,
        type: 'external_commitment',
        description: desc,
        line: idx + 1,
        status: 'pending_review',
      });
      reviewNeeded.push({
        tempId: `rev-ext-${idx}`,
        type: 'EXTERNAL_COMMITMENT',
        title: '외부 일정 시간 확인 필요',
        description: `${name}: ${desc} (시각 미정으로 검토 대기)`,
        rawLine: rawLine,
        line: idx + 1,
      });
      continue;
    }

    // 4) Time restriction candidate: e.g. "이나영 저녁 8시 공연보러감"
    const timeRestrMatch = trimmed.match(/^([가-힣a-zA-Z0-9]+)\s+(저녁\s*\d{1,2}시.*)$/);
    if (timeRestrMatch) {
      const name = timeRestrMatch[1].trim();
      const desc = timeRestrMatch[2].trim();
      unavailabilities.push({
        tempId: `unav-timerestr-${idx}`,
        staffName: name,
        date: targetDate,
        type: 'external_commitment',
        description: desc,
        line: idx + 1,
        status: 'pending_review',
      });
      reviewNeeded.push({
        tempId: `rev-timerestr-${idx}`,
        type: 'EXTERNAL_COMMITMENT',
        title: '개인 일정 종료시각 확인 필요',
        description: `${name}: ${desc} (20:00부터 시작되나 종료시각 미정)`,
        rawLine: rawLine,
        line: idx + 1,
      });
      continue;
    }

    // 5) Staff + Venue alias: e.g. "김하늘 금정", "박서준 포커스온", "오지민 나다"
    const staffVenueAliasMatch = trimmed.match(/^([가-힣a-zA-Z0-9]+)\s+([가-힣a-zA-Z0-9]+)$/);
    if (staffVenueAliasMatch) {
      const name = staffVenueAliasMatch[1].trim();
      const alias = staffVenueAliasMatch[2].trim();

      unavailabilities.push({
        tempId: `unav-alias-${idx}`,
        staffName: name,
        date: targetDate,
        type: 'external_commitment',
        description: `${alias} 배정/외부일정`,
        line: idx + 1,
        status: 'pending_review',
      });
      reviewNeeded.push({
        tempId: `rev-alias-${idx}`,
        type: 'UNMAPPED_VENUE',
        title: '별칭 확인 필요',
        description: `${name}: '${alias}' (공연장 또는 외부 공연 연결 확인 필요)`,
        rawLine: rawLine,
        line: idx + 1,
      });
      continue;
    }

    // Fallback: Unknown unparsed line
    reviewNeeded.push({
      tempId: `rev-unknown-${idx}`,
      type: 'UNKNOWN_LINE',
      title: '미분류 원문',
      description: '인식되지 않은 구문입니다.',
      rawLine: rawLine,
      line: idx + 1,
    });
  }

  // Cross-check conflicts between assignments and unavailabilities
  for (const asgn of assignments) {
    const conflict = unavailabilities.find(
      (u) => u.staffName === asgn.staffName && u.date === asgn.date && u.type === 'all_day_unavailability'
    );
    if (conflict) {
      asgn.status = 'conflict';
      asgn.conflictReason = '불가 일정과 충돌 (배정 있음)';
      reviewNeeded.push({
        tempId: `rev-conflict-${asgn.tempId}`,
        type: 'CONFLICT',
        title: '불가 일정 충돌',
        description: `${asgn.staffName} / ${asgn.date.slice(8)}일: ${asgn.conflictReason}`,
        rawLine: `${asgn.staffName} 불가 충돌`,
        line: asgn.line,
        targetRef: asgn.tempId,
      });
    }
  }

  return {
    events,
    assignments,
    unavailabilities,
    reviewNeeded,
    stats: {
      eventsCount: events.length,
      assignmentsCount: assignments.length,
      unavailabilitiesCount: unavailabilities.length,
      reviewNeededCount: reviewNeeded.length,
    },
  };
}
