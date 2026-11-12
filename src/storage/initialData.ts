import { Staff, Venue, EventItem, Assignment, AvailabilityBlock, AppSettings } from '../types';

export const INITIAL_VENUES: Venue[] = [
  { id: 'v-eulsukdo', display_name: '을숙도문화회관 대공연장', aliases: ['을숙도문화회관', '을숙도'] },
  { id: 'v-sac-free', display_name: '서울예술의전당 자유소극장', aliases: ['예술의전당', '자유소극장'] },
  { id: 'v-seosan', display_name: '서산시문화회관', aliases: ['서산문화회관'] },
  { id: 'v-kyungsung', display_name: '경성대 콘서트홀 포커스온', aliases: ['경성대', '포커스온'] },
  { id: 'v-shina', display_name: '신아아트센터 황소', aliases: ['신아아트센터'] },
  { id: 'v-gyeongju', display_name: '경주예술의전당 원화홀', aliases: ['경주예술의전당'] },
  { id: 'v-busan-hall', display_name: '부산시민회관 소극장 미스 줄리', aliases: ['부산시민회관'] },
  { id: 'v-geumjeong', display_name: '금정문화회관', aliases: ['금정'] },
];

export const INITIAL_STAFF: Staff[] = [
  { id: 's-kang-jg', employee_code: 'STF-001', display_name: '강진구', team: '운영팀', is_active: true, roles: ['무대총괄', '진행'] },
  { id: 's-son-cm', employee_code: 'STF-002', display_name: '손창민', team: '기술팀', is_active: true, roles: ['음향', '무대'] },
  { id: 's-choi-sb', employee_code: 'STF-003', display_name: '최성빈', team: '조명팀', is_active: true, roles: ['조명'] },
  { id: 's-kwon-sh', employee_code: 'STF-004', display_name: '권수현', team: '하우스팀', is_active: true, roles: ['하우스', '진행'] },
  { id: 's-park-wi', employee_code: 'STF-005', display_name: '박우일', team: '기술팀', is_active: true, roles: ['무대', '진행'] },
  { id: 's-kim-hn', employee_code: 'STF-006', display_name: '김하늘', team: '기획팀', is_active: true, roles: ['진행', '운영'] },
  { id: 's-jung-de', employee_code: 'STF-007', display_name: '정다은', team: '운영팀', is_active: true, roles: ['진행', '하우스'] },
  { id: 's-oh-jm', employee_code: 'STF-008', display_name: '오지민', team: '기술팀', is_active: true, roles: ['음향', '조명'] },
  { id: 's-han-dy', employee_code: 'STF-009', display_name: '한도윤', team: '하우스팀', is_active: true, roles: ['하우스'] },
  { id: 's-lee-yj', employee_code: 'STF-010', display_name: '이영준', team: '기술팀', is_active: true, roles: ['무대'] },
  { id: 's-oh-ys', employee_code: 'STF-011', display_name: '오윤서', team: '운영팀', is_active: true, roles: ['진행'] },
  { id: 's-son-yj', employee_code: 'STF-012', display_name: '손예진', team: '하우스팀', is_active: true, roles: ['안내'] },
  { id: 's-yoon-dh', employee_code: 'STF-013', display_name: '윤도현', team: '기술팀', is_active: true, roles: ['음향'] },
  { id: 's-lee-ny', employee_code: 'STF-014', display_name: '이나영', team: '기획팀', is_active: true, roles: ['기획'] },
  { id: 's-lee-ys', employee_code: 'STF-015', display_name: '이영석', team: '운영팀', is_active: true, roles: ['무대'] },
  { id: 's-geum-jm', employee_code: 'STF-016', display_name: '금정민', team: '조명팀', is_active: true, roles: ['조명'], aliases: ['금정'] },
  { id: 's-park-sj', employee_code: 'STF-017', display_name: '박서준', team: '운영팀', is_active: true, roles: ['진행'] },
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-nov-03',
    title: '을숙도문화회관 대공연장',
    venue_id: 'v-eulsukdo',
    venue_name: '을숙도문화회관 대공연장',
    occurs_on: '2026-11-03',
    starts_at: '2026-11-03T14:00:00+09:00',
    ends_at: '2026-11-03T18:00:00+09:00',
    span_end_date: '2026-11-04',
    time_status: 'known',
    status: 'confirmed',
    color: '#84CC16', // lime green
    source_kind: 'note',
    source_ref: '11월 인원정리',
  },
  {
    id: 'evt-nov-04',
    title: '을숙도문화회관 대공연장 (2일차)',
    venue_id: 'v-eulsukdo',
    venue_name: '을숙도문화회관 대공연장',
    occurs_on: '2026-11-04',
    starts_at: '2026-11-04T14:00:00+09:00',
    ends_at: '2026-11-04T18:00:00+09:00',
    time_status: 'known',
    status: 'confirmed',
    color: '#84CC16',
    source_kind: 'note',
    source_ref: '11월 인원정리',
  },
  {
    id: 'evt-nov-05',
    title: '예술의전당 자유소극장',
    venue_id: 'v-sac-free',
    venue_name: '서울예술의전당 자유소극장',
    occurs_on: '2026-11-05',
    starts_at: '2026-11-05T15:00:00+09:00',
    ends_at: '2026-11-05T19:00:00+09:00',
    span_end_date: '2026-11-07',
    time_status: 'known',
    status: 'confirmed',
    color: '#22C55E', // emerald green
    source_kind: 'note',
    source_ref: '11월 인원정리',
  },
  {
    id: 'evt-nov-10',
    title: '경성대 콘서트홀 포커스온',
    venue_id: 'v-kyungsung',
    venue_name: '경성대 콘서트홀',
    occurs_on: '2026-11-10',
    span_end_date: '2026-11-11',
    time_status: 'unknown',
    status: 'confirmed',
    color: '#F97316', // orange
    source_kind: 'manual',
  },
  {
    id: 'evt-nov-12',
    title: '신아아트센터 황소',
    venue_id: 'v-shina',
    venue_name: '신아아트센터',
    occurs_on: '2026-11-12',
    span_end_date: '2026-11-13',
    time_status: 'unknown',
    status: 'confirmed',
    color: '#06B6D4', // cyan
    source_kind: 'manual',
  },
  {
    id: 'evt-nov-15',
    title: '경주예술의전당 원화홀',
    venue_id: 'v-gyeongju',
    venue_name: '경주예술의전당',
    occurs_on: '2026-11-15',
    span_end_date: '2026-11-16',
    time_status: 'unknown',
    status: 'confirmed',
    color: '#EAB308', // yellow
    source_kind: 'manual',
  },
  {
    id: 'evt-nov-22',
    title: '부산시민회관 소극장 미스 줄리',
    venue_id: 'v-busan-hall',
    venue_name: '부산시민회관',
    occurs_on: '2026-11-22',
    span_end_date: '2026-11-24',
    time_status: 'unknown',
    status: 'confirmed',
    color: '#EAB308', // yellow
    source_kind: 'manual',
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-01',
    event_id: 'evt-nov-03',
    staff_id: 's-kang-jg',
    staff_name: '강진구',
    role_name: '무대총괄',
    status: 'confirmed',
    source: 'note',
    locked: true,
  },
  {
    id: 'asgn-02',
    event_id: 'evt-nov-03',
    staff_id: 's-son-cm',
    staff_name: '손창민',
    role_name: '음향',
    status: 'confirmed',
    source: 'note',
    locked: false,
  },
  {
    id: 'asgn-03',
    event_id: 'evt-nov-03',
    staff_id: 's-choi-sb',
    staff_name: '최성빈',
    role_name: '조명',
    status: 'confirmed',
    source: 'note',
    locked: false,
  },
];

export const INITIAL_AVAILABILITIES: AvailabilityBlock[] = [
  {
    id: 'blk-01',
    staff_id: 's-son-cm',
    staff_name: '손창민',
    block_type: 'all_day_unavailability',
    on_date: '2026-11-13',
    all_day: true,
    description: '개인 사정 불가',
    verification_status: 'confirmed',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  timezone: 'Asia/Seoul',
  minimum_gap_minutes: 0,
  max_daily_minutes: 600,
  max_weekly_minutes: 2400,
};
