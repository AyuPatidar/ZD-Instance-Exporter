import { describe, test, expect } from 'vitest';
import { formatConditions, formatCondition } from '../src/utils/formatters/conditionFormatter';
import { formatAction, formatActionList } from '../src/utils/formatters/actionFormatter';
import { formatScheduleIntervals, formatInterval, formatScheduleHolidays } from '../src/utils/formatters/scheduleFormatter';
import { formatSLAMetric, formatSLAMetricsList } from '../src/utils/formatters/slaFormatter';
import { formatCustomFieldOptions, formatRecordCustomFields } from '../src/utils/formatters/customFieldFormatter';
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

  test('formats changed to null and changed to value cleanly for triggers', () => {
    const lookups = createEmptyLookups();
    lookups.users.set(4567, 'Alex Agent');

    // 1. Assignee changed to null
    const assigneeChangedNull = formatCondition({
      field: 'assignee_id',
      operator: 'changed',
      value: null,
    });
    expect(assigneeChangedNull).toBe('Assignee | Changed to | null');

    // 2. Assignee changed to specific user
    const assigneeChangedUser = formatCondition(
      {
        field: 'assignee_id',
        operator: 'changed',
        value: 4567,
      },
      lookups
    );
    expect(assigneeChangedUser).toBe('Assignee | Changed to | Alex Agent (4567)');

    // 3. Zendesk internal "value" (changed to) operator
    const assigneeValueNull = formatCondition({
      field: 'assignee_id',
      operator: 'value',
      value: null,
    });
    expect(assigneeValueNull).toBe('Assignee | Changed to | null');

    // 4. Zendesk internal "value_previous" (changed from) operator
    const assigneeValuePrev = formatCondition(
      {
        field: 'assignee_id',
        operator: 'value_previous',
        value: 4567,
      },
      lookups
    );
    expect(assigneeValuePrev).toBe('Assignee | Changed from | Alex Agent (4567)');

    // 5. Group changed to null
    const groupChangedNull = formatCondition({
      field: 'group_id',
      operator: 'changed',
      value: null,
    });
    expect(groupChangedNull).toBe('Group | Changed to | null');

    // 6. Numbered condition list with 2. Assignee | Changed to | null
    const conditions = {
      all: [
        { field: 'status', operator: 'is', value: 'open' },
        { field: 'assignee_id', operator: 'changed', value: null },
      ],
    };
    const formattedList = formatConditions(conditions);
    expect(formattedList.all).toBe('1. Status | Is | open\n2. Assignee | Changed to | null');

    // 7. Via channel formatting
    const viaEmail = formatCondition({
      field: 'current_via_id',
      operator: 'is',
      value: 4,
    });
    expect(viaEmail).toBe('Via Channel | Is | Email (4)');
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

  test('formats schedule holidays with date ranges', () => {
    const holidays = [
      { id: 1, name: 'Christmas Day', start_date: '2025-12-25', end_date: '2025-12-25' },
      { id: 2, name: 'Winter Break', start_date: '2025-12-26', end_date: '2025-12-31' },
    ];
    const formatted = formatScheduleHolidays(holidays);
    expect(formatted).toBe('1. Christmas Day (2025-12-25)\n2. Winter Break (2025-12-26 to 2025-12-31)');

    expect(formatScheduleHolidays([])).toBe('None');
    expect(formatScheduleHolidays(undefined)).toBe('None');
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

  test('formats record custom fields showing all defined fields including unset ones', () => {
    const definitions = [
      {
        id: 101,
        key: 'contract_tier',
        title: 'Contract Tier',
        type: 'dropdown',
        options: new Map([
          ['platinum', 'Platinum VIP'],
          ['gold', 'Gold Tier'],
        ]),
      },
      {
        id: 102,
        key: 'renewal_month',
        title: 'Renewal Month',
        type: 'text',
      },
      {
        id: 103,
        key: 'is_strategic',
        title: 'Strategic Partner',
        type: 'checkbox',
      },
      {
        id: 104,
        key: 'notes',
        title: 'Internal Notes',
        type: 'textarea',
      },
    ];
    const defMap = new Map(definitions.map(d => [d.key, d]));

    // Record has only contract_tier and is_strategic; renewal_month and notes are null/unset
    const recordFields = {
      contract_tier: 'platinum',
      is_strategic: true,
      renewal_month: null,
      notes: '',
      extra_ad_hoc_field: 'Special Handling',
    };

    const formatted = formatRecordCustomFields(recordFields, null, definitions, defMap);

    // Verifies all 4 defined fields + the 1 extra field are shown in the single cell
    expect(formatted).toContain('1. Contract Tier: Platinum VIP');
    expect(formatted).toContain('2. Renewal Month: -');
    expect(formatted).toContain('3. Strategic Partner: Yes');
    expect(formatted).toContain('4. Internal Notes: -');
    expect(formatted).toContain('5. extra_ad_hoc_field: Special Handling');
  });

  test('formats record custom fields when no definitions are cached', () => {
    const recordFields = {
      department: 'Finance',
      location: null,
    };
    const formatted = formatRecordCustomFields(recordFields, null, [], new Map());
    expect(formatted).toContain('1. department: Finance');
    expect(formatted).toContain('2. location: -');
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
