import { EventItem, Assignment, Staff } from '../types';

export function exportScheduleToCSV(events: EventItem[], assignments: Assignment[], staffList: Staff[]): string {
  const staffMap = new Map<string, string>();
  for (const s of staffList) {
    staffMap.set(s.id, s.display_name);
  }

  const rows: string[] = [];
  rows.push(['일자', '공연명/장소', '시간', '직원명', '배정역할', '배정구분', '고정여부'].join(','));

  for (const ev of events) {
    const evAsgns = assignments.filter((a) => a.event_id === ev.id && a.status !== 'cancelled');
    const timeStr = ev.time_status === 'known' && ev.starts_at && ev.ends_at
      ? `${new Date(ev.starts_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}~${new Date(ev.ends_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
      : '시간 미정';

    if (evAsgns.length === 0) {
      rows.push([ev.occurs_on, `"${ev.title}"`, `"${timeStr}"`, '(미배정)', '-', '-', '-'].join(','));
    } else {
      for (const asgn of evAsgns) {
        const staffName = asgn.staff_name || staffMap.get(asgn.staff_id) || asgn.staff_id;
        rows.push([
          ev.occurs_on,
          `"${ev.title}"`,
          `"${timeStr}"`,
          `"${staffName}"`,
          `"${asgn.role_name || '진행'}"`,
          asgn.source === 'auto' ? '자동' : asgn.source === 'note' ? '메모' : '수동',
          asgn.locked ? '고정' : '일반',
        ].join(','));
      }
    }
  }

  return '\uFEFF' + rows.join('\r\n');
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
