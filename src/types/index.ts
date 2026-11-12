export type TimeStatus = 'known' | 'unknown';
export type EventStatus = 'draft' | 'confirmed' | 'cancelled';
export type AssignmentStatus = 'tentative' | 'confirmed' | 'cancelled';
export type AssignmentSource = 'manual' | 'note' | 'auto';

export interface Staff {
  id: string;
  owner_id?: string;
  employee_code?: string;
  display_name: string;
  team?: string;
  is_active: boolean;
  notes?: string;
  roles?: string[];
  aliases?: string[];
  created_at?: string;
}

export interface Venue {
  id: string;
  owner_id?: string;
  display_name: string;
  aliases?: string[];
  address?: string;
}

export interface EventItem {
  id: string;
  owner_id?: string;
  title: string;
  venue_id?: string;
  venue_name?: string;
  occurs_on: string; // YYYY-MM-DD
  starts_at?: string | null; // ISO timestamptz
  ends_at?: string | null; // ISO timestamptz
  time_status: TimeStatus;
  prep_minutes?: number;
  wrap_minutes?: number;
  status: EventStatus;
  color: string;
  source_kind: 'manual' | 'note';
  source_ref?: string;
  organizer_hint?: string;
  note_text?: string;
  version?: number;
  span_end_date?: string; // For multi-day bar events if specified
}

export interface Assignment {
  id: string;
  owner_id?: string;
  event_id: string;
  staff_id: string;
  staff_name?: string;
  role_id?: string;
  role_name?: string;
  status: AssignmentStatus;
  source: AssignmentSource;
  locked: boolean;
  occupied_start?: string | null;
  occupied_end?: string | null;
  version?: number;
}

export interface AvailabilityBlock {
  id: string;
  owner_id?: string;
  staff_id: string;
  staff_name?: string;
  block_type: 'all_day_unavailability' | 'event_exclusion' | 'external_commitment' | 'available_override';
  on_date: string; // YYYY-MM-DD
  start_at?: string | null;
  end_at?: string | null;
  all_day: boolean;
  event_id?: string;
  description: string;
  verification_status: 'pending' | 'confirmed';
}

export interface SmartNoteItem {
  id: string;
  title: string;
  body: string;
  note_type: 'event' | 'staff' | 'mixed';
  default_year: number;
  default_month: number;
  created_at: string;
  updated_at: string;
}

export interface ParsedEventCandidate {
  tempId: string;
  title: string;
  venueName: string;
  date: string; // YYYY-MM-DD
  organizerHint?: string;
  line: number;
  matchedVenueId?: string;
  status: 'approved' | 'pending_review' | 'skipped';
}

export interface ParsedAssignmentCandidate {
  tempId: string;
  eventTempId?: string;
  venueName: string;
  date: string; // YYYY-MM-DD
  staffName: string;
  matchedStaffId?: string;
  line: number;
  status: 'approved' | 'pending_review' | 'conflict' | 'skipped';
  conflictReason?: string;
  resolution?: 'link_staff' | 'new_event' | 'ignore';
}

export interface ParsedUnavailabilityCandidate {
  tempId: string;
  staffName: string;
  matchedStaffId?: string;
  date: string; // YYYY-MM-DD
  type: 'all_day_unavailability' | 'event_exclusion' | 'external_commitment';
  description: string;
  line: number;
  status: 'approved' | 'pending_review' | 'skipped';
}

export interface ReviewItem {
  tempId: string;
  type: 'TIME_UNKNOWN' | 'AMBIGUOUS_STAFF' | 'EXTERNAL_COMMITMENT' | 'UNMAPPED_VENUE' | 'UNKNOWN_LINE' | 'CONFLICT';
  title: string;
  description: string;
  rawLine: string;
  line: number;
  targetRef?: string;
}

export interface ParseResult {
  events: ParsedEventCandidate[];
  assignments: ParsedAssignmentCandidate[];
  unavailabilities: ParsedUnavailabilityCandidate[];
  reviewNeeded: ReviewItem[];
  stats: {
    eventsCount: number;
    assignmentsCount: number;
    unavailabilitiesCount: number;
    reviewNeededCount: number;
  };
}

export interface AppSettings {
  timezone: string;
  minimum_gap_minutes: number;
  max_daily_minutes: number;
  max_weekly_minutes: number;
}
