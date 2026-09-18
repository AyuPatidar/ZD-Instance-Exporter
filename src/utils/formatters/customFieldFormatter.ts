import { ZendeskCustomFieldOption } from '../../types/resources';

export function formatCustomFieldOptions(options?: ZendeskCustomFieldOption[]): string {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return '';
  }

  return options
    .map(opt => {
      const defaultTag = opt.default ? ' [Default]' : '';
      return `${opt.name} → ${opt.value}${defaultTag}`;
    })
    .join('\n');
}
