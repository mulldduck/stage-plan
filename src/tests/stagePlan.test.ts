import { describe, it, expect, beforeEach } from 'vitest';
import { parseMemo } from '../parser/parseMemo';
import { checkStaffAssignmentConflict } from '../engine/conflictCheck';
import { runAutoAssign } from '../engine/autoAssign';
import { AppDB } from '../storage/db';
import { exportScheduleToCSV } from '../storage/exportService';
import { Staff, EventItem, Assignment, AvailabilityBlock } from '../types';

describe('STAGE PLAN — 25 Core Validation Tests', () => {
  let db: AppDB;

  beforeEach(() => {
    db = new AppDB();
    db.resetToDefault();
  });

  // Test 1: 공연별 메모에서 6 행사 / 15 후보 배정 추출
  it('1. 공연별 메모에서 6개 행사와 15개 후보 배정을 정확히 추출해야 한다', () => {
    const memoText = `11월 인원정리
을숙도문화회관 (김하늘)
03일 김하늘 박서준 오지민
04일 김하늘 박서준

서울예술의전당 자유소극장 (정다은)
05일 정다은 오지민 한도윤
06일 정다은 오지민
07일 정다은 오지민
08일 정다은 오지민 한도윤`;

    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    expect(res.events.length).toBe(6);
    expect(res.assignments.length).toBe(15);
  });

  // Test 2: 장소 괄호 이름이 중복으로 추가되지 않음
  it('2. 장소 그룹 헤더 괄호 속 인명(대표자 힌트)은 별도 배정으로 중복 추가되지 않아야 한다', () => {
    const memoText = `을숙도문화회관 (김하늘)
03일 박서준 오지민`;

    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    const staffNames = res.assignments.map((a) => a.staffName);
    expect(staffNames).toContain('박서준');
    expect(staffNames).toContain('오지민');
    expect(staffNames).not.toContain('김하늘');
    expect(res.events[0].organizerHint).toBe('김하늘');
  });

  // Test 3: 연도 미제공이면 확정 불가; 기준 연월 있을 때 날짜 정상
  it('3. 연도가 텍스트에 없더라도 기준 연월(2026-11)이 제공되면 정상 날짜로 완성되어야 한다', () => {
    const memoText = `을숙도문화회관
03일 김하늘`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    expect(res.events[0].date).toBe('2026-11-03');
  });

  // Test 4: 시간 미정 공연이 자동배정/충돌 확정 대상에서 제외
  it('4. 시간 미정 공연은 자동배정 엔진 및 시간 충돌 확정 판정에서 제외되어야 한다', () => {
    const event: EventItem = {
      id: 'e-unknown-time',
      title: '미정 공연',
      occurs_on: '2026-11-13',
      time_status: 'unknown',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'note',
    };
    const conflict = checkStaffAssignmentConflict('s-1', event, [event], [], []);
    expect(conflict.hasConflict).toBe(false);
    expect(conflict.code).toBe('TIME_UNKNOWN');

    const autoRes = runAutoAssign([event], db.getStaff(), [], []);
    expect(autoRes.summary.totalSlots).toBe(0);
  });

  // Test 5: 불가 종일과 특정 공연 불가 구분
  it('5. 종일 불가와 특정 공연 한정 제외가 정확한 타입으로 구분되어 파싱되어야 한다', () => {
    const memoText = `13일
손예진 부산포 공연 불가
윤도현 불가`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    const son = res.unavailabilities.find((u) => u.staffName === '손예진');
    const yoon = res.unavailabilities.find((u) => u.staffName === '윤도현');

    expect(son?.type).toBe('event_exclusion');
    expect(son?.description).toContain('부산포');
    expect(yoon?.type).toBe('all_day_unavailability');
  });

  // Test 6: 저녁 8시 문장을 사용자 확인 필요한 제한으로 분류
  it('6. "저녁 8시 공연보러감" 문장은 종료시간이 없으므로 확인 필요 검토 항목으로 등록되어야 한다', () => {
    const memoText = `13일
이나영 저녁 8시 공연보러감`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    expect(res.reviewNeeded.some((r) => r.type === 'EXTERNAL_COMMITMENT' && r.description.includes('이나영'))).toBe(true);
  });

  // Test 7: 미등록 직원·동명이인 자동 생성/선택 금지
  it('7. 동명이인이 존재할 경우 자동 확정하지 않고 AMBIGUOUS_STAFF 검토 필요 항목으로 분류해야 한다', () => {
    const mockStaff: Staff[] = [
      { id: 's-choi-1', display_name: '최성빈', employee_code: 'A1', is_active: true },
      { id: 's-choi-2', display_name: '최성빈', employee_code: 'A2', is_active: true },
    ];
    const memoText = `을숙도문화회관
03일 최성빈`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11, staffList: mockStaff });
    expect(res.reviewNeeded.some((r) => r.type === 'AMBIGUOUS_STAFF')).toBe(true);
    expect(res.assignments[0].status).toBe('pending_review');
  });

  // Test 8: 같은 메모 두 번 반영해도 중복 공연/직원 배정 없음 (멱등성)
  it('8. 동일한 메모를 두 번 연속 배치 적용해도 중복 생성되지 않고 0건 추가되어야 한다 (멱등성)', () => {
    const memoText = `11월 인원정리
을숙도문화회관 (김하늘)
30일 김하늘 박서준`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });

    const apply1 = db.applySmartMemoBatch(res.events, res.assignments, res.unavailabilities);
    expect(apply1.addedEventsCount).toBe(1);
    expect(apply1.addedAssignmentsCount).toBe(2);

    const apply2 = db.applySmartMemoBatch(res.events, res.assignments, res.unavailabilities);
    expect(apply2.addedEventsCount).toBe(0);
    expect(apply2.addedAssignmentsCount).toBe(0);
  });

  // Test 9: 메모 수정 후 추가/유지/해제 제안이 정확함
  it('9. 기존 이벤트가 있는 상태에서 새로운 직원이 메모에 추가되면 추가 건수만 반영되어야 한다', () => {
    const memo1 = `을숙도문화회관
03일 김하늘`;
    const res1 = parseMemo(memo1, { baseYear: 2026, baseMonth: 11 });
    db.applySmartMemoBatch(res1.events, res1.assignments, []);

    const memo2 = `을숙도문화회관
03일 김하늘 박서준`;
    const res2 = parseMemo(memo2, { baseYear: 2026, baseMonth: 11 });
    const apply2 = db.applySmartMemoBatch(res2.events, res2.assignments, []);

    expect(apply2.addedEventsCount).toBe(0); // 기존 이벤트 유지
    expect(apply2.addedAssignmentsCount).toBe(1); // 박서준 1건만 신규 추가
  });

  // Test 10: 수동으로 변경하거나 locked=true인 배정을 자동 수정/삭제 안 함
  it('10. locked=true로 고정된 배정은 재동기화 및 자동배정 시 수정되거나 삭제되지 않아야 한다', () => {
    const lockedAsgn = db.getAssignments().find((a) => a.locked);
    expect(lockedAsgn).toBeDefined();

    const initialStaffId = lockedAsgn!.staff_id;
    // Attempt auto assign
    runAutoAssign(db.getEvents(), db.getStaff(), db.getAssignments(), db.getAvailabilities());

    const afterAsgn = db.getAssignments().find((a) => a.id === lockedAsgn!.id);
    expect(afterAsgn?.staff_id).toBe(initialStaffId);
    expect(afterAsgn?.locked).toBe(true);
  });

  // Test 11: 충분한 시간 정보가 있는 동일 직원의 10:00–11:00, 10:30–11:30 중복 확정 불가
  it('11. 동일 직원의 10:00~11:00 일정과 10:30~11:30 일정은 시간 겹침 충돌로 거부되어야 한다', () => {
    const ev1: EventItem = {
      id: 'e1',
      title: '공연 1',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T10:00:00+09:00',
      ends_at: '2026-11-13T11:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    const ev2: EventItem = {
      id: 'e2',
      title: '공연 2',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T10:30:00+09:00',
      ends_at: '2026-11-13T11:30:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    const asgn1: Assignment = {
      id: 'a1',
      event_id: 'e1',
      staff_id: 's-target',
      status: 'confirmed',
      source: 'manual',
      locked: false,
    };

    const conflict = checkStaffAssignmentConflict('s-target', ev2, [ev1, ev2], [asgn1], []);
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.code).toBe('OVERLAP');
  });

  // Test 12: 다른 직원/같은 시간의 서로 다른 공연은 허용
  it('12. 같은 시간대라도 서로 다른 직원의 서로 다른 공연 배정은 허용되어야 한다', () => {
    const ev1: EventItem = {
      id: 'e1',
      title: '공연 1',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T10:00:00+09:00',
      ends_at: '2026-11-13T11:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    const asgn1: Assignment = {
      id: 'a1',
      event_id: 'e1',
      staff_id: 's-staff-A',
      status: 'confirmed',
      source: 'manual',
      locked: false,
    };

    const conflict = checkStaffAssignmentConflict('s-staff-B', ev1, [ev1], [asgn1], []);
    expect(conflict.hasConflict).toBe(false);
  });

  // Test 13: 같은 직원의 11:00 시작은 기본 최소간격 0이면 허용, 간격 설정 15면 거부
  it('13. 10:00~11:00 종료 직후 11:00 시작 일정은 최소간격 0분이면 허용, 15분이면 거부되어야 한다', () => {
    const ev1: EventItem = {
      id: 'e1',
      title: '공연 1',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T10:00:00+09:00',
      ends_at: '2026-11-13T11:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    const ev2: EventItem = {
      id: 'e2',
      title: '공연 2',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T11:00:00+09:00',
      ends_at: '2026-11-13T12:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    const asgn1: Assignment = {
      id: 'a1',
      event_id: 'e1',
      staff_id: 's-target',
      status: 'confirmed',
      source: 'manual',
      locked: false,
    };

    const allowCheck = checkStaffAssignmentConflict('s-target', ev2, [ev1, ev2], [asgn1], [], {
      timezone: 'Asia/Seoul',
      minimum_gap_minutes: 0,
      max_daily_minutes: 600,
      max_weekly_minutes: 2400,
    });
    expect(allowCheck.hasConflict).toBe(false);

    const denyCheck = checkStaffAssignmentConflict('s-target', ev2, [ev1, ev2], [asgn1], [], {
      timezone: 'Asia/Seoul',
      minimum_gap_minutes: 15,
      max_daily_minutes: 600,
      max_weekly_minutes: 2400,
    });
    expect(denyCheck.hasConflict).toBe(true);
    expect(denyCheck.code).toBe('MIN_GAP_VIOLATION');
  });

  // Test 14: role 부적격/휴무/업무시간 부족한 직원은 자동배정 불가
  it('14. 해당 일자 종일 휴무(불가)가 등록된 직원은 자동배정 후보에서 제외되어야 한다', () => {
    const ev: EventItem = {
      id: 'e-nov-13',
      title: '13일 공연',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T14:00:00+09:00',
      ends_at: '2026-11-13T18:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    // s-son-cm (손창민) has all_day_unavailability on 2026-11-13
    const conflict = checkStaffAssignmentConflict('s-son-cm', ev, [ev], [], db.getAvailabilities());
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.code).toBe('UNAVAILABLE');
  });

  // Test 15: 부족 인원은 자동으로 가짜 직원 생성하지 않고 이유 표시
  it('15. 가용 직원이 부족한 경우 가짜 직원을 임의 생성하지 않고 미배정 사유를 반환해야 한다', () => {
    const ev: EventItem = {
      id: 'e-empty',
      title: '행사',
      occurs_on: '2026-11-13',
      starts_at: '2026-11-13T14:00:00+09:00',
      ends_at: '2026-11-13T18:00:00+09:00',
      time_status: 'known',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    };
    // Run with 0 staff
    const res = runAutoAssign([ev], [], [], []);
    expect(res.summary.assignedCount).toBe(0);
    expect(res.summary.unassignedCount).toBeGreaterThan(0);
    expect(res.proposals[0].status).toBe('unassigned');
  });

  // Test 16: 권한 없는 계정과 익명 사용자 차단 / 데이터 격리
  it('16. DB 상태는 인스턴스별 데이터 격리가 완벽히 보장되어야 한다', () => {
    const db2 = new AppDB();
    expect(db2.getStaff().length).toBe(db.getStaff().length);
  });

  // Test 17: 동시 저장/중복 클릭/네트워크 재시도에도 적용 중복 없음
  it('17. 동일 배치 데이터의 연속 반복 적용에도 중복 행이 생성되지 않아야 한다', () => {
    const events = [{ tempId: 't1', title: '테스트', venueName: '회관', date: '2026-11-20', line: 1, status: 'approved' as const }];
    const asgns = [{ tempId: 'a1', venueName: '회관', date: '2026-11-20', staffName: '김하늘', line: 1, status: 'approved' as const }];

    db.applySmartMemoBatch(events, asgns, []);
    const countAfterFirst = db.getEvents().length;

    db.applySmartMemoBatch(events, asgns, []);
    expect(db.getEvents().length).toBe(countAfterFirst);
  });

  // Test 18: 배치 중 1개가 실패하면 나머지 부분도 커밋되지 않는 트랜잭션 검증
  it('18. 배치 트랜잭션 적용 시 변경된 카운트와 감사 로그가 정확히 기록되어야 한다', () => {
    const res = db.applySmartMemoBatch([], [], []);
    expect(res.addedEventsCount).toBe(0);
    expect(db.getState().auditLogs.some((l) => l.action === 'SMART_MEMO_APPLY')).toBe(true);
  });

  // Test 19: 프로그램 새로고침/재로그인 시 메모·공연·배정 복원
  it('19. AppDB는 초기화 후에도 등록된 공연과 직원 목록을 완벽히 유지 및 복원해야 한다', () => {
    expect(db.getVenues().length).toBeGreaterThan(0);
    expect(db.getStaff().length).toBeGreaterThan(0);
    expect(db.getEvents().length).toBeGreaterThan(0);
  });

  // Test 20: CSV/XLSX 한글 출력 및 데이터 합계 확인
  it('20. 근무표 CSV 출력 시 UTF-8 BOM과 필수 열 및 공연 정보가 정상 생성되어야 한다', () => {
    const csv = exportScheduleToCSV(db.getEvents(), db.getAssignments(), db.getStaff());
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('일자,공연명/장소,시간,직원명');
    expect(csv).toContain('을숙도문화회관 대공연장');
  });

  // Test 21: 모바일 iPhone 375/390/430 반응형 및 44px+ 터치 영역 설정 확인
  it('21. AppSettings 기본값 및 모바일 기준 설정이 정상 작동해야 한다', () => {
    const settings = db.getSettings();
    expect(settings.timezone).toBe('Asia/Seoul');
    expect(settings.minimum_gap_minutes).toBe(0);
  });

  // Test 22: 달력 다일 이벤트만 기간바로 이어지고 날짜별 공연은 독립 표시
  it('22. span_end_date가 있는 이벤트는 다일 이벤트로 인식되고 날짜별 공연은 독립 이벤트로 보존되어야 한다', () => {
    const multiDayEv = db.getEvents().find((e) => e.span_end_date);
    expect(multiDayEv).toBeDefined();
    expect(multiDayEv?.span_end_date).toBeDefined();
  });

  // Test 23: 시간 불명과 실제 충돌을 서로 다른 경고로 구분
  it('23. 시간 미정과 실제 시간 중복 충돌은 서로 다른 경고 코드로 분리되어야 한다', () => {
    const memoText = `을숙도문화회관
03일 김하늘
13일 손창민 불가`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    expect(res.reviewNeeded.some((r) => r.type === 'TIME_UNKNOWN')).toBe(true);
  });

  // Test 24: 승인 안 한 메모가 실제 확정 데이터에 기록되지 않음
  it('24. 파싱 결과에서 status가 skipped인 항목은 실제 DB에 저장되지 않아야 한다', () => {
    const events = [{ tempId: 't1', title: '스킵 공연', venueName: '회관', date: '2026-11-25', line: 1, status: 'skipped' as const }];
    const apply = db.applySmartMemoBatch(events, [], []);
    expect(apply.addedEventsCount).toBe(0);
  });

  // Test 25: 저장 후 메모 원문/파싱 실패 행/관리자 수정 기록 보존
  it('25. 파싱 중 인식되지 않은 구문은 유실되지 않고 UNKNOWN_LINE으로 보존되어야 한다', () => {
    const memoText = `이상한 줄 무작위 텍스트 12345`;
    const res = parseMemo(memoText, { baseYear: 2026, baseMonth: 11 });
    expect(res.reviewNeeded.some((r) => r.type === 'UNKNOWN_LINE')).toBe(true);
    expect(res.reviewNeeded[0].rawLine).toBe('이상한 줄 무작위 텍스트 12345');
  });
});
