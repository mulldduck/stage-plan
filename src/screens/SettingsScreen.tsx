import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Database,
  RotateCcw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';
import { db } from '../storage/db';
import { exportScheduleToCSV, downloadFile } from '../storage/exportService';
import { runAutoAssign } from '../engine/autoAssign';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState(db.getSettings());
  const [autoAssignSummary, setAutoAssignSummary] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGapChange = (gap: number) => {
    const updated = db.updateSettings({ minimum_gap_minutes: gap });
    setSettings(updated);
    showToast(`최소 이동 간격이 ${gap}분으로 변경되었습니다.`);
  };

  const handleExportCSV = () => {
    const csv = exportScheduleToCSV(db.getEvents(), db.getAssignments(), db.getStaff());
    downloadFile(`STAGE_PLAN_근무표_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showToast('근무표 CSV 파일이 다운로드되었습니다.');
  };

  const handleBackupJSON = () => {
    const json = JSON.stringify(db.getState(), null, 2);
    downloadFile(`STAGE_PLAN_전체백업_${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json');
    showToast('전체 DB JSON 백업 파일이 다운로드되었습니다.');
  };

  const handleRunAutoAssign = () => {
    const res = runAutoAssign(
      db.getEvents(),
      db.getStaff(),
      db.getAssignments(),
      db.getAvailabilities(),
      settings
    );

    // Save new assignments
    for (const a of res.newAssignments) {
      db.addAssignment(a);
    }

    setAutoAssignSummary(
      `자동배정 완료: 총 ${res.summary.totalSlots}개 슬롯 중 ${res.summary.assignedCount}건 배정 완료, ${res.summary.unassignedCount}건 미배정(적격자 없음)`
    );
    showToast('빈 슬롯 자동배정이 실행되었습니다.');
  };

  const handleResetData = () => {
    if (window.confirm('모든 데이터를 초기 승인 시안 샘플 상태로 복원하시겠습니까?')) {
      db.resetToDefault();
      showToast('초기 데이터로 안전하게 복원되었습니다.');
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-2 pb-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-[#4169FF] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl z-50 animate-in fade-in flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-[#1A253E]">
        <h1 className="text-lg font-bold text-[#F4F7FF]">환경 설정 & 운영 도구</h1>
      </div>

      <div className="mt-3 space-y-4 overflow-y-auto pr-0.5">
        {/* Policy Section */}
        <div className="bg-[#151D30] border border-[#23304E] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#4169FF]" />
            <h2 className="text-xs font-bold text-[#F4F7FF]">자동배정 & 근무 정책</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] text-[#8592B0] mb-1.5">공연 간 최소 이동/휴식 간격</div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 15, 30].map((gap) => (
                  <button
                    key={gap}
                    onClick={() => handleGapChange(gap)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      settings.minimum_gap_minutes === gap
                        ? 'bg-[#4169FF] border-[#4169FF] text-white'
                        : 'bg-[#0B1020] border-[#23304E] text-[#8592B0] hover:text-[#C5D0E8]'
                    }`}
                  >
                    {gap === 0 ? '0분 (연속 가능)' : `${gap}분 간격`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1C263E] flex items-center justify-between text-xs">
              <span className="text-[#8592B0]">시스템 기준 시간대</span>
              <span className="text-[#F4F7FF] font-medium font-mono">{settings.timezone}</span>
            </div>
          </div>
        </div>

        {/* Auto Assign CTA Card */}
        <div className="bg-[#151D30] border border-[#4169FF]/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#4169FF]" />
            <h2 className="text-xs font-bold text-[#F4F7FF]">전체 일정 빈 슬롯 자동배정</h2>
          </div>
          <p className="text-[11px] text-[#8592B0] leading-relaxed mb-3">
            시간이 확정된 공연의 미배정 슬롯을 적격 직원(자격/가용시간/공평 분배)으로 즉시 채웁니다. 고정(Locked)된 배정은 건드리지 않습니다.
          </p>
          <button
            onClick={handleRunAutoAssign}
            className="w-full h-11 bg-[#4169FF] hover:bg-[#3458DB] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#4169FF]/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> 지금 자동배정 실행
          </button>
          {autoAssignSummary && (
            <div className="mt-2.5 p-2 bg-[#0B1020] border border-[#23304E] rounded-lg text-[11px] text-[#31C48D]">
              {autoAssignSummary}
            </div>
          )}
        </div>

        {/* Export & Backup Section */}
        <div className="bg-[#151D30] border border-[#23304E] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-[#31C48D]" />
            <h2 className="text-xs font-bold text-[#F4F7FF]">데이터 내보내기 & 백업</h2>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportCSV}
              className="w-full h-11 bg-[#0B1020] border border-[#23304E] hover:border-[#31C48D] text-[#C5D0E8] font-medium text-xs rounded-xl flex items-center justify-between px-3.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#31C48D]" />
                <span>근무표 CSV 내보내기 (엑셀 호환)</span>
              </div>
              <Download className="w-4 h-4 text-[#8592B0]" />
            </button>

            <button
              onClick={handleBackupJSON}
              className="w-full h-11 bg-[#0B1020] border border-[#23304E] hover:border-[#4169FF] text-[#C5D0E8] font-medium text-xs rounded-xl flex items-center justify-between px-3.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#4169FF]" />
                <span>전체 데이터 JSON 백업</span>
              </div>
              <Download className="w-4 h-4 text-[#8592B0]" />
            </button>
          </div>
        </div>

        {/* PWA Guide Card */}
        <div className="bg-[#151D30] border border-[#23304E] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-[#A5AEC4]" />
            <h2 className="text-xs font-bold text-[#F4F7FF]">iPhone 홈 화면 설치 (PWA)</h2>
          </div>
          <p className="text-[11px] text-[#8592B0] leading-relaxed">
            Safari 브라우저 하단의 <strong className="text-white">공유 아이콘</strong>을 누른 뒤 <strong className="text-[#4169FF]">‘홈 화면에 추가’</strong>를 선택하면 네이티브 앱처럼 전체화면으로 실행됩니다.
          </p>
        </div>

        {/* Danger zone / Reset */}
        <div className="pt-2">
          <button
            onClick={handleResetData}
            className="w-full h-10 border border-[#F66B78]/40 hover:bg-[#F66B78]/10 text-[#F66B78] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 초기 시안 샘플 데이터로 리셋
          </button>
        </div>
      </div>
    </div>
  );
};
