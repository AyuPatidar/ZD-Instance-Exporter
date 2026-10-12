import { fetchAllPages, fetchWithUsageFallback } from './pagination';
import { zendeskRequest } from './zendeskRequest';
import { getZendeskLookups } from './lookupService';
import {
  ResourceItem,
  ZendeskTriggerRaw,
  TriggerExportRow,
  ZendeskAutomationRaw,
  AutomationExportRow,
  ZendeskViewRaw,
  ViewExportRow,
  ZendeskOrganizationRaw,
  OrganizationExportRow,
  ZendeskAgentRaw,
  AgentExportRow,
  ZendeskGroupRaw,
  GroupExportRow,
  ZendeskMacroRaw,
  MacroExportRow,
  ZendeskTicketFieldRaw,
  CustomFieldExportRow,
  ZendeskScheduleRaw,
  ScheduleExportRow,
  ZendeskSupportAddressRaw,
  SupportAddressExportRow,
  ZendeskTicketFormRaw,
  TicketFormExportRow,
  ZendeskSLAPolicyRaw,
  SLAPolicyExportRow,
  ZendeskGroupSLAPolicyRaw,
  GroupSLAPolicyExportRow,
  ConfigTabKey,
} from '../../types/resources';
import { formatConditions } from '../../utils/formatters/conditionFormatter';
import { formatActionList } from '../../utils/formatters/actionFormatter';
import { formatScheduleIntervals, formatScheduleHolidays } from '../../utils/formatters/scheduleFormatter';
import { formatSLAMetricsList } from '../../utils/formatters/slaFormatter';
import { formatCustomFieldOptions, formatRecordCustomFields } from '../../utils/formatters/customFieldFormatter';
import { formatDateUTC } from '../../utils/formatters/dateFormatter';

export function getDirectUrl(subdomain: string, type: ConfigTabKey, id: number | string): string {
  const host = subdomain ? `${subdomain}.zendesk.com` : 'support.zendesk.com';
  switch (type) {
    case 'triggers':
      return `https://${host}/admin/objects-rules/rules/triggers/${id}`;
    case 'automations':
      return `https://${host}/admin/objects-rules/rules/automations/${id}`;
    case 'views':
      return `https://${host}/admin/workspaces/agent-workspace/views/${id}`;
    case 'organizations':
      return `https://${host}/agent/organizations/${id}`;
    case 'agents':
      return `https://${host}/agent/users/${id}`;
    case 'groups':
      return `https://${host}/admin/people/team/groups/${id}`;
    case 'macros':
      return `https://${host}/admin/objects-rules/rules/macros/${id}`;
    case 'custom_fields':
      return `https://${host}/admin/objects-rules/tickets/ticket-fields/${id}`;
    case 'business_hours':
      return `https://${host}/admin/objects-rules/rules/schedules/${id}`;
    case 'support_addresses':
      return `https://${host}/admin/channels/talk-and-email/email/addresses/${id}`;
    case 'forms':
      return `https://${host}/admin/objects-rules/tickets/ticket-forms/${id}`;
    case 'slas':
      return `https://${host}/admin/objects-rules/rules/slas/${id}`;
    case 'group_slas':
      return `https://${host}/admin/objects-rules/rules/group-slas/${id}`;
    default:
      return `https://${host}`;
  }
}

// 1. Triggers
export async function getTriggers(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskTriggerRaw, TriggerExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchWithUsageFallback<ZendeskTriggerRaw>(
    '/api/v2/triggers.json?include=usage_1h,usage_24h,usage_7d,usage_30d&page[size]=100',
    '/api/v2/triggers.json?page[size]=100',
    'triggers',
    onProgress
  );

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.conditions, lookups);
    const actions = formatActionList(raw.actions, lookups);

    let categoryName = '';
    let categoryPosition: number | string = '';
    if (raw.category_id && lookups.triggerCategories) {
      const cat =
        lookups.triggerCategories.get(raw.category_id) ||
        lookups.triggerCategories.get(String(raw.category_id)) ||
        lookups.triggerCategories.get(Number(raw.category_id));
      if (cat) {
        categoryName = cat.name;
        categoryPosition = cat.position;
      }
    }

    const exportRow: TriggerExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Description: raw.description || '',
      Active: Boolean(raw.active),
      'Category Name': categoryName,
      'Category Position': categoryPosition,
      Position: Number(raw.position ?? 0),
      'Usage (1h)': raw.usage_1h !== undefined && raw.usage_1h !== null ? Number(raw.usage_1h) : '',
      'Usage (24h)': raw.usage_24h !== undefined && raw.usage_24h !== null ? Number(raw.usage_24h) : '',
      'Usage (7d)': raw.usage_7d !== undefined && raw.usage_7d !== null ? Number(raw.usage_7d) : '',
      'Usage (30d)': raw.usage_30d !== undefined && raw.usage_30d !== null ? Number(raw.usage_30d) : '',
      'All Conditions': all,
      'Any Conditions': any,
      Actions: actions,
      URL: getDirectUrl(lookups.subdomain, 'triggers', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 2. Automations
export async function getAutomations(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskAutomationRaw, AutomationExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchWithUsageFallback<ZendeskAutomationRaw>(
    '/api/v2/automations.json?include=usage_1h,usage_24h,usage_7d,usage_30d&page[size]=100',
    '/api/v2/automations.json?page[size]=100',
    'automations',
    onProgress
  );

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.conditions, lookups);
    const actions = formatActionList(raw.actions, lookups);

    const exportRow: AutomationExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Description: raw.description || '',
      Active: Boolean(raw.active),
      Position: Number(raw.position ?? 0),
      'Usage (1h)': raw.usage_1h !== undefined && raw.usage_1h !== null ? Number(raw.usage_1h) : '',
      'Usage (24h)': raw.usage_24h !== undefined && raw.usage_24h !== null ? Number(raw.usage_24h) : '',
      'Usage (7d)': raw.usage_7d !== undefined && raw.usage_7d !== null ? Number(raw.usage_7d) : '',
      'Usage (30d)': raw.usage_30d !== undefined && raw.usage_30d !== null ? Number(raw.usage_30d) : '',
      'All Conditions': all,
      'Any Conditions': any,
      Actions: actions,
      URL: getDirectUrl(lookups.subdomain, 'automations', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 3. Views
export async function getViews(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskViewRaw, ViewExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskViewRaw>('/api/v2/views.json?page[size]=100', 'views', onProgress);

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.conditions, lookups);

    let restrictionStr = 'Everyone';
    if (raw.restriction) {
      if (raw.restriction.type === 'Group' && raw.restriction.id) {
        const groupName = lookups.groups.get(raw.restriction.id) || `Group ${raw.restriction.id}`;
        restrictionStr = `Group: ${groupName}`;
      } else if (raw.restriction.type) {
        restrictionStr = raw.restriction.type;
      }
    }

    const columns = (raw.execution?.columns || raw.execution?.fields || [])
      .map(col => {
        if (typeof col.id === 'number') {
          const customField = lookups.ticketFields.get(col.id);
          return customField ? `${customField.title} (${col.id})` : `Field ${col.id}`;
        }
        return col.title || String(col.id);
      })
      .join(', ');

    const exportRow: ViewExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Active: Boolean(raw.active),
      Default: Boolean(raw.default),
      Position: Number(raw.position ?? 0),
      Description: raw.description || '',
      'Access Restriction': restrictionStr,
      'SLA ID': raw.sla_id ? Number(raw.sla_id) : '',
      Watchable: Boolean(raw.watchable),
      'All Conditions': all,
      'Any Conditions': any,
      Columns: columns,
      'Group By': raw.execution?.group_by || '',
      'Group Order': raw.execution?.group_order || '',
      'Sort By': raw.execution?.sort_by || '',
      'Sort Order': raw.execution?.sort_order || '',
      URL: getDirectUrl(lookups.subdomain, 'views', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 4. Organizations
export async function getOrganizations(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskOrganizationRaw, OrganizationExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskOrganizationRaw>('/api/v2/organizations.json?page[size]=100', 'organizations', onProgress);

  return rawList.map(raw => {
    const domainNames = Array.isArray(raw.domain_names)
      ? raw.domain_names.map((d, idx) => `${idx + 1}. ${d}`).join('\n')
      : '';
    const tags = Array.isArray(raw.tags) ? raw.tags.join(', ') : '';

    let groupStr = '';
    if (raw.group_id) {
      const gName = lookups.groups.get(raw.group_id);
      groupStr = gName ? `${gName} (${raw.group_id})` : String(raw.group_id);
    }

    const customFieldsStr = formatRecordCustomFields(
      raw.organization_fields,
      raw.custom_fields,
      lookups.organizationFields,
      lookups.organizationFieldsMap
    );

    const exportRow: OrganizationExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Details: raw.details || '',
      Notes: raw.notes || '',
      'Domain Names': domainNames,
      'External ID': raw.external_id || '',
      'Group ID': groupStr,
      'Shared Comments': Boolean(raw.shared_comments),
      'Shared Tickets': Boolean(raw.shared_tickets),
      'Ticket Restriction': raw.ticket_restriction || '',
      Tags: tags,
      'Custom Fields': customFieldsStr,
      URL: getDirectUrl(lookups.subdomain, 'organizations', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 5. Agents
export async function getAgents(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskAgentRaw, AgentExportRow>[]> {
  const lookups = await getZendeskLookups();
  // Filter for agent and admin team members (exclude end users)
  const rawList = await fetchAllPages<ZendeskAgentRaw>('/api/v2/users.json?role[]=agent&role[]=admin&page[size]=100', 'users', onProgress);
  // Ensure non-agent end users are strictly excluded even if returned by API
  const agentsOnly = rawList.filter(u => u.role === 'agent' || u.role === 'admin');

  return agentsOnly.map(raw => {
    let orgStr = '';
    if (raw.organization_id) {
      const orgName = lookups.organizations.get(raw.organization_id);
      orgStr = orgName ? `${orgName} (${raw.organization_id})` : String(raw.organization_id);
    }

    let groupIdsStr = '';
    const userGroups =
      Array.isArray(raw.group_ids) && raw.group_ids.length > 0
        ? raw.group_ids
        : lookups.userGroupIds?.get(raw.id) ||
          (raw.default_group_id ? [raw.default_group_id] : []);

    if (userGroups.length > 0) {
      groupIdsStr = userGroups
        .map(gid => {
          const gName = lookups.groups.get(gid);
          return gName ? `${gName} (${gid})` : String(gid);
        })
        .join(', ');
    }

    const brandIdsStr = Array.isArray(raw.agent_brand_ids)
      ? raw.agent_brand_ids
          .map(bid => {
            const bName = lookups.brands.get(bid);
            return bName ? `${bName} (${bid})` : String(bid);
          })
          .join(', ')
      : '';

    const tags = Array.isArray(raw.tags) ? raw.tags.join(', ') : '';

    const userFieldsStr = formatRecordCustomFields(
      raw.user_fields,
      raw.custom_fields,
      lookups.userFields,
      lookups.userFieldsMap
    );

    let customRoleName = '';
    if (raw.custom_role_id) {
      customRoleName =
        lookups.customRoles.get(raw.custom_role_id) ||
        lookups.customRoles.get(String(raw.custom_role_id)) ||
        lookups.customRoles.get(Number(raw.custom_role_id)) ||
        '';
    }

    const exportRow: AgentExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Email: raw.email || '',
      Role: raw.role || '',
      'Role Type': raw.role_type !== undefined ? String(raw.role_type) : '',
      'Custom Role ID': raw.custom_role_id ?? '',
      'Custom Role Name': customRoleName,
      Active: Boolean(raw.active),
      Suspended: Boolean(raw.suspended),
      'Two-Factor Auth Enabled': Boolean(raw.two_factor_auth_enabled),
      'Restricted Agent': Boolean(raw.restricted_agent),
      'Ticket Restriction': raw.ticket_restriction || '',
      'Only Private Comments': Boolean(raw.only_private_comments),
      Alias: raw.alias || '',
      'External ID': raw.external_id || '',
      Details: raw.details || '',
      Notes: raw.notes || '',
      Phone: raw.phone || '',
      'Time Zone': raw.time_zone || '',
      Locale: raw.locale || '',
      'Organization ID': orgStr,
      'Group IDs': groupIdsStr,
      'Agent Brand IDs': brandIdsStr,
      Tags: tags,
      'User Fields': userFieldsStr,
      URL: getDirectUrl(lookups.subdomain, 'agents', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
      'Last Login At': formatDateUTC(raw.last_login_at),
      Verified: Boolean(raw.verified),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 6. Groups
export async function getGroups(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskGroupRaw, GroupExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskGroupRaw>('/api/v2/groups.json?page[size]=100', 'groups', onProgress);

  return rawList.map(raw => {
    // Resolve agent count:
    // 1. Check lookups.groupAgentCounts (populated from group_memberships or agent records)
    // 2. Check raw.agent_count (from mock or API)
    // 3. Fallback to 0 (ensures an actual number in Excel rather than blank)
    let agentCount: number = 0;
    if (lookups.groupAgentCounts && lookups.groupAgentCounts.has(raw.id)) {
      agentCount = lookups.groupAgentCounts.get(raw.id)!;
    } else if (raw.agent_count !== undefined && raw.agent_count !== null) {
      agentCount = Number(raw.agent_count);
    }

    const exportRow: GroupExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Description: raw.description || '',
      Default: Boolean(raw.default),
      Public: Boolean(raw.is_public),
      Deleted: Boolean(raw.deleted),
      'Agent Count': agentCount,
      URL: getDirectUrl(lookups.subdomain, 'groups', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw: { ...raw, agent_count: agentCount },
      exportRow,
    };
  });
}

// 7. Macros
export async function getMacros(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskMacroRaw, MacroExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchWithUsageFallback<ZendeskMacroRaw>(
    '/api/v2/macros.json?include=usage_1h,usage_24h,usage_7d,usage_30d&page[size]=100',
    '/api/v2/macros.json?page[size]=100',
    'macros',
    onProgress
  );

  return rawList.map(raw => {
    const actions = formatActionList(raw.actions, lookups);

    let restrictionStr = 'Everyone';
    if (raw.restriction) {
      if (raw.restriction.type === 'Group' && raw.restriction.id) {
        const groupName = lookups.groups.get(raw.restriction.id) || `Group ${raw.restriction.id}`;
        restrictionStr = `Group: ${groupName}`;
      } else if (raw.restriction.type) {
        restrictionStr = raw.restriction.type;
      }
    }

    const exportRow: MacroExportRow = {
      ID: raw.id,
      Name: raw.title || '',
      Description: raw.description || '',
      Active: Boolean(raw.active),
      Default: Boolean(raw.default),
      'Usage (1h)': raw.usage_1h !== undefined && raw.usage_1h !== null ? Number(raw.usage_1h) : '',
      'Usage (24h)': raw.usage_24h !== undefined && raw.usage_24h !== null ? Number(raw.usage_24h) : '',
      'Usage (7d)': raw.usage_7d !== undefined && raw.usage_7d !== null ? Number(raw.usage_7d) : '',
      'Usage (30d)': raw.usage_30d !== undefined && raw.usage_30d !== null ? Number(raw.usage_30d) : '',
      Actions: actions,
      Restriction: restrictionStr,
      URL: getDirectUrl(lookups.subdomain, 'macros', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 8. Custom Fields (Ticket Fields)
export async function getCustomFields(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskTicketFieldRaw, CustomFieldExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskTicketFieldRaw>('/api/v2/ticket_fields.json?page[size]=100', 'ticket_fields', onProgress);

  return rawList.map(raw => {
    const optionsList =
      raw.custom_field_options && raw.custom_field_options.length > 0
        ? raw.custom_field_options
        : raw.system_field_options && raw.system_field_options.length > 0
          ? raw.system_field_options
          : raw.custom_statuses;
    const optionsStr = formatCustomFieldOptions(optionsList);
    const filterStr = raw.relationship_filter ? JSON.stringify(raw.relationship_filter) : '';
    const isSystemField = raw.removable === false || ['subject', 'description', 'status', 'tickettype', 'priority', 'group', 'assignee'].includes((raw.type || '').toLowerCase());
    const displayType = isSystemField ? `[System] ${raw.type}` : raw.type;

    const exportRow: CustomFieldExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Type: displayType || '',
      Key: raw.key || '',
      Active: Boolean(raw.active),
      Removable: raw.removable !== undefined ? Boolean(raw.removable) : true,
      'Sub Type ID': raw.sub_type_id !== undefined && raw.sub_type_id !== null ? Number(raw.sub_type_id) : '',
      Description: raw.description || '',
      'Agent Description': raw.agent_description || '',
      'Title In Portal': raw.title_in_portal || '',
      'Visible In Portal': Boolean(raw.visible_in_portal),
      'Editable In Portal': Boolean(raw.editable_in_portal),
      Required: Boolean(raw.required),
      'Required In Portal': Boolean(raw.required_in_portal),
      'Agent Can Edit': Boolean(raw.agent_can_edit),
      'Collapsed For Agents': Boolean(raw.collapsed_for_agents),
      Position: Number(raw.position ?? 0),
      Tag: raw.tag || '',
      'Regexp For Validation': raw.regexp_for_validation || '',
      'Custom Field Options': optionsStr,
      'Relationship Target Type': raw.relationship_target_type || '',
      'Relationship Filter': filterStr,
      'Creator App Name': raw.creator_app_name || '',
      URL: getDirectUrl(lookups.subdomain, 'custom_fields', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 9. Business Hours (Schedules)
export async function getBusinessHours(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskScheduleRaw, ScheduleExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskScheduleRaw>('/api/v2/business_hours/schedules.json', 'schedules', onProgress);

  const schedulesWithHolidays = await Promise.all(
    rawList.map(async raw => {
      if (raw.holidays && Array.isArray(raw.holidays)) {
        return raw;
      }
      try {
        const res = await zendeskRequest<any>({
          url: `/api/v2/business_hours/schedules/${raw.id}/holidays.json`,
          type: 'GET',
        });
        const holidays = res?.holidays || [];
        return { ...raw, holidays };
      } catch {
        return { ...raw, holidays: [] };
      }
    })
  );

  return schedulesWithHolidays.map(raw => {
    const days = formatScheduleIntervals(raw.intervals);
    const holidaysStr = formatScheduleHolidays(raw.holidays);

    const exportRow: ScheduleExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      'Time Zone': raw.time_zone || '',
      Monday: days.Monday,
      Tuesday: days.Tuesday,
      Wednesday: days.Wednesday,
      Thursday: days.Thursday,
      Friday: days.Friday,
      Saturday: days.Saturday,
      Sunday: days.Sunday,
      Holidays: holidaysStr,
      URL: getDirectUrl(lookups.subdomain, 'business_hours', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 10. Support Addresses
export async function getSupportAddresses(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskSupportAddressRaw, SupportAddressExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskSupportAddressRaw>('/api/v2/recipient_addresses.json', 'recipient_addresses', onProgress);

  return rawList.map(raw => {
    let brandStr = '';
    if (raw.brand_id) {
      const bName = lookups.brands.get(raw.brand_id);
      brandStr = bName ? `${bName} (${raw.brand_id})` : String(raw.brand_id);
    }

    let dnsStatus = '';
    if (raw.dns_results) {
      if (typeof raw.dns_results === 'string') {
        dnsStatus = raw.dns_results;
      } else if (typeof raw.dns_results === 'object') {
        try {
          dnsStatus = JSON.stringify(raw.dns_results);
        } catch {
          dnsStatus = String(raw.dns_results);
        }
      }
    } else if (raw.dns_check_status) {
      dnsStatus = String(raw.dns_check_status);
    } else if (raw.dns_status) {
      dnsStatus = String(raw.dns_status);
    } else if (raw.cname_status && raw.cname_status !== 'unknown') {
      dnsStatus = raw.cname_status;
    } else if (raw.domain_verification_status && raw.domain_verification_status !== 'unknown') {
      dnsStatus = raw.domain_verification_status;
    } else if (raw.cname_status) {
      dnsStatus = raw.cname_status;
    } else if (raw.domain_verification_status) {
      dnsStatus = raw.domain_verification_status;
    } else if (raw.email && /@.*\.zendesk\.com$/i.test(raw.email)) {
      dnsStatus = 'verified (native)';
    }

    const exportRow: SupportAddressExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Email: raw.email || '',
      'Brand ID': brandStr,
      Default: Boolean(raw.default),
      'Forwarding Status': raw.forwarding_status || '',
      'SPF Status': raw.spf_status || '',
      'CNAME Status': raw.cname_status || '',
      'DNS Verification Status': dnsStatus,
      'Domain Verification Status': raw.domain_verification_status || '',
      'Domain Verification Code': raw.domain_verification_code || '',
      URL: getDirectUrl(lookups.subdomain, 'support_addresses', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 11. Forms
export async function getForms(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskTicketFormRaw, TicketFormExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskTicketFormRaw>('/api/v2/ticket_forms.json?page[size]=100', 'ticket_forms', onProgress);

  return rawList.map(raw => {
    const fieldsStr = Array.isArray(raw.ticket_field_ids)
      ? raw.ticket_field_ids
          .map((fid, idx) => {
            const field = lookups.ticketFields.get(fid);
            const fieldTitle = field ? `${field.title} (${fid})` : `Field ${fid}`;
            return `${idx + 1}. ${fieldTitle}`;
          })
          .join('\n')
      : '';

    const brandIdsStr = Array.isArray(raw.restricted_brand_ids)
      ? raw.restricted_brand_ids
          .map(bid => {
            const bName = lookups.brands.get(bid);
            return bName ? `${bName} (${bid})` : String(bid);
          })
          .join(', ')
      : '';

    const agentConditionsStr = raw.agent_conditions && raw.agent_conditions.length > 0
      ? JSON.stringify(raw.agent_conditions)
      : '';

    const endUserConditionsStr = raw.end_user_conditions && raw.end_user_conditions.length > 0
      ? JSON.stringify(raw.end_user_conditions)
      : '';

    const exportRow: TicketFormExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      'Display Name': raw.display_name || '',
      Active: Boolean(raw.active),
      Default: Boolean(raw.default),
      Position: Number(raw.position ?? 0),
      'End User Visible': Boolean(raw.end_user_visible),
      'In All Brands': Boolean(raw.in_all_brands),
      'Restricted Brand IDs': brandIdsStr,
      'Ticket Field IDs': fieldsStr,
      'Agent Conditions': agentConditionsStr,
      'End User Conditions': endUserConditionsStr,
      URL: getDirectUrl(lookups.subdomain, 'forms', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 12. SLAs
export async function getSLAs(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskSLAPolicyRaw, SLAPolicyExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskSLAPolicyRaw>('/api/v2/slas/policies.json', 'sla_policies', onProgress);

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.filter, lookups);
    const metricsStr = formatSLAMetricsList(raw.policy_metrics);

    const exportRow: SLAPolicyExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Description: raw.description || '',
      Position: Number(raw.position ?? 0),
      'All Conditions': all,
      'Any Conditions': any,
      Metrics: metricsStr,
      URL: getDirectUrl(lookups.subdomain, 'slas', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}

// 13. Group SLAs
export async function getGroupSLAs(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskGroupSLAPolicyRaw, GroupSLAPolicyExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskGroupSLAPolicyRaw>('/api/v2/group_slas/policies.json', 'group_sla_policies', onProgress);

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.filter, lookups);
    const metricsStr = formatSLAMetricsList(raw.policy_metrics);

    const exportRow: GroupSLAPolicyExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Description: raw.description || '',
      Position: Number(raw.position ?? 0),
      'All Conditions': all,
      'Any Conditions': any,
      'Policy Metrics': metricsStr,
      URL: getDirectUrl(lookups.subdomain, 'group_slas', raw.id),
      'Created At': formatDateUTC(raw.created_at),
      'Updated At': formatDateUTC(raw.updated_at),
    };

    return {
      id: raw.id,
      raw,
      exportRow,
    };
  });
}
