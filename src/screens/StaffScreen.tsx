import React, { useState } from 'react';
import { Search, Plus, UserPlus, Check, X, Shield, Phone, Tag } from 'lucide-react';
import { db } from '../storage/db';
import { Staff } from '../types';

export const StaffScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('전체');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New staff form fields
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('운영팀');
  const [newRole, setNewRole] = useState('진행');

  const staffList = db.getStaff();
  const assignments = db.getAssignments();

  const teams = ['전체', '운영팀', '기술팀', '조명팀', '하우스팀', '기획팀'];

  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.display_name.includes(search) || (s.employee_code && s.employee_code.includes(search));
    const matchTeam = selectedTeam === '전체' || s.team === selectedTeam;
    return matchSearch && matchTeam;
  });

  const handleAddStaff = () => {
    if (!newName) return;
    db.addStaff({
      display_name: newName,
      employee_code: `STF-${String(staffList.length + 1).padStart(3, '0')}`,
      team: newTeam,
      is_active: true,
      roles: [newRole],
    });
    setNewName('');
    setIsAddModalOpen(false);
  };

  const toggleStaffActive = (staffId: string, current: boolean) => {
    db.updateStaff(staffId, { is_active: !current });
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-2 pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A253E]">
        <h1 className="text-lg font-bold text-[#F4F7FF]">직원 관리</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4169FF] hover:bg-[#3458DB] text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-[#4169FF]/20"
        >
          <UserPlus className="w-3.5 h-3.5" /> 직원 등록
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-3 relative">
        <Search className="w-4 h-4 text-[#8592B0] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="직원 이름 또는 코드 검색"
          className="w-full bg-[#151D30] border border-[#23304E] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F4F7FF] placeholder-[#5A688A] outline-none focus:border-[#4169FF]"
        />
      </div>

      {/* Team Filter Pills */}
      <div className="flex gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
        {teams.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTeam(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedTeam === t
                ? 'bg-[#4169FF] text-white font-semibold'
                : 'bg-[#151D30] text-[#8592B0] hover:text-[#C5D0E8]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Staff Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-1 pr-0.5">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8592B0]">검색 결과가 없습니다.</div>
        ) : (
          filteredStaff.map((staff) => {
            const assignCount = assignments.filter((a) => a.staff_id === staff.id && a.status !== 'cancelled').length;
            return (
              <div
                key={staff.id}
                className="bg-[#151D30] border border-[#23304E] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1A253E] border border-[#2C3B5E] flex items-center justify-center font-bold text-xs text-[#C5D0E8]">
                    {staff.display_name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#F4F7FF]">{staff.display_name}</span>
                      <span className="text-[10px] text-[#8592B0] font-mono">{staff.employee_code}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8592B0]">
                      <span className="bg-[#0B1020] px-1.5 py-0.5 rounded text-[10px] border border-[#1E2B48]">
                        {staff.team || '운영팀'}
                      </span>
                      {staff.roles && staff.roles.length > 0 && (
                        <span>{staff.roles.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <div className="text-[10px] text-[#8592B0]">11월 배정</div>
                    <div className="text-xs font-bold text-[#4169FF]">{assignCount}회</div>
                  </div>
                  <button
                    onClick={() => toggleStaffActive(staff.id, staff.is_active)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      staff.is_active
                        ? 'bg-[#31C48D]/20 text-[#31C48D] border-[#31C48D]/30'
                        : 'bg-[#F66B78]/20 text-[#F66B78] border-[#F66B78]/30'
                    }`}
                  >
                    {staff.is_active ? '✓' : '✕'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151D30] border border-[#23304E] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#202C48]">
              <h3 className="text-sm font-bold text-[#F4F7FF]">새 직원 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#8592B0] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] text-[#8592B0] block mb-1">직원 이름</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full bg-[#0B1020] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#F4F7FF] outline-none focus:border-[#4169FF]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8592B0] block mb-1">소속 팀</label>
                <select
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="w-full bg-[#0B1020] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#F4F7FF] outline-none focus:border-[#4169FF]"
                >
                  <option value="운영팀">운영팀</option>
                  <option value="기술팀">기술팀</option>
                  <option value="조명팀">조명팀</option>
                  <option value="하우스팀">하우스팀</option>
                  <option value="기획팀">기획팀</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#8592B0] block mb-1">주요 역할</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="예: 음향, 진행, 조명"
                  className="w-full bg-[#0B1020] border border-[#23304E] rounded-xl px-3 py-2 text-xs text-[#F4F7FF] outline-none focus:border-[#4169FF]"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-10 bg-[#0B1020] border border-[#23304E] text-xs text-[#8592B0] rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={handleAddStaff}
                className="flex-1 h-10 bg-[#4169FF] text-xs text-white rounded-xl font-semibold shadow-lg shadow-[#4169FF]/20"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
