import React, { useState } from 'react';
import { MobileFrame } from './components/MobileFrame';
import { Navigation, TabType } from './components/Navigation';
import { CalendarScreen } from './screens/CalendarScreen';
import { SmartMemoScreen } from './screens/SmartMemoScreen';
import { StaffScreen } from './screens/StaffScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [showAppliedSheet, setShowAppliedSheet] = useState<boolean>(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(13);

  const handleAppliedComplete = (summary: { addedEvents: number; addedAssignments: number; dateStr: string }) => {
    setShowAppliedSheet(true);
    setSelectedCalendarDay(13);
    setActiveTab('calendar');
  };

  const handleGoToCalendar = () => {
    setActiveTab('calendar');
  };

  const handleOpenSmartMemo = () => {
    setShowAppliedSheet(false);
    setActiveTab('memo');
  };

  return (
    <MobileFrame>
      {activeTab === 'calendar' && (
        <CalendarScreen
          onOpenSmartMemo={handleOpenSmartMemo}
          initialSelectedDay={selectedCalendarDay}
          showAppliedSheet={showAppliedSheet}
        />
      )}
      {activeTab === 'memo' && (
        <SmartMemoScreen
          onAppliedComplete={handleAppliedComplete}
          onGoToCalendar={handleGoToCalendar}
        />
      )}
      {activeTab === 'staff' && <StaffScreen />}
      {activeTab === 'settings' && <SettingsScreen />}

      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'calendar') {
            setShowAppliedSheet(false);
          }
          setActiveTab(tab);
        }}
        memoBadgeCount={activeTab === 'memo' ? undefined : 2}
      />
    </MobileFrame>
  );
}

export default App;
