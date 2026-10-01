import { ZendeskCondition, ZendeskConditions } from '../../types/common';
import { ZendeskLookups } from '../../types/lookups';
import { formatField, formatOperator, formatFieldValue, isUnaryOperator } from './fieldFormatter';

export function formatCondition(cond: ZendeskCondition, lookups?: ZendeskLookups): string {
  if (!cond) return '';
  const fieldName = formatField(cond.field, lookups);
  const opLower = (cond.operator || '').toLowerCase();

  // If operator is 'changed':
  // If cond.value is provided (including null, but not undefined and not empty string):
  // e.g. { field: 'assignee_id', operator: 'changed', value: null } -> "Assignee | Changed to | null"
  // e.g. { field: 'assignee_id', operator: 'changed', value: 12345 } -> "Assignee | Changed to | John Doe (12345)"
  // If cond.value is undefined or '':
  // e.g. { field: 'assignee_id', operator: 'changed', value: '' } -> "Assignee | Changed"
  if (opLower === 'changed') {
    if (cond.value !== undefined && cond.value !== '') {
      const valDisplay = formatFieldValue(cond.field, cond.value, lookups, 'changed');
      return `${fieldName} | Changed to | ${valDisplay}`;
    }
    return `${fieldName} | Changed`;
  }

  // Unary operators (e.g. 'not_changed', 'present', 'not_present', 'is_empty', 'is_set')
  if (isUnaryOperator(cond.operator, cond.value)) {
    const operatorName = formatOperator(cond.operator);
    return `${fieldName} | ${operatorName}`;
  }

  const operatorName = formatOperator(cond.operator);
  const valueDisplay = formatFieldValue(cond.field, cond.value, lookups, cond.operator);
  
  if (!operatorName && !valueDisplay) {
    return fieldName;
  }
  return `${fieldName} | ${operatorName} | ${valueDisplay || '(empty)'}`;
}

export function formatConditionList(conditions?: ZendeskCondition[], lookups?: ZendeskLookups): string {
  if (!conditions || conditions.length === 0) return '';
  return conditions.map((c, idx) => `${idx + 1}. ${formatCondition(c, lookups)}`).join('\n');
}

export function formatConditions(conditions?: ZendeskConditions, lookups?: ZendeskLookups): { all: string; any: string } {
  if (!conditions) {
    return { all: '', any: '' };
  }

  const allFormatted = formatConditionList(conditions.all, lookups);
  const anyFormatted = formatConditionList(conditions.any, lookups);

  return {
    all: allFormatted,
    any: anyFormatted,
  };
}
