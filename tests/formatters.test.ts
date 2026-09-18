import { describe, test, expect } from 'vitest';
import { formatConditions, formatCondition } from '../src/utils/formatters/conditionFormatter';
import { formatAction, formatActionList } from '../src/utils/formatters/actionFormatter';
import { formatScheduleIntervals, formatInterval } from '../src/utils/formatters/scheduleFormatter';
import { formatSLAMetric, formatSLAMetricsList } from '../src/utils/formatters/slaFormatter';
import { formatCustomFieldOptions } from '../src/utils/formatters/customFieldFormatter';
import { formatDateUTC } from '../src/utils/formatters/dateFormatter';
import { createEmptyLookups } from '../src/types/lookups';

describe('Condition Formatter', () => {
  test('formats simple conditions into Field | Operator | Value', () => {
    const formatted = formatCondition({
      field: 'status',
      operator: 'is',
      value: 'open',
    });
    expect(formatted).toBe('Status | Is | open');
  });

  test('formats conditions with lookups resolving IDs', () => {
    const lookups = createEmptyLookups();
    lookups.groups.set(12345, 'Tier 2 Support');

    const formatted = formatCondition(
      {
        field: 'group_id',
        operator: 'is_not',
        value: 12345,
      },
      lookups
    );
    expect(formatted).toBe('Group | Is Not | Tier 2 Support (12345)');
  });

  test('formats unassigned group and assignee cleanly without empty values', () => {
    const formattedGroup = formatCondition({
      field: 'group_id',
      operator: 'is_not',
      value: '',
    });
    expect(formattedGroup).toBe('Group | Is Not | (unassigned)');

    const formattedAssignee = formatCondition({
      field: 'assignee_id',
      operator: 'is',
      value: null,
    });
    expect(formattedAssignee).toBe('Assignee | Is | (unassigned)');
  });

  test('formats unary operators without trailing pipe or empty values', () => {
    const groupChanged = formatCondition({
      field: 'group_id',
      operator: 'changed',
      value: '',
    });
    expect(groupChanged).toBe('Group | Changed');

    const assigneeChanged = formatCondition({
      field: 'assignee_id',
      operator: 'changed',
      value: '',
    });
    expect(assigneeChanged).toBe('Assignee | Changed');

    const tagsPresent = formatCondition({
      field: 'current_tags',
      operator: 'present',
    });
    expect(tagsPresent).toBe('Tags | Is Present');
  });

  test('formats custom roles and standard roles accurately', () => {
    const lookups = createEmptyLookups();
    lookups.customRoles.set(25176440012818, 'Tier 2 Specialist');

    const withLookup = formatCondition(
      { field: 'role', operator: 'is_not', value: 25176440012818 },
      lookups
    );
    expect(withLookup).toBe('Role | Is Not | Tier 2 Specialist (25176440012818)');

    const withoutLookup = formatCondition({
      field: 'role',
      operator: 'is_not',
      value: 25176440012818,
    });
    expect(withoutLookup).toBe('Role | Is Not | Custom Role (25176440012818)');

    const standardRole = formatCondition({
      field: 'role',
      operator: 'is',
      value: '2',
    });
    expect(standardRole).toBe('Role | Is | Agent');
  });

  test('formats All and Any condition blocks separated by newlines', () => {
    const conditions = {
      all: [
        { field: 'status', operator: 'is', value: 'new' },
        { field: 'priority', operator: 'greater_than', value: 'normal' },
      ],
      any: [
        { field: 'current_tags', operator: 'includes', value: 'vip' },
      ],
    };

    const result = formatConditions(conditions);
    expect(result.all).toBe('1. Status | Is | new\n2. Priority | Greater Than | normal');
    expect(result.any).toBe('1. Tags | Includes | vip');
  });
});

describe('Action Formatter', () => {
  test('formats actions into Field → Value', () => {
    const formatted = formatAction({
      field: 'status',
      value: 'pending',
    });
    expect(formatted).toBe('Status → pending');
  });

  test('resolves user and group lookups in actions', () => {
    const lookups = createEmptyLookups();
    lookups.users.set(9876, 'Jane Agent');
    lookups.groups.set(1001, 'Engineering Support');

    const action1 = formatAction({ field: 'assignee_id', value: 9876 }, lookups);
    const action2 = formatAction({ field: 'group_id', value: 1001 }, lookups);

    expect(action1).toBe('Assignee → Jane Agent (9876)');
    expect(action2).toBe('Group → Engineering Support (1001)');
  });

  test('formats multiple actions with newlines', () => {
    const actions = [
      { field: 'status', value: 'solved' },
      { field: 'remove_tags', value: 'pending_review' },
    ];
    const list = formatActionList(actions);
    expect(list).toBe('1. Status → solved\n2. Remove Tags → pending_review');
  });
});

describe('Schedule Formatter', () => {
  test('converts weekly minutes into HH:mm weekday intervals', () => {
    // Monday 09:00 - 17:00
    // Monday starts at 1440. 09:00 = 1440 + 540 = 1980. 17:00 = 1440 + 1020 = 2460.
    const interval = { start_time: 1980, end_time: 2460 };
    const res = formatInterval(interval);
    expect(res.dayOfWeek).toBe(1);
    expect(res.text).toBe('09:00 - 17:00');
  });

  test('formats full weekly schedule with Closed status for inactive days', () => {
    const intervals = [
      { start_time: 1980, end_time: 2460 }, // Monday 09:00 - 17:00
      { start_time: 3420, end_time: 3900 }, // Tuesday 09:00 - 17:00
    ];
    const schedule = formatScheduleIntervals(intervals);
    expect(schedule.Monday).toBe('09:00 - 17:00');
    expect(schedule.Tuesday).toBe('09:00 - 17:00');
    expect(schedule.Wednesday).toBe('Closed');
    expect(schedule.Sunday).toBe('Closed');
  });
});

describe('SLA Metrics Formatter', () => {
  test('formats SLA metric targets and business hours', () => {
    const metric = {
      priority: 'urgent',
      metric: 'first_reply_time',
      target: 15,
      business_hours: false,
    };
    const formatted = formatSLAMetric(metric);
    expect(formatted).toBe('Priority: Urgent | Metric: First Reply Time | Target: 15 min | Business Hours: No (Calendar)');
  });

  test('formats target hours when divisible by 60', () => {
    const metric = {
      priority: 'normal',
      metric: 'requester_wait_time',
      target: 120,
      business_hours: true,
    };
    const formatted = formatSLAMetric(metric);
    expect(formatted).toBe('Priority: Normal | Metric: Requester Wait Time | Target: 120 min (2 hrs) | Business Hours: Yes');
  });

  test('formats list of SLA metrics separated by newlines', () => {
    const list = formatSLAMetricsList([
      { priority: 'urgent', metric: 'first_reply_time', target: 30, business_hours: false },
      { priority: 'high', metric: 'next_reply_time', target: 60, business_hours: true },
    ]);
    expect(list).toContain('1. Priority: Urgent');
    expect(list).toContain('2. Priority: High');
  });
});

describe('Custom Field Options Formatter', () => {
  test('formats dropdown options with [Default] marker', () => {
    const options = [
      { id: 1, name: 'Alfa Romeo', value: 'alfa_romeo', default: false },
      { id: 2, name: 'Aston Martin', value: 'aston_martin', default: true },
      { id: 3, name: 'BMW', value: 'bmw', default: false },
    ];
    const formatted = formatCustomFieldOptions(options);
    expect(formatted).toBe(
      '1. Alfa Romeo → alfa_romeo\n2. Aston Martin → aston_martin [Default]\n3. BMW → bmw'
    );
  });
});

describe('Date Formatter', () => {
  test('normalizes ISO dates to consistent UTC string', () => {
    const iso = '2026-09-18T13:30:42Z';
    const formatted = formatDateUTC(iso);
    expect(formatted).toBe('2026-09-18 13:30:42 UTC');
  });

  test('handles null or empty date gracefully', () => {
    expect(formatDateUTC(null)).toBe('');
    expect(formatDateUTC('')).toBe('');
  });
});
