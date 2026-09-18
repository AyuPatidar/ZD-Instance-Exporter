import { ZendeskCustomFieldOption } from '../../types/resources';

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
