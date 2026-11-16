import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#070A14] flex justify-center items-start sm:py-6 select-none">
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#0B1020] sm:rounded-[44px] sm:shadow-2xl sm:border-[6px] sm:border-[#1C263E] flex flex-col relative overflow-hidden pt-[env(safe-area-inset-top,0.5rem)]">
        {/* Screen Content Container */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-24">
          {children}
        </div>
      </div>
    </div>
  );
};
