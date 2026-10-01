import { ZendeskLookups } from '../../types/lookups';

const KNOWN_FIELD_NAMES: Record<string, string> = {
  status: 'Status',
  type: 'Type',
  priority: 'Priority',
  group_id: 'Group',
  group: 'Group',
  assignee_id: 'Assignee',
  assignee: 'Assignee',
  requester_id: 'Requester',
  requester: 'Requester',
  submitter_id: 'Submitter',
  submitter: 'Submitter',
  organization_id: 'Organization',
  organization: 'Organization',
  ticket_form_id: 'Ticket Form',
  form_id: 'Ticket Form',
  ticket_form: 'Ticket Form',
  brand_id: 'Brand',
  brand: 'Brand',
  schedule_id: 'Schedule',
  schedule: 'Schedule',
  role: 'Role',
  current_user_role: 'Current User Role',
  custom_role_id: 'Custom Role',
  subject: 'Subject',
  description: 'Description',
  current_tags: 'Tags',
  set_tags: 'Tags',
  remove_tags: 'Remove Tags',
  comment_is_public: 'Comment Privacy',
  comment_includes_word: 'Comment Includes Word',
  notification_user: 'Notify User',
  notification_group: 'Notify Group',
  notification_target: 'Notify Target',
  notification_webhook: 'Trigger Webhook',
  satisfaction_score: 'Satisfaction Score',
  locale_id: 'Requester Language',
  channel: 'Channel',
  via_id: 'Via Channel',
  current_via_id: 'Via Channel',
  reopen_sum: 'Reopens Count',
  update_type: 'Update Type',
  recipient: 'Recipient Address',
  subject_includes_word: 'Subject Includes Word',
  subject_not_includes_word: 'Subject Does Not Include Word',
  description_includes_word: 'Description Includes Word',
  description_not_includes_word: 'Description Does Not Include Word',
  comment_not_includes_word: 'Comment Does Not Include Word',
  custom_status_id: 'Ticket Status',
  ticket_is_public: 'Ticket Privacy',
  sla_policy_id: 'SLA Policy',
  group_sla_policy_id: 'Group SLA Policy',
  problem_id: 'Problem Ticket',
  due_date: 'Due Date',
};

const KNOWN_OPERATORS: Record<string, string> = {
  is: 'Is',
  is_not: 'Is Not',
  less_than: 'Less Than',
  greater_than: 'Greater Than',
  less_than_equal: 'Less Than Or Equal',
  greater_than_equal: 'Greater Than Or Equal',
  includes: 'Includes',
  not_includes: 'Does Not Include',
  includes_all: 'Includes All',
  not_includes_all: 'Does Not Include All',
  value: 'Changed to',
  value_previous: 'Changed from',
  not_value: 'Not Changed to',
  not_value_previous: 'Not Changed from',
  changed: 'Changed',
  not_changed: 'Did Not Change',
  changed_to: 'Changed to',
  changed_from: 'Changed from',
  present: 'Is Present',
  not_present: 'Is Not Present',
  is_empty: 'Is Empty',
  is_not_empty: 'Is Not Empty',
  is_set: 'Is Set',
  is_not_set: 'Is Not Set',
};

export const PURE_UNARY_OPERATORS = new Set([
  'present',
  'not_present',
  'is_empty',
  'is_not_empty',
  'is_set',
  'is_not_set',
]);

export const UNARY_OPERATORS = new Set([
  'changed',
  'not_changed',
  'present',
  'not_present',
  'is_empty',
  'is_not_empty',
  'is_set',
  'is_not_set',
]);

export const KNOWN_VIA_CHANNELS: Record<number, string> = {
  0: 'Web form',
  4: 'Email',
  5: 'Chat',
  8: 'Twitter',
  9: 'System',
  16: 'Closed ticket update',
  23: 'Voice',
  26: 'Web service (API)',
  29: 'Rule (Trigger / Automation)',
  30: 'Mobile',
  31: 'Mobile SDK',
  38: 'Help Center',
  44: 'Any Channel',
  45: 'Facebook',
  46: 'Facebook Private Message',
  48: 'Twitter DM',
  49: 'Twitter Favorite',
  55: 'Answer Bot',
  56: 'Messaging',
  67: 'WhatsApp',
  71: 'Instagram Direct',
};

export function isChangeOperator(op?: string): boolean {
  if (!op) return false;
  const lower = op.toLowerCase();
  return (
    lower === 'changed' ||
    lower === 'changed_to' ||
    lower === 'value' ||
    lower === 'changed_from' ||
    lower === 'value_previous' ||
    lower === 'not_value' ||
    lower === 'not_value_previous'
  );
}

export function isUnaryOperator(op?: string, value?: any): boolean {
  if (!op) return false;
  const lower = op.toLowerCase();
  if (PURE_UNARY_OPERATORS.has(lower)) {
    return true;
  }
  // 'changed' is unary only if value is undefined or empty string
  if (lower === 'changed') {
    return value === undefined || value === '';
  }
  // 'not_changed' is unary if value is undefined, empty string, or null
  if (lower === 'not_changed') {
    return value === undefined || value === '' || value === null;
  }
  return false;
}

export function formatOperator(op: string): string {
  if (!op) return '';
  return KNOWN_OPERATORS[op.toLowerCase()] || op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function formatField(field: string, lookups?: ZendeskLookups): string {
  if (!field) return '';
  
  if (KNOWN_FIELD_NAMES[field.toLowerCase()]) {
    return KNOWN_FIELD_NAMES[field.toLowerCase()];
  }

  // Check for custom field pattern: custom_fields_12345 or custom_field_12345
  const match = field.match(/custom_fields?_(\d+)/i);
  if (match && lookups) {
    const fieldId = parseInt(match[1], 10);
    const customField = lookups.ticketFields.get(fieldId);
    if (customField) {
      return `Custom: ${customField.title} (${fieldId})`;
    }
    return `Custom Field (${fieldId})`;
  }

  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function formatFieldValue(
  field: string,
  value: any,
  lookups?: ZendeskLookups,
  operator?: string
): string {
  const lowerField = (field || '').toLowerCase();
  const opLower = (operator || '').toLowerCase();
  const isChange = isChangeOperator(opLower);

  if (Array.isArray(value)) {
    return value.map(v => formatFieldValue(field, v, lookups, operator)).join(', ');
  }

  // Handle null / 'null' explicitly: if this is a change condition, show 'null'
  if (value === null || value === 'null') {
    if (isChange) {
      return 'null';
    }
  }

  // Handle empty / null / unassigned values
  if (value === null || value === undefined || value === '' || value === '-') {
    if (isChange) {
      return 'null';
    }
    if (lowerField === 'group_id' || lowerField === 'group') {
      return '(unassigned)';
    }
    if (lowerField === 'assignee_id' || lowerField === 'assignee') {
      return '(unassigned)';
    }
    if (lowerField === 'organization_id' || lowerField === 'organization') {
      return '(none)';
    }
    if (lowerField === 'brand_id' || lowerField === 'brand') {
      return '(none)';
    }
    if (lowerField === 'ticket_form_id' || lowerField === 'form_id' || lowerField === 'ticket_form') {
      return '(none)';
    }
    return '';
  }

  // Handle special Zendesk keyword values
  if (typeof value === 'string') {
    const valLower = value.toLowerCase();
    if (valLower === 'current_user') return '(current user)';
    if (valLower === 'requester_id' && (lowerField === 'assignee_id' || lowerField === 'assignee')) return '(requester)';
    if (valLower === 'current_groups') return "(current user's groups)";
    if (valLower === 'assigned') return '(assigned)';
    if (valLower === 'unassigned') return isChange ? 'null' : '(unassigned)';
  }

  // Handle Channel (via_id / current_via_id)
  if (lowerField === 'via_id' || lowerField === 'current_via_id') {
    const viaNum = typeof value === 'number' ? value : parseInt(value, 10);
    if (!isNaN(viaNum) && KNOWN_VIA_CHANNELS[viaNum]) {
      return `${KNOWN_VIA_CHANNELS[viaNum]} (${viaNum})`;
    }
  }

  // Handle Role (Standard roles)
  if (lowerField === 'role' || lowerField === 'current_user_role' || lowerField === 'custom_role_id') {
    const roleStr = String(value).toLowerCase();
    if (roleStr === '0' || roleStr === 'end_user' || roleStr === 'end-user') return 'End-user';
    if (roleStr === '1' || roleStr === 'admin' || roleStr === 'administrator') return 'Administrator';
    if (roleStr === '2' || roleStr === 'agent') return 'Agent';
    if (roleStr === '4' || roleStr === 'contributor' || roleStr === 'light_agent') return 'Light Agent';
  }

  const numVal = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numVal) && typeof value !== 'boolean' && /^\d+$/.test(String(value).trim());

  if (lookups) {
    // Resolve Group
    if ((lowerField === 'group_id' || lowerField === 'group') && isNumeric) {
      const groupName = lookups.groups.get(numVal);
      if (groupName) return `${groupName} (${numVal})`;
      return `Group (${numVal})`;
    }

    // Resolve User / Assignee / Requester
    if ((lowerField === 'assignee_id' || lowerField === 'requester_id' || lowerField === 'submitter_id' || lowerField === 'user_id' || lowerField === 'assignee' || lowerField === 'requester') && isNumeric) {
      const userName = lookups.users.get(numVal);
      if (userName) return `${userName} (${numVal})`;
      return `User (${numVal})`;
    }

    // Resolve Role (Custom Roles)
    if ((lowerField === 'role' || lowerField === 'current_user_role' || lowerField === 'custom_role_id') && isNumeric) {
      const roleName =
        lookups.customRoles?.get(numVal) ||
        lookups.customRoles?.get(String(value)) ||
        lookups.customRoles?.get(String(numVal));
      if (roleName) return `${roleName} (${numVal})`;
      return `Custom Role (${numVal})`;
    }

    // Resolve Business Hours Schedule
    if ((lowerField === 'schedule_id' || lowerField === 'schedule') && isNumeric) {
      const schedName =
        lookups.schedules?.get(numVal) ||
        lookups.schedules?.get(String(value)) ||
        lookups.schedules?.get(String(numVal));
      if (schedName) return `${schedName} (${numVal})`;
      return `Schedule (${numVal})`;
    }

    // Resolve Organization
    if ((lowerField === 'organization_id' || lowerField === 'organization') && isNumeric) {
      const orgName = lookups.organizations.get(numVal);
      if (orgName) return `${orgName} (${numVal})`;
      return `Organization (${numVal})`;
    }

    // Resolve Form
    if ((lowerField === 'ticket_form_id' || lowerField === 'form_id' || lowerField === 'ticket_form') && isNumeric) {
      const formName = lookups.forms.get(numVal);
      if (formName) return `${formName} (${numVal})`;
      return `Form (${numVal})`;
    }

    // Resolve Brand
    if ((lowerField === 'brand_id' || lowerField === 'brand') && isNumeric) {
      const brandName = lookups.brands.get(numVal);
      if (brandName) return `${brandName} (${numVal})`;
      return `Brand (${numVal})`;
    }

    // Resolve Custom Field Options
    const match = field.match(/custom_fields?_(\d+)/i);
    if (match) {
      const fieldId = parseInt(match[1], 10);
      const customField = lookups.ticketFields.get(fieldId);
      if (customField && customField.options && customField.options.has(String(value))) {
        const optName = customField.options.get(String(value));
        return `${optName} (${value})`;
      }
    }
  } else {
    // If lookups object was not passed, format custom role ID cleanly
    if ((lowerField === 'role' || lowerField === 'current_user_role' || lowerField === 'custom_role_id') && isNumeric) {
      return `Custom Role (${numVal})`;
    }
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
