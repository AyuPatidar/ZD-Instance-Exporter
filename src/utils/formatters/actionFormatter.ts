import { ZendeskAction } from '../../types/common';
import { ZendeskLookups } from '../../types/lookups';
import { formatField, formatFieldValue } from './fieldFormatter';

export function formatAction(action: ZendeskAction, lookups?: ZendeskLookups): string {
  if (!action) return '';

  const fieldName = formatField(action.field, lookups);
  let val = action.value;

  // Sometimes Zendesk action value is an array: [user_id, subject, template] or similar
  if (Array.isArray(val)) {
    if (val.length === 2 && typeof val[0] === 'string') {
      // E.g. notification format: ["requester_and_ccs", "Email Subject"]
      val = `${val[0]} (${val[1]})`;
    } else {
      val = val.map(v => formatFieldValue(action.field, v, lookups)).join(', ');
    }
  } else {
    val = formatFieldValue(action.field, val, lookups);
  }

  if (val === '' || val === undefined) {
    return fieldName;
  }

  return `${fieldName} → ${val}`;
}

export function formatActionList(actions?: ZendeskAction[], lookups?: ZendeskLookups): string {
  if (!actions || actions.length === 0) return '';
  return actions.map(a => formatAction(a, lookups)).join('\n');
}
