import {
  Staff,
  Venue,
  EventItem,
  Assignment,
  AvailabilityBlock,
  SmartNoteItem,
  AppSettings,
  ParsedEventCandidate,
  ParsedAssignmentCandidate,
  ParsedUnavailabilityCandidate,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_VENUES,
  INITIAL_EVENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_AVAILABILITIES,
  INITIAL_SETTINGS,
} from './initialData';

const DB_KEY = 'stage_plan_db_v1';

export interface DBState {
  venues: Venue[];
  staff: Staff[];
  events: EventItem[];
  assignments: Assignment[];
  availabilities: AvailabilityBlock[];
  notes: SmartNoteItem[];
  settings: AppSettings;
  auditLogs: Array<{ action: string; timestamp: string; details: any }>;
}

function getStoredState(): DBState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      venues: [...INITIAL_VENUES],
      staff: [...INITIAL_STAFF],
      events: [...INITIAL_EVENTS],
      assignments: [...INITIAL_ASSIGNMENTS],
      availabilities: [...INITIAL_AVAILABILITIES],
      notes: [],
      settings: { ...INITIAL_SETTINGS },
      auditLogs: [],
    };
  }

  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const initialState: DBState = {
      venues: [...INITIAL_VENUES],
      staff: [...INITIAL_STAFF],
      events: [...INITIAL_EVENTS],
      assignments: [...INITIAL_ASSIGNMENTS],
      availabilities: [...INITIAL_AVAILABILITIES],
      notes: [],
      settings: { ...INITIAL_SETTINGS },
      auditLogs: [{ action: 'INITIALIZE', timestamp: new Date().toISOString(), details: '초기 시드 데이터 로드' }],
    };
    window.localStorage.setItem(DB_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse DB from localStorage, falling back to initial data', e);
    return {
      venues: [...INITIAL_VENUES],
      staff: [...INITIAL_STAFF],
      events: [...INITIAL_EVENTS],
      assignments: [...INITIAL_ASSIGNMENTS],
      availabilities: [...INITIAL_AVAILABILITIES],
      notes: [],
      settings: { ...INITIAL_SETTINGS },
      auditLogs: [],
    };
  }
}

function saveState(state: DBState) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(state));
  }
}

export class AppDB {
  private state: DBState;

  constructor() {
    this.state = getStoredState();
  }

  public getState(): DBState {
    return this.state;
  }

  public resetToDefault(): void {
    this.state = {
      venues: [...INITIAL_VENUES],
      staff: [...INITIAL_STAFF],
      events: [...INITIAL_EVENTS],
      assignments: [...INITIAL_ASSIGNMENTS],
      availabilities: [...INITIAL_AVAILABILITIES],
      notes: [],
      settings: { ...INITIAL_SETTINGS },
      auditLogs: [{ action: 'RESET', timestamp: new Date().toISOString(), details: '기본값 리셋' }],
    };
    saveState(this.state);
  }

  // --- Venues ---
  public getVenues(): Venue[] {
    return this.state.venues;
  }

  public addVenue(venue: Omit<Venue, 'id'>): Venue {
    const newV: Venue = { ...venue, id: `v-${Date.now()}` };
    this.state.venues.push(newV);
    saveState(this.state);
    return newV;
  }

  // --- Staff ---
  public getStaff(): Staff[] {
    return this.state.staff;
  }

  public addStaff(staff: Omit<Staff, 'id'>): Staff {
    const newS: Staff = { ...staff, id: `s-${Date.now()}` };
    this.state.staff.push(newS);
    saveState(this.state);
    return newS;
  }

  public updateStaff(id: string, updates: Partial<Staff>): Staff | null {
    const idx = this.state.staff.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.state.staff[idx] = { ...this.state.staff[idx], ...updates };
    saveState(this.state);
    return this.state.staff[idx];
  }

  // --- Events ---
  public getEvents(): EventItem[] {
    return this.state.events;
  }

  public addEvent(event: Omit<EventItem, 'id'>): EventItem {
    const newE: EventItem = { ...event, id: `evt-${Date.now()}` };
    this.state.events.push(newE);
    saveState(this.state);
    return newE;
  }

  // --- Assignments ---
  public getAssignments(): Assignment[] {
    return this.state.assignments;
  }

  public addAssignment(asgn: Omit<Assignment, 'id'>): Assignment {
    const newA: Assignment = { ...asgn, id: `asgn-${Date.now()}` };
    this.state.assignments.push(newA);
    saveState(this.state);
    return newA;
  }

  public toggleAssignmentLock(asgnId: string): boolean {
    const asgn = this.state.assignments.find((a) => a.id === asgnId);
    if (!asgn) return false;
    asgn.locked = !asgn.locked;
    saveState(this.state);
    return asgn.locked;
  }

  // --- Availabilities ---
  public getAvailabilities(): AvailabilityBlock[] {
    return this.state.availabilities;
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return this.state.settings;
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    this.state.settings = { ...this.state.settings, ...settings };
    saveState(this.state);
    return this.state.settings;
  }

  /**
   * Atomic batch application of approved items from Smart Memo
   * Enforces idempotency, lock protection, and transactional integrity
   */
  public applySmartMemoBatch(
    approvedEvents: ParsedEventCandidate[],
    approvedAssignments: ParsedAssignmentCandidate[],
    approvedUnavailabilities: ParsedUnavailabilityCandidate[],
    noteSource?: string
  ): {
    addedEventsCount: number;
    addedAssignmentsCount: number;
    addedUnavailabilitiesCount: number;
    preservedLockedCount: number;
  } {
    let addedEventsCount = 0;
    let addedAssignmentsCount = 0;
    let addedUnavailabilitiesCount = 0;
    let preservedLockedCount = 0;

    const eventTempIdToRealId = new Map<string, string>();

    // 1. Process Events
    for (const cand of approvedEvents) {
      if (cand.status === 'skipped') continue;

      // Idempotency check: see if event on same date with same venue/title already exists
      let existingEvent = this.state.events.find(
        (e) => e.occurs_on === cand.date && (e.venue_name === cand.venueName || e.title.includes(cand.venueName))
      );

      if (!existingEvent) {
        const newEvent: EventItem = {
          id: `evt-note-${cand.date}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: cand.title,
          venue_name: cand.venueName,
          occurs_on: cand.date,
          time_status: 'unknown',
          status: 'confirmed',
          color: '#3B82F6',
          source_kind: 'note',
          source_ref: noteSource || '스마트 메모',
          organizer_hint: cand.organizerHint,
        };
        this.state.events.push(newEvent);
        existingEvent = newEvent;
        addedEventsCount++;
      }

      eventTempIdToRealId.set(cand.tempId, existingEvent.id);
    }

    // 2. Process Assignments
    for (const cand of approvedAssignments) {
      if (cand.status === 'skipped') continue;

      // Find staff
      let staff = this.state.staff.find((s) => s.id === cand.matchedStaffId || s.display_name === cand.staffName);
      if (!staff) {
        // Create staff if approved
        staff = {
          id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          display_name: cand.staffName,
          team: '현장팀',
          is_active: true,
          roles: ['진행'],
        };
        this.state.staff.push(staff);
      }

      // Find target event ID
      let eventId: string | undefined;
      if (cand.eventTempId && eventTempIdToRealId.has(cand.eventTempId)) {
        eventId = eventTempIdToRealId.get(cand.eventTempId);
      } else {
        const ev = this.state.events.find((e) => e.occurs_on === cand.date && (e.venue_name === cand.venueName || e.title.includes(cand.venueName)));
        eventId = ev?.id;
      }

      if (!eventId) continue;

      // Check if assignment already exists
      const existingAsgn = this.state.assignments.find((a) => a.event_id === eventId && a.staff_id === staff!.id);

      if (existingAsgn) {
        if (existingAsgn.locked) {
          preservedLockedCount++;
          continue; // Locked assignment is untouched
        }
        // Already exists, don't duplicate (idempotent)
        continue;
      }

      const newAsgn: Assignment = {
        id: `asgn-note-${eventId}-${staff.id}-${Date.now()}`,
        event_id: eventId,
        staff_id: staff.id,
        staff_name: staff.display_name,
        role_name: '진행/운영',
        status: 'confirmed',
        source: 'note',
        locked: false,
      };

      this.state.assignments.push(newAsgn);
      addedAssignmentsCount++;
    }

    // 3. Process Unavailabilities
    for (const cand of approvedUnavailabilities) {
      if (cand.status === 'skipped') continue;

      let staff = this.state.staff.find((s) => s.id === cand.matchedStaffId || s.display_name === cand.staffName);
      if (!staff) {
        staff = {
          id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          display_name: cand.staffName,
          team: '현장팀',
          is_active: true,
          roles: ['진행'],
        };
        this.state.staff.push(staff);
      }

      // Check duplicate unavailability
      const exists = this.state.availabilities.find(
        (b) => b.staff_id === staff!.id && b.on_date === cand.date && b.block_type === cand.type
      );

      if (!exists) {
        const newBlock: AvailabilityBlock = {
          id: `blk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staff_id: staff.id,
          staff_name: staff.display_name,
          block_type: cand.type,
          on_date: cand.date,
          all_day: cand.type === 'all_day_unavailability',
          description: cand.description,
          verification_status: 'confirmed',
        };
        this.state.availabilities.push(newBlock);
        addedUnavailabilitiesCount++;
      }
    }

    this.state.auditLogs.push({
      action: 'SMART_MEMO_APPLY',
      timestamp: new Date().toISOString(),
      details: { addedEventsCount, addedAssignmentsCount, addedUnavailabilitiesCount, preservedLockedCount },
    });

    saveState(this.state);

    return {
      addedEventsCount,
      addedAssignmentsCount,
      addedUnavailabilitiesCount,
      preservedLockedCount,
    };
  }
}

export const db = new AppDB();
