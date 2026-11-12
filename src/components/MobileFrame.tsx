import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  currentTime?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, currentTime = '2:04' }) => {
  return (
    <div className="min-h-screen bg-[#070A14] flex justify-center items-start sm:py-6 select-none">
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#0B1020] sm:rounded-[44px] sm:shadow-2xl sm:border-[6px] sm:border-[#1C263E] flex flex-col relative overflow-hidden">
        {/* iOS Dynamic Island / Status Bar */}
        <div className="h-11 px-7 pt-3 flex justify-between items-center text-xs text-[#F4F7FF] font-medium z-50 shrink-0">
          <span className="tracking-tight text-sm font-semibold">{currentTime}</span>
          <div className="w-24 h-5 bg-black rounded-full hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-xs text-[#F4F7FF]">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4 text-[#31C48D]" />
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#3A4768] rounded-full z-40 pointer-events-none"></div>
      </div>
    </div>
  );
};
