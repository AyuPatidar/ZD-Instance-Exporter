import { ZendeskCondition, ZendeskConditions } from '../../types/common';
import { ZendeskLookups } from '../../types/lookups';
import { formatField, formatOperator, formatFieldValue, isUnaryOperator } from './fieldFormatter';

export function formatCondition(cond: ZendeskCondition, lookups?: ZendeskLookups): string {
  if (!cond) return '';
  const fieldName = formatField(cond.field, lookups);
  const operatorName = formatOperator(cond.operator);
  
  // Unary operators (e.g. 'changed', 'not_changed', 'present', 'not_present', 'is_empty', 'is_set') do not take a value
  if (isUnaryOperator(cond.operator)) {
    return `${fieldName} | ${operatorName}`;
  }

  const valueDisplay = formatFieldValue(cond.field, cond.value, lookups);
  
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
