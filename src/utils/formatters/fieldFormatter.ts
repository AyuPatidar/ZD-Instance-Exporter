import { ZendeskLookups } from '../../types/lookups';

const KNOWN_FIELD_NAMES: Record<string, string> = {
  status: 'Status',
  type: 'Type',
  priority: 'Priority',
  group_id: 'Group',
  assignee_id: 'Assignee',
  requester_id: 'Requester',
  submitter_id: 'Submitter',
  organization_id: 'Organization',
  ticket_form_id: 'Ticket Form',
  brand_id: 'Brand',
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
  reopen_sum: 'Reopens Count',
  update_type: 'Update Type',
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
  value: 'Is',
  value_previous: 'Changed From',
  changed: 'Changed',
  not_changed: 'Did Not Change',
  changed_to: 'Changed To',
  changed_from: 'Changed From',
  present: 'Is Present',
  not_present: 'Is Not Present',
};

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

export function formatFieldValue(field: string, value: any, lookups?: ZendeskLookups): string {
  if (value === null || value === undefined) return '';

  if (Array.isArray(value)) {
    return value.map(v => formatFieldValue(field, v, lookups)).join(', ');
  }

  const numVal = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numVal) && typeof value !== 'boolean';

  if (lookups) {
    const lowerField = field.toLowerCase();
    // Resolve Group
    if ((lowerField === 'group_id' || lowerField === 'group') && isNumeric) {
      const groupName = lookups.groups.get(numVal);
      if (groupName) return `${groupName} (${numVal})`;
    }

    // Resolve User / Assignee / Requester
    if ((lowerField === 'assignee_id' || lowerField === 'requester_id' || lowerField === 'submitter_id' || lowerField === 'user_id') && isNumeric) {
      const userName = lookups.users.get(numVal);
      if (userName) return `${userName} (${numVal})`;
    }

    // Resolve Organization
    if ((lowerField === 'organization_id' || lowerField === 'organization') && isNumeric) {
      const orgName = lookups.organizations.get(numVal);
      if (orgName) return `${orgName} (${numVal})`;
    }

    // Resolve Form
    if ((lowerField === 'ticket_form_id' || lowerField === 'form_id') && isNumeric) {
      const formName = lookups.forms.get(numVal);
      if (formName) return `${formName} (${numVal})`;
    }

    // Resolve Brand
    if ((lowerField === 'brand_id' || lowerField === 'brand') && isNumeric) {
      const brandName = lookups.brands.get(numVal);
      if (brandName) return `${brandName} (${numVal})`;
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
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
