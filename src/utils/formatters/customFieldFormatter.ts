import { ZendeskCustomFieldOption } from '../../types/resources';
import { CustomFieldDefinitionLookup } from '../../types/lookups';

export function formatCustomFieldOptions(options?: ZendeskCustomFieldOption[]): string {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return '';
  }

  return options
    .map((opt, idx) => {
      const defaultTag = opt.default ? ' [Default]' : '';
      return `${idx + 1}. ${opt.name} → ${opt.value}${defaultTag}`;
    })
    .join('\n');
}

function formatFieldValue(val: any, def?: CustomFieldDefinitionLookup): string {
  if (val === null || val === undefined || val === '') {
    return '-';
  }
  if (typeof val === 'boolean') {
    return val ? 'Yes' : 'No';
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '-';
    return val
      .map(item => {
        const itemStr = String(item);
        return def?.options?.get(itemStr) || def?.options?.get(itemStr.toLowerCase()) || itemStr;
      })
      .join(', ');
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  const strVal = String(val);
  if (def?.options?.has(strVal)) {
    const optName = def.options.get(strVal);
    return optName || strVal;
  }
  if (def?.options?.has(strVal.toLowerCase())) {
    const optName = def.options.get(strVal.toLowerCase());
    return optName || strVal;
  }
  return strVal;
}

/**
 * Formats all custom fields (organization_fields or user_fields) for a record into a multiline cell.
 * Shows ALL defined custom fields in the account (even if unset/empty on this record as '-'),
 * plus any extra ad-hoc custom fields present on the record.
 */
export function formatRecordCustomFields(
  recordFields: Record<string, any> | undefined | null,
  customFieldsArray: any[] | undefined | null,
  definitions: CustomFieldDefinitionLookup[] = [],
  definitionsMap: Map<string, CustomFieldDefinitionLookup> = new Map()
): string {
  const valuesMap = new Map<string, any>();

  // Extract from record object (e.g. raw.organization_fields or raw.user_fields)
  if (recordFields && typeof recordFields === 'object' && !Array.isArray(recordFields)) {
    for (const [key, value] of Object.entries(recordFields)) {
      valuesMap.set(key, value);
      valuesMap.set(String(key).toLowerCase(), value);
    }
  }

  // Also extract from custom_fields array if present (e.g. [{ id: 123, value: 'val' }])
  if (Array.isArray(customFieldsArray)) {
    for (const item of customFieldsArray) {
      if (item && typeof item === 'object') {
        const k = item.key || item.id;
        if (k !== undefined && k !== null) {
          valuesMap.set(String(k), item.value);
          valuesMap.set(String(k).toLowerCase(), item.value);
        }
      }
    }
  }

  const lines: string[] = [];
  const visitedKeys = new Set<string>();

  // 1. If we have account-level custom field definitions, iterate ALL of them to guarantee every field is shown
  if (definitions && definitions.length > 0) {
    for (const def of definitions) {
      visitedKeys.add(def.key);
      visitedKeys.add(def.key.toLowerCase());
      visitedKeys.add(String(def.id));
      visitedKeys.add(String(def.id).toLowerCase());

      const rawVal =
        valuesMap.get(def.key) ??
        valuesMap.get(def.key.toLowerCase()) ??
        valuesMap.get(String(def.id));

      const displayVal = formatFieldValue(rawVal, def);
      lines.push(`${def.title}: ${displayVal}`);
    }
  }

  // 2. Add any remaining fields present on the record that were not in definitions
  for (const [k, v] of valuesMap.entries()) {
    if (visitedKeys.has(k) || visitedKeys.has(k.toLowerCase())) continue;
    visitedKeys.add(k);
    visitedKeys.add(k.toLowerCase());

    const def = definitionsMap?.get(k) || definitionsMap?.get(k.toLowerCase());
    const title = def?.title || k;
    const displayVal = formatFieldValue(v, def);
    lines.push(`${title}: ${displayVal}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return lines.map((line, idx) => `${idx + 1}. ${line}`).join('\n');
}

