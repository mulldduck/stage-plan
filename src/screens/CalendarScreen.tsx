import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  Search,
  Plus,
  Users,
  Clock,
  Lock,
  Unlock,
  X,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  CalendarX2,
  ArrowRight,
} from 'lucide-react';
import { db } from '../storage/db';
import { EventItem, Assignment, Staff } from '../types';

interface CalendarScreenProps {
  onOpenSmartMemo: () => void;
  initialSelectedDay?: number;
  showAppliedSheet?: boolean;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onOpenSmartMemo,
  initialSelectedDay = 13,
  showAppliedSheet = false,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(initialSelectedDay);
  const [isAppliedSheetOpen, setIsAppliedSheetOpen] = useState(showAppliedSheet);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');

  const events = db.getEvents();
  const assignments = db.getAssignments();
  const staffList = db.getStaff();
  const availabilities = db.getAvailabilities();

  const monthPills = ['11월', '12월', '2027', '1월', '2월'];
  const [activeMonthPill, setActiveMonthPill] = useState('11월');

  // Days of November 2026: Nov 1 is Sunday
  // Calendar grid: 5 weeks (35 cells)
  const calendarDays = [
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true, event: '을숙도문화회관 대공연장', color: '#84CC16' },
    { day: 4, isCurrentMonth: true, event: '을숙도문화회관 대공연장', color: '#84CC16' },
    { day: 5, isCurrentMonth: true, event: '예술의전당 자유소극장', color: '#22C55E' },
    { day: 6, isCurrentMonth: true, event: '예술의전당 자유소극장', color: '#22C55E' },
    { day: 7, isCurrentMonth: true, event: '예술의전당 자유소극장', color: '#22C55E' },

    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true, event: '경성대 콘서트홀 포커스온', color: '#F97316' },
    { day: 11, isCurrentMonth: true, event: '경성대 콘서트홀 포커스온', color: '#F97316' },
    { day: 12, isCurrentMonth: true, event: '신아아트센터 황소', color: '#06B6D4' },
    { day: 13, isCurrentMonth: true, event: '신아아트센터 황소', color: '#06B6D4', hasNewBadge: true },
    { day: 14, isCurrentMonth: true },

    { day: 15, isCurrentMonth: true, event: '경주예술의전당 원화홀', color: '#EAB308' },
    { day: 16, isCurrentMonth: true, event: '경주예술의전당 원화홀', color: '#EAB308' },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },

    { day: 22, isCurrentMonth: true, event: '부산시민회관 소극장 미스 줄리', color: '#EAB308' },
    { day: 23, isCurrentMonth: true, event: '부산시민회관 소극장 미스 줄리', color: '#EAB308' },
    { day: 24, isCurrentMonth: true, event: '부산시민회관 소극장 미스 줄리', color: '#EAB308' },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },

    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
    { day: 5, isCurrentMonth: false },
  ];

  const selectedDateStr = `2026-11-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = events.filter((e) => e.occurs_on === selectedDateStr);
  const dayAvails = availabilities.filter((a) => a.on_date === selectedDateStr);

  const handleCreateEvent = () => {
    if (!newEventTitle) return;
    db.addEvent({
      title: newEventTitle,
      venue_name: newEventVenue || '공연장',
      occurs_on: selectedDateStr,
      time_status: 'unknown',
      status: 'confirmed',
      color: '#3B82F6',
      source_kind: 'manual',
    });
    setNewEventTitle('');
    setNewEventVenue('');
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col relative px-3 pt-1">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between py-2 border-b border-[#1A253E]">
        <div className="flex items-center gap-2">
          <button className="text-[#8592B0] hover:text-[#F4F7FF] p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 font-bold text-base text-[#F4F7FF] cursor-pointer">
            <span>11월</span>
            <ChevronDown className="w-4 h-4 text-[#8592B0]" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="text-[#8592B0] hover:text-[#F4F7FF] p-1">
            <Search className="w-4 h-4" />
          </button>
          <div className="bg-[#1A253E] text-[#8592B0] text-xs font-semibold px-2 py-0.5 rounded-full">
            10
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#4169FF] to-[#6258F5] flex items-center justify-center text-xs font-bold text-white shadow-sm">
            성
          </div>
        </div>
      </div>

      {/* ── Month Pills ── */}
      <div className="flex gap-1.5 py-2 overflow-x-auto no-scrollbar">
        {monthPills.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMonthPill(m)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              activeMonthPill === m
                ? 'bg-[#4169FF] text-white'
                : 'bg-[#151D30] text-[#8592B0] hover:text-[#C5D0E8]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Day of Week Headers ── */}
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#8592B0] py-1 border-b border-[#1A253E]/50">
        <span className="text-[#F66B78]">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>

      {/* ── Monthly Grid (7 columns) ── */}
      <div className="grid grid-cols-7 gap-y-1.5 py-1 text-center text-xs">
        {calendarDays.map((c, idx) => {
          const isSelected = c.isCurrentMonth && c.day === selectedDay;
          return (
            <div
              key={idx}
              onClick={() => c.isCurrentMonth && setSelectedDay(c.day)}
              className={`flex flex-col items-center min-h-[58px] p-0.5 rounded-lg transition-all cursor-pointer relative ${
                isSelected ? 'bg-[#1A2644] ring-1 ring-[#4169FF]' : 'hover:bg-[#121A2E]'
              } ${!c.isCurrentMonth ? 'opacity-30' : ''}`}
            >
              {/* Day number & NEW badge */}
              <div className="flex items-center justify-center gap-1 w-full relative">
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-medium ${
                    isSelected ? 'bg-[#4169FF] text-white font-bold' : 'text-[#E2E8F0]'
                  }`}
                >
                  {c.day}
                </span>
                {c.hasNewBadge && (
                  <span className="absolute -top-1 -right-0.5 bg-[#4169FF] text-[8px] font-extrabold text-white px-1 py-0.2 rounded shadow">
                    NEW
                  </span>
                )}
              </div>

              {/* Event bar on calendar */}
              {c.event && (
                <div
                  style={{ backgroundColor: c.color || '#4169FF' }}
                  className="w-full mt-1 py-0.5 px-1 rounded text-[9px] font-bold text-black truncate text-left shadow-sm leading-tight"
                >
                  {c.event}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Selected Day Summary Section ── */}
      <div className="mt-2 bg-[#151D30] border border-[#23304E] rounded-2xl p-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2B48]">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#4169FF]" />
            <span className="text-xs font-bold text-[#F4F7FF]">
              11월 {selectedDay}일 일정 ({dayEvents.length}건)
            </span>
          </div>
          <button
            onClick={() => onOpenSmartMemo()}
            className="text-[11px] font-medium text-[#4169FF] bg-[#4169FF]/10 hover:bg-[#4169FF]/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
          >
            스마트 메모 열기 →
          </button>
        </div>

        {/* Day Events List */}
        <div className="mt-2 space-y-2 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
          {dayEvents.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#8592B0]">
              등록된 공연 일정이 없습니다.
            </div>
          ) : (
            dayEvents.map((ev) => {
              const evAsgns = assignments.filter((a) => a.event_id === ev.id && a.status !== 'cancelled');
              return (
                <div key={ev.id} className="bg-[#0B1020] border border-[#23304E] rounded-xl p-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#F4F7FF]">{ev.title}</div>
                      <div className="text-[11px] text-[#8592B0] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#F5AD43]" />
                          {ev.time_status === 'known' && ev.starts_at && ev.ends_at
                            ? `${new Date(ev.starts_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ ${new Date(ev.ends_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                            : '시간 미정'}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{ backgroundColor: `${ev.color || '#4169FF'}25`, color: ev.color || '#4169FF' }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                    >
                      {ev.venue_name || '공연장'}
                    </span>
                  </div>

                  {/* Assigned staff list */}
                  <div className="mt-2 pt-2 border-t border-[#1C263E] flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#8592B0] flex items-center gap-1">
                      <Users className="w-3 h-3" /> 배정:
                    </span>
                    {evAsgns.length === 0 ? (
                      <span className="text-[10px] text-[#F5AD43]">미배정 (필요인원 미설정)</span>
                    ) : (
                      evAsgns.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1 bg-[#1A253E] border border-[#263554] rounded-md px-1.5 py-0.5 text-[10px] text-[#C5D0E8]"
                        >
                          <span>{a.staff_name}</span>
                          <button
                            onClick={() => db.toggleAssignmentLock(a.id)}
                            className="text-[#8592B0] hover:text-[#4169FF]"
                          >
                            {a.locked ? <Lock className="w-2.5 h-2.5 text-[#31C48D]" /> : <Unlock className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Unavailability on day */}
          {dayAvails.length > 0 && (
            <div className="bg-[#24151B] border border-[#F66B78]/30 rounded-xl p-2.5 flex items-center gap-2">
              <CalendarX2 className="w-4 h-4 text-[#F66B78] shrink-0" />
              <div className="text-[11px] text-[#F66B78]">
                {dayAvails.map((a) => `${a.staff_name} (${a.description})`).join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Action Button [+] ── */}
      <button
        onClick={() => setIsAddEventModalOpen(true)}
        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#4169FF] hover:bg-[#3458DB] text-white flex items-center justify-center shadow-xl shadow-[#4169FF]/30 transition-transform active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* ── Add Event Modal ── */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151D30] border border-[#23304E] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202C48]">
              <h3 className="text-sm font-bold text-[#F4F7FF]">11월 {selectedDay}일 새 공연 등록</h3>
              <button onClick={() => setIsAddEventModalOpen(false)} className="text-[#8592B0] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] text-[#8592B0] block mb-1">공연명</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="예: 국립국악원 정기공연"
                  className="w-full bg-[#0B1020] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#F4F7FF] outline-none focus:border-[#4169FF]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8592B0] block mb-1">공연장/장소</label>
                <input
                  type="text"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  placeholder="예: 예악당"
                  className="w-full bg-[#0B1020] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#F4F7FF] outline-none focus:border-[#4169FF]"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="flex-1 h-10 bg-[#0B1020] border border-[#23304E] text-xs text-[#8592B0] rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={handleCreateEvent}
                className="flex-1 h-10 bg-[#4169FF] text-xs text-white rounded-xl font-semibold shadow-lg shadow-[#4169FF]/20"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Applied Bottom Sheet Overlay (Screen 4 from mock) ── */}
      {isAppliedSheetOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:absolute max-w-[430px] mx-auto z-50 bg-[#151D30] border-t border-[#23304E] rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="w-10 h-1 bg-[#3A4768] rounded-full mx-auto mb-3"></div>

          <div className="flex items-center justify-between pb-2 border-b border-[#202C48]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#4169FF] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-[#F4F7FF]">메모 동기화 완료</h2>
            </div>
            <button onClick={() => setIsAppliedSheetOpen(false)} className="text-[#8592B0] hover:text-[#F4F7FF] p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#8592B0] mt-1.5 mb-3">11월 13일 반영 결과</p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-[#0B1020] border border-[#1E2A44] rounded-xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#4169FF]" />
                <div>
                  <div className="text-xs font-bold text-[#F4F7FF]">추가된 공연 1건</div>
                  <div className="text-[11px] text-[#8592B0]">을숙도문화회관 대공연장 (11월 13일)</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8592B0]" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0B1020] border border-[#1E2A44] rounded-xl">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4169FF]" />
                <div>
                  <div className="text-xs font-bold text-[#F4F7FF]">배정된 직원 3명</div>
                  <div className="text-[11px] text-[#8592B0]">강진구, 권수현, 이영석</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8592B0]" />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#0B1020] border border-[#1E2A44] rounded-xl">
              <div className="flex items-center gap-2">
                <CalendarX2 className="w-4 h-4 text-[#F66B78]" />
                <div>
                  <div className="text-xs font-bold text-[#F4F7FF]">불가 일정 1건</div>
                  <div className="text-[11px] text-[#8592B0]">손창민 (11월 13일, 불가)</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8592B0]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
