import React from 'react';
import { Calendar, Sparkles, Users, Settings } from 'lucide-react';

export type TabType = 'calendar' | 'memo' | 'staff' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  memoBadgeCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, memoBadgeCount }) => {
  const tabs = [
    { id: 'calendar' as TabType, label: '캘린더', icon: Calendar },
    { id: 'memo' as TabType, label: '스마트 메모', icon: Sparkles, badge: memoBadgeCount },
    { id: 'staff' as TabType, label: '직원', icon: Users },
    { id: 'settings' as TabType, label: '설정', icon: Settings },
  ];

  return (
    <nav className="fixed sm:absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#0E1528]/95 backdrop-blur-md border-t border-[#1F2C4A] z-40 px-4 py-2 flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-16 py-1 relative transition-colors ${
              isActive ? 'text-[#4169FF]' : 'text-[#8592B0] hover:text-[#C5D0E8]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#F66B78] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[11px] mt-1 font-medium ${isActive ? 'text-[#4169FF] font-semibold' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
