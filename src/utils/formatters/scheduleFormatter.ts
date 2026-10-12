import { ZendeskWorkWeekInterval } from '../../types/resources';

const MINUTES_PER_DAY = 1440; // 24 * 60

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatMinutesToTime(minutes: number): string {
  const mins = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${padZero(hours)}:${padZero(remainingMins)}`;
}

export function formatInterval(interval: ZendeskWorkWeekInterval): { dayOfWeek: number; text: string } {
  const dayOfWeek = Math.floor(interval.start_time / MINUTES_PER_DAY);
  const startTimeStr = formatMinutesToTime(interval.start_time);
  const endTimeStr = formatMinutesToTime(interval.end_time);
  return {
    dayOfWeek, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    text: `${startTimeStr} - ${endTimeStr}`,
  };
}

export interface WeekdayScheduleTexts {
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday: string;
  Sunday: string;
}

export function formatScheduleIntervals(intervals?: ZendeskWorkWeekInterval[]): WeekdayScheduleTexts {
  const days: Record<number, string[]> = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: [], // Saturday
  };

  if (intervals && Array.isArray(intervals)) {
    for (const interval of intervals) {
      const { dayOfWeek, text } = formatInterval(interval);
      if (days[dayOfWeek]) {
        days[dayOfWeek].push(text);
      }
    }
  }

  const formatDay = (list: string[]): string => {
    if (list.length === 0) return 'Closed';
    if (list.length === 1) return list[0];
    return list.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  };

  return {
    Monday: formatDay(days[1]),
    Tuesday: formatDay(days[2]),
    Wednesday: formatDay(days[3]),
    Thursday: formatDay(days[4]),
    Friday: formatDay(days[5]),
    Saturday: formatDay(days[6]),
    Sunday: formatDay(days[0]),
  };
}

export function formatScheduleHolidays(
  holidays?: Array<{ id?: number; name?: string; start_date?: string; end_date?: string }>
): string {
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    return 'None';
  }

  return holidays
    .map((h, idx) => {
      const dates =
        h.start_date && h.end_date
          ? h.start_date === h.end_date
            ? h.start_date
            : `${h.start_date} to ${h.end_date}`
          : h.start_date || h.end_date || '';
      const dateSuffix = dates ? ` (${dates})` : '';
      return `${idx + 1}. ${h.name || 'Holiday'}${dateSuffix}`;
    })
    .join('\n');
}
