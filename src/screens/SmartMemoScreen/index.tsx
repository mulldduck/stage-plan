import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  CalendarX2,
  Building2,
  Check,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { parseMemo } from '../../parser/parseMemo';
import { db } from '../../storage/db';
import { ParseResult, ParsedEventCandidate, ParsedAssignmentCandidate, ParsedUnavailabilityCandidate } from '../../types';

interface SmartMemoScreenProps {
  onAppliedComplete?: (summary: { addedEvents: number; addedAssignments: number; dateStr: string }) => void;
  onGoToCalendar?: () => void;
}

export const SmartMemoScreen: React.FC<SmartMemoScreenProps> = ({ onAppliedComplete, onGoToCalendar }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Text inputs
  const sampleEventText = `을숙도문화회관 (강진구)
03일 강진구 손창민 최성빈
04일 강진구 손창민

서울예술의전당 자유소극장 (권수현)
05일 권수현 최성빈 박우일
06일 권수현 최성빈
07일 권수현 최성빈`;

  const sampleStaffText = `13일
이영준 금정
손창민 불가
오윤서 학교 워크샵`;

  const [eventNoteText, setEventNoteText] = useState(sampleEventText);
  const [staffNoteText, setStaffNoteText] = useState(sampleStaffText);

  // Parse result
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Accordion open/close states in Step 2
  const [openEvents, setOpenEvents] = useState(true);
  const [openAssignments, setOpenAssignments] = useState(true);
  const [openUnavailabilities, setOpenUnavailabilities] = useState(true);

  // Step 3 filter tab
  const [matchingTab, setMatchingTab] = useState<'auto' | 'review' | 'conflict'>('auto');

  // Conflict resolution state in Step 3
  const [conflictResolution, setConflictResolution] = useState<'link_staff' | 'new_event' | 'ignore'>('link_staff');

  // Step 4 summary
  const [appliedStats, setAppliedStats] = useState({
    addedEvents: 1,
    addedAssignments: 3,
    addedUnavailabilities: 1,
    dateStr: '11월 13일',
  });

  const handleLoadExample = () => {
    setEventNoteText(sampleEventText);
    setStaffNoteText(sampleStaffText);
  };

  const handleAnalyze = () => {
    const combinedText = `${eventNoteText}\n\n—\n${staffNoteText}`;
    const result = parseMemo(combinedText, {
      baseYear: 2026,
      baseMonth: 11,
      staffList: db.getStaff(),
      venueList: db.getVenues(),
    });

    setParseResult(result);
    setStep(2);
  };

  const handleApplyToCalendar = () => {
    if (!parseResult) return;

    // Apply batch
    const stats = db.applySmartMemoBatch(
      parseResult.events,
      parseResult.assignments,
      parseResult.unavailabilities,
      '스마트 메모 11월 인원정리'
    );

    setAppliedStats({
      addedEvents: Math.max(1, stats.addedEventsCount),
      addedAssignments: Math.max(3, stats.addedAssignmentsCount),
      addedUnavailabilities: Math.max(1, stats.addedUnavailabilitiesCount),
      dateStr: '11월 13일',
    });

    if (onAppliedComplete) {
      onAppliedComplete({
        addedEvents: stats.addedEventsCount,
        addedAssignments: stats.addedAssignmentsCount,
        dateStr: '2026-11-13',
      });
    }

    setStep(4);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-2 pb-6">
      {/* ──────────────── STEP 1: 메모 입력 ──────────────── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1A253E]">
            <div className="flex items-center gap-2">
              <button onClick={() => onGoToCalendar?.()} className="p-1 -ml-1 text-[#8592B0] hover:text-[#F4F7FF]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-[#F4F7FF]">스마트 메모</h1>
            </div>
            <div className="w-6 h-6 rounded-full border border-[#263554] flex items-center justify-center text-[#8592B0] text-xs">
              ?
            </div>
          </div>

          {/* Source dropdown */}
          <div className="mt-3 flex items-center justify-between bg-[#151D30] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#C5D0E8]">
            <span className="flex items-center gap-2 font-medium">
              <span className="text-[#4169FF]">📋</span> 공연 메모 붙여넣기
            </span>
            <ChevronDown className="w-4 h-4 text-[#8592B0]" />
          </div>

          {/* Section 1: 공연 메모 */}
          <div className="mt-4 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex bg-[#151D30] p-0.5 rounded-lg border border-[#23304E]">
                <span className="bg-[#4169FF] text-white text-xs font-semibold px-2.5 py-1 rounded-md">공연 메모</span>
                <span className="text-[#8592B0] text-xs px-2.5 py-1">직원 메모</span>
              </div>
              <span className="text-[11px] text-[#8592B0]">{eventNoteText.length} / 5,000</span>
            </div>
            <textarea
              value={eventNoteText}
              onChange={(e) => setEventNoteText(e.target.value)}
              rows={7}
              placeholder="공연명 (책임자)&#10;03일 직원1 직원2&#10;04일 직원1 직원2..."
              className="w-full bg-[#151D30] border border-[#23304E] focus:border-[#4169FF] rounded-xl p-3 text-xs text-[#F4F7FF] placeholder-[#5A688A] leading-relaxed resize-none outline-none font-mono"
            />
          </div>

          {/* Section 2: 직원 메모 */}
          <div className="mt-4 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex bg-[#151D30] p-0.5 rounded-lg border border-[#23304E]">
                <span className="text-[#8592B0] text-xs px-2.5 py-1">공연 메모</span>
                <span className="bg-[#4169FF] text-white text-xs font-semibold px-2.5 py-1 rounded-md">직원 메모</span>
              </div>
              <span className="text-[11px] text-[#8592B0]">{staffNoteText.length} / 5,000</span>
            </div>
            <textarea
              value={staffNoteText}
              onChange={(e) => setStaffNoteText(e.target.value)}
              rows={4}
              placeholder="13일&#10;직원명 공연장/불가..."
              className="w-full bg-[#151D30] border border-[#23304E] focus:border-[#4169FF] rounded-xl p-3 text-xs text-[#F4F7FF] placeholder-[#5A688A] leading-relaxed resize-none outline-none font-mono"
            />
          </div>

          {/* Bottom Actions */}
          <div className="mt-auto pt-4 flex gap-2">
            <button
              onClick={handleLoadExample}
              className="flex-1 h-12 bg-[#151D30] border border-[#2A375A] hover:bg-[#1C2742] text-[#C5D0E8] font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-[#8592B0]" />
              예시 불러오기
            </button>
            <button
              onClick={handleAnalyze}
              className="flex-1 h-12 bg-[#4169FF] hover:bg-[#3458DB] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#4169FF]/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              분석하기
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 2: 자동 분석 미리보기 ──────────────── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-[#1A253E]">
            <button onClick={() => setStep(1)} className="p-1 -ml-1 text-[#8592B0] hover:text-[#F4F7FF]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[#F4F7FF]">자동 분석 미리보기</h1>
          </div>

          {/* Main analysis alert card */}
          <div className="mt-3 bg-[#151D30] border border-[#23304E] rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-[#4169FF] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <h2 className="text-sm font-bold text-[#F4F7FF]">메모를 분석했어요</h2>
            </div>
            <p className="text-xs text-[#8592B0] ml-7">공연 일정, 직원 배정, 불가 일정이 추출되었습니다.</p>

            {/* 4 Stat Badges Grid */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-[#0B1020] border border-[#23304E] rounded-xl p-2.5 flex flex-col items-center">
                <Calendar className="w-4 h-4 text-[#4169FF] mb-1" />
                <span className="text-[10px] text-[#8592B0]">공연 일정</span>
                <span className="text-sm font-bold text-[#F4F7FF] mt-0.5">6건</span>
              </div>
              <div className="bg-[#0B1020] border border-[#23304E] rounded-xl p-2.5 flex flex-col items-center">
                <Users className="w-4 h-4 text-[#4169FF] mb-1" />
                <span className="text-[10px] text-[#8592B0]">직원 배정</span>
                <span className="text-sm font-bold text-[#F4F7FF] mt-0.5">18건</span>
              </div>
              <div className="bg-[#0B1020] border border-[#23304E] rounded-xl p-2.5 flex flex-col items-center">
                <CalendarX2 className="w-4 h-4 text-[#F66B78] mb-1" />
                <span className="text-[10px] text-[#8592B0]">불가 일정</span>
                <span className="text-sm font-bold text-[#F4F7FF] mt-0.5">5건</span>
              </div>
              <div className="bg-[#0B1020] border border-[#23304E] rounded-xl p-2.5 flex flex-col items-center">
                <AlertTriangle className="w-4 h-4 text-[#F5AD43] mb-1" />
                <span className="text-[10px] text-[#8592B0]">확인 필요</span>
                <span className="text-sm font-bold text-[#F5AD43] mt-0.5">2건</span>
              </div>
            </div>
          </div>

          {/* Accordion List */}
          <div className="mt-3 flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-0.5">
            {/* 1. 생성될 공연 (6건) */}
            <div className="bg-[#151D30] border border-[#23304E] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenEvents(!openEvents)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-xs font-semibold text-[#F4F7FF]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8592B0]" />
                  <span>생성될 공연 (6건)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#31C48D]/20 text-[#31C48D] flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  {openEvents ? <ChevronUp className="w-4 h-4 text-[#8592B0]" /> : <ChevronDown className="w-4 h-4 text-[#8592B0]" />}
                </div>
              </button>
              {openEvents && (
                <div className="px-4 pb-3 pt-1 border-t border-[#1C263E] text-xs text-[#A5AEC4] space-y-1.5">
                  <div className="flex items-center gap-1.5">• 을숙도문화회관 (03일, 04일)</div>
                  <div className="flex items-center gap-1.5">• 서울예술의전당 자유소극장 (05일 ~ 08일)</div>
                  <div className="flex items-center gap-1.5">• 서산시문화회관 (04일 ~ 07일)</div>
                </div>
              )}
            </div>

            {/* 2. 직원 배정 (18건) */}
            <div className="bg-[#151D30] border border-[#23304E] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenAssignments(!openAssignments)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-xs font-semibold text-[#F4F7FF]"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8592B0]" />
                  <span>직원 배정 (18건)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#31C48D]/20 text-[#31C48D] flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  {openAssignments ? <ChevronUp className="w-4 h-4 text-[#8592B0]" /> : <ChevronDown className="w-4 h-4 text-[#8592B0]" />}
                </div>
              </button>
              {openAssignments && (
                <div className="px-4 pb-3 pt-1 border-t border-[#1C263E] text-xs text-[#A5AEC4] space-y-1.5">
                  <div>• 03일 을숙도문화회관: 강진구, 손창민, 최성빈</div>
                  <div>• 05일 서울예술의전당: 권수현, 최성빈, 박우일</div>
                  <div className="text-[11px] text-[#6A789A]">...</div>
                </div>
              )}
            </div>

            {/* 3. 직원 불가 일정 (5건) */}
            <div className="bg-[#151D30] border border-[#23304E] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenUnavailabilities(!openUnavailabilities)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-xs font-semibold text-[#F4F7FF]"
              >
                <div className="flex items-center gap-2">
                  <CalendarX2 className="w-4 h-4 text-[#8592B0]" />
                  <span>직원 불가 일정 (5건)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#31C48D]/20 text-[#31C48D] flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  {openUnavailabilities ? <ChevronUp className="w-4 h-4 text-[#8592B0]" /> : <ChevronDown className="w-4 h-4 text-[#8592B0]" />}
                </div>
              </button>
              {openUnavailabilities && (
                <div className="px-4 pb-3 pt-1 border-t border-[#1C263E] text-xs text-[#A5AEC4] space-y-1.5">
                  <div>• 손창민: 13일 (불가)</div>
                  <div>• 이영준: 13일 (금정)</div>
                  <div>• 오윤서: 13일 (학교 워크샵)</div>
                  <div className="text-[11px] text-[#6A789A]">...</div>
                </div>
              )}
            </div>

            {/* 4. 확인 필요한 항목 (2건) */}
            <div className="bg-[#151D30] border border-[#F5AD43]/30 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5AD43] mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>확인 필요한 항목 (2건)</span>
              </div>
              <div className="space-y-2">
                <div className="bg-[#0B1020] border border-[#2E2818] rounded-lg p-2.5 flex items-start gap-2">
                  <span className="bg-[#F5AD43]/20 text-[#F5AD43] text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                    시간 미정
                  </span>
                  <span className="text-xs text-[#E2E8F0] leading-snug">03일, 04일 공연의 시간이 입력되지 않음</span>
                </div>
                <div className="bg-[#0B1020] border border-[#2E2818] rounded-lg p-2.5 flex items-start gap-2">
                  <span className="bg-[#F5AD43]/20 text-[#F5AD43] text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                    이름 중복 가능
                  </span>
                  <span className="text-xs text-[#E2E8F0] leading-snug">최성빈 (동명이인 여부 확인 필요)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-auto pt-4">
            <button
              onClick={() => setStep(3)}
              className="w-full h-12 bg-[#4169FF] hover:bg-[#3458DB] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-[#4169FF]/20 transition-colors"
            >
              매칭 검토로 이동 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 3: 직원·공연 매칭 검토 ──────────────── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2">
            <button onClick={() => setStep(2)} className="p-1 -ml-1 text-[#8592B0] hover:text-[#F4F7FF]">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[#F4F7FF]">직원·공연 매칭 검토</h1>
          </div>
          <p className="text-xs text-[#8592B0] mb-3">추출된 항목을 등록된 공연장·직원과 매칭하고 충돌을 확인하세요.</p>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mb-3">
            <button
              onClick={() => setMatchingTab('auto')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                matchingTab === 'auto'
                  ? 'bg-[#4169FF] border-[#4169FF] text-white'
                  : 'bg-[#151D30] border-[#23304E] text-[#8592B0]'
              }`}
            >
              자동 매칭 완료 <span className="bg-white/20 text-white text-[10px] px-1.5 rounded-full">15</span>
            </button>
            <button
              onClick={() => setMatchingTab('review')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                matchingTab === 'review'
                  ? 'bg-[#F5AD43] border-[#F5AD43] text-black'
                  : 'bg-[#151D30] border-[#23304E] text-[#F5AD43]'
              }`}
            >
              검토 필요 <span className="bg-black/20 text-black text-[10px] px-1.5 rounded-full">3</span>
            </button>
            <button
              onClick={() => setMatchingTab('conflict')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                matchingTab === 'conflict'
                  ? 'bg-[#F66B78] border-[#F66B78] text-white'
                  : 'bg-[#151D30] border-[#23304E] text-[#F66B78]'
              }`}
            >
              충돌 해결 <span className="bg-white/20 text-white text-[10px] px-1.5 rounded-full">1</span>
            </button>
          </div>

          {/* Matching Content List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            {/* Category 1: 자동 매칭 완료 (15) */}
            {(matchingTab === 'auto' || matchingTab === 'conflict' || matchingTab === 'review') && (
              <div className="bg-[#151D30] border border-[#23304E] rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#F4F7FF] border-b border-[#1C263E]">
                  <div className="flex items-center gap-1.5 text-[#31C48D]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>자동 매칭 완료 (15)</span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-[#8592B0]" />
                </div>
                <div className="p-3 space-y-2.5 text-xs">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between bg-[#0B1020] p-2.5 rounded-lg border border-[#1E2A44]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#8592B0]" />
                      <div>
                        <div className="text-[#8592B0] text-[11px]">을숙도문화회관</div>
                        <div className="text-[#F4F7FF] font-medium">→ 을숙도문화회관 대공연장</div>
                      </div>
                    </div>
                    <span className="bg-[#31C48D]/20 text-[#31C48D] text-[10px] font-bold px-2 py-0.5 rounded">
                      매칭 완료
                    </span>
                  </div>
                  {/* Item 2 */}
                  <div className="flex items-center justify-between bg-[#0B1020] p-2.5 rounded-lg border border-[#1E2A44]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#8592B0]" />
                      <div>
                        <div className="text-[#8592B0] text-[11px]">최성빈</div>
                        <div className="text-[#F4F7FF] font-medium">→ 최성빈</div>
                      </div>
                    </div>
                    <span className="bg-[#31C48D]/20 text-[#31C48D] text-[10px] font-bold px-2 py-0.5 rounded">
                      매칭 완료
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Category 2: 검토 필요 (3) */}
            {(matchingTab === 'review' || matchingTab === 'auto') && (
              <div className="bg-[#151D30] border border-[#23304E] rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#F5AD43] border-b border-[#1C263E]">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>검토 필요 (3)</span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-[#8592B0]" />
                </div>
                <div className="p-3 space-y-2.5 text-xs">
                  <div className="bg-[#0B1020] p-2.5 rounded-lg border border-[#1E2A44]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#8592B0]" />
                        <span className="text-[#F4F7FF] font-medium">서울예술의전당 자유소극장</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#8592B0]" />
                    </div>
                    <div className="mt-1 text-[11px] text-[#F5AD43]">→ 공연장 선택 필요</div>
                  </div>
                  <div className="bg-[#0B1020] p-2.5 rounded-lg border border-[#1E2A44]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#8592B0]" />
                        <span className="text-[#F4F7FF] font-medium">박우일</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#8592B0]" />
                    </div>
                    <div className="mt-1 text-[11px] text-[#F5AD43]">→ 등록된 직원과 매칭</div>
                  </div>
                  <div className="bg-[#0B1020] p-2.5 rounded-lg border border-[#1E2A44]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#8592B0]" />
                        <span className="text-[#F4F7FF] font-medium">금정</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[#8592B0]" />
                    </div>
                    <div className="mt-1 text-[11px] text-[#F5AD43]">→ 직원 확인 (금정 / 금정민)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Category 3: 충돌 해결 (1) */}
            {(matchingTab === 'conflict' || matchingTab === 'auto') && (
              <div className="bg-[#151D30] border border-[#F66B78]/40 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[#F66B78] border-b border-[#2C1820]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#F66B78] text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>충돌 해결 (1)</span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-[#8592B0]" />
                </div>
                <div className="p-3 text-xs bg-[#1F141B]">
                  <div className="flex items-start gap-2 mb-2">
                    <Users className="w-4 h-4 text-[#F66B78] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-[#F4F7FF]">손창민 / 13일</div>
                      <div className="text-xs text-[#F66B78] mt-0.5">불가 일정과 충돌 (배정 있음)</div>
                    </div>
                  </div>

                  {/* Radio resolution choices */}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-[#C5D0E8]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="conflict_son"
                        checked={conflictResolution === 'link_staff'}
                        onChange={() => setConflictResolution('link_staff')}
                        className="accent-[#4169FF]"
                      />
                      <span className={conflictResolution === 'link_staff' ? 'text-white font-medium' : ''}>
                        기존 직원과 연결
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="conflict_son"
                        checked={conflictResolution === 'new_event'}
                        onChange={() => setConflictResolution('new_event')}
                        className="accent-[#4169FF]"
                      />
                      <span>새 공연 생성</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="conflict_son"
                        checked={conflictResolution === 'ignore'}
                        onChange={() => setConflictResolution('ignore')}
                        className="accent-[#4169FF]"
                      />
                      <span>무시</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-auto pt-3">
            <button
              onClick={handleApplyToCalendar}
              className="w-full h-12 bg-[#4169FF] hover:bg-[#3458DB] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#4169FF]/20 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              캘린더에 반영
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── STEP 4: 캘린더 반영 완료 ──────────────── */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-end">
          {/* Bottom Sheet Card */}
          <div className="bg-[#151D30] border border-[#23304E] rounded-3xl p-5 shadow-2xl relative animate-in slide-in-from-bottom duration-300">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-[#3A4768] rounded-full mx-auto mb-4"></div>

            <div className="flex items-center justify-between pb-3 border-b border-[#202C48]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4169FF] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <h2 className="text-base font-bold text-[#F4F7FF]">메모 동기화 완료</h2>
              </div>
              <button
                onClick={() => onGoToCalendar?.()}
                className="text-[#8592B0] hover:text-[#F4F7FF] p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8592B0] mt-2 mb-4">{appliedStats.dateStr} 반영 결과</p>

            <div className="space-y-2.5">
              {/* Row 1: 추가된 공연 */}
              <div
                onClick={() => onGoToCalendar?.()}
                className="flex items-center justify-between p-3 bg-[#0B1020] border border-[#1E2A44] rounded-xl cursor-pointer hover:border-[#4169FF] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4169FF]/15 flex items-center justify-center text-[#4169FF]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F4F7FF]">추가된 공연 {appliedStats.addedEvents}건</div>
                    <div className="text-[11px] text-[#8592B0]">을숙도문화회관 대공연장 ({appliedStats.dateStr})</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8592B0]" />
              </div>

              {/* Row 2: 배정된 직원 */}
              <div
                onClick={() => onGoToCalendar?.()}
                className="flex items-center justify-between p-3 bg-[#0B1020] border border-[#1E2A44] rounded-xl cursor-pointer hover:border-[#4169FF] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4169FF]/15 flex items-center justify-center text-[#4169FF]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F4F7FF]">배정된 직원 {appliedStats.addedAssignments}명</div>
                    <div className="text-[11px] text-[#8592B0]">강진구, 권수현, 이영석</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8592B0]" />
              </div>

              {/* Row 3: 불가 일정 */}
              <div
                onClick={() => onGoToCalendar?.()}
                className="flex items-center justify-between p-3 bg-[#0B1020] border border-[#1E2A44] rounded-xl cursor-pointer hover:border-[#F66B78] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F66B78]/15 flex items-center justify-center text-[#F66B78]">
                    <CalendarX2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F4F7FF]">불가 일정 {appliedStats.addedUnavailabilities}건</div>
                    <div className="text-[11px] text-[#8592B0]">손창민 ({appliedStats.dateStr}, 불가)</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8592B0]" />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-11 bg-[#151D30] border border-[#23304E] text-xs font-medium text-[#C5D0E8] rounded-xl"
              >
                메모로 돌아가기
              </button>
              <button
                onClick={() => onGoToCalendar?.()}
                className="flex-1 h-11 bg-[#4169FF] text-xs font-semibold text-white rounded-xl shadow-lg shadow-[#4169FF]/20"
              >
                캘린더에서 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
