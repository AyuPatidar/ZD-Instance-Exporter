import { fetchAllPages } from './pagination';
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
} from '../../types/resources';
import { formatConditions } from '../../utils/formatters/conditionFormatter';
import { formatActionList } from '../../utils/formatters/actionFormatter';
import { formatScheduleIntervals } from '../../utils/formatters/scheduleFormatter';
import { formatSLAMetricsList } from '../../utils/formatters/slaFormatter';
import { formatCustomFieldOptions } from '../../utils/formatters/customFieldFormatter';
import { formatDateUTC } from '../../utils/formatters/dateFormatter';

// 1. Triggers
export async function getTriggers(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskTriggerRaw, TriggerExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskTriggerRaw>('/api/v2/triggers.json?page[size]=100', 'triggers', onProgress);

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.conditions, lookups);
    const actions = formatActionList(raw.actions, lookups);

    const exportRow: TriggerExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Active: Boolean(raw.active),
      Position: Number(raw.position ?? 0),
      'All Conditions': all,
      'Any Conditions': any,
      Actions: actions,
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
  const rawList = await fetchAllPages<ZendeskAutomationRaw>('/api/v2/automations.json?page[size]=100', 'automations', onProgress);

  return rawList.map(raw => {
    const { all, any } = formatConditions(raw.conditions, lookups);
    const actions = formatActionList(raw.actions, lookups);

    const exportRow: AutomationExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Active: Boolean(raw.active),
      Position: Number(raw.position ?? 0),
      'All Conditions': all,
      'Any Conditions': any,
      Actions: actions,
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
      'All Conditions': all,
      'Any Conditions': any,
      Columns: columns,
      'Group By': raw.execution?.group_by || '',
      'Group Order': raw.execution?.group_order || '',
      'Sort By': raw.execution?.sort_by || '',
      'Sort Order': raw.execution?.sort_order || '',
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
    const domainNames = Array.isArray(raw.domain_names) ? raw.domain_names.join('\n') : '';
    const tags = Array.isArray(raw.tags) ? raw.tags.join(', ') : '';

    let groupStr = '';
    if (raw.group_id) {
      const gName = lookups.groups.get(raw.group_id);
      groupStr = gName ? `${gName} (${raw.group_id})` : String(raw.group_id);
    }

    let customFieldsStr = '';
    if (raw.organization_fields && typeof raw.organization_fields === 'object') {
      customFieldsStr = Object.entries(raw.organization_fields)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }

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
      Tags: tags,
      'Custom Fields': customFieldsStr,
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
    if (Array.isArray(raw.group_ids) && raw.group_ids.length > 0) {
      groupIdsStr = raw.group_ids
        .map(gid => {
          const gName = lookups.groups.get(gid);
          return gName ? `${gName} (${gid})` : String(gid);
        })
        .join(', ');
    } else if (raw.default_group_id) {
      const gName = lookups.groups.get(raw.default_group_id);
      groupIdsStr = gName ? `${gName} (${raw.default_group_id})` : String(raw.default_group_id);
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

    let userFieldsStr = '';
    if (raw.user_fields && typeof raw.user_fields === 'object') {
      userFieldsStr = Object.entries(raw.user_fields)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }

    const exportRow: AgentExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Email: raw.email || '',
      Role: raw.role || '',
      'Role Type': raw.role_type !== undefined ? String(raw.role_type) : '',
      'Custom Role ID': raw.custom_role_id ?? '',
      Active: Boolean(raw.active),
      Suspended: Boolean(raw.suspended),
      'Restricted Agent': Boolean(raw.restricted_agent),
      Alias: raw.alias || '',
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
  const rawList = await fetchAllPages<ZendeskGroupRaw>('/api/v2/groups.json?page[size]=100', 'groups', onProgress);

  return rawList.map(raw => {
    const exportRow: GroupExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Description: raw.description || '',
      Default: Boolean(raw.default),
      Public: Boolean(raw.is_public),
      Deleted: Boolean(raw.deleted),
      'Agent Count': raw.agent_count !== undefined && raw.agent_count !== null ? raw.agent_count : '',
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

// 7. Macros
export async function getMacros(onProgress?: (count: number) => void): Promise<ResourceItem<ZendeskMacroRaw, MacroExportRow>[]> {
  const lookups = await getZendeskLookups();
  const rawList = await fetchAllPages<ZendeskMacroRaw>('/api/v2/macros.json?page[size]=100', 'macros', onProgress);

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
      Actions: actions,
      Restriction: restrictionStr,
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
  const rawList = await fetchAllPages<ZendeskTicketFieldRaw>('/api/v2/ticket_fields.json?page[size]=100', 'ticket_fields', onProgress);

  return rawList.map(raw => {
    const optionsStr = formatCustomFieldOptions(raw.custom_field_options);
    const filterStr = raw.relationship_filter ? JSON.stringify(raw.relationship_filter) : '';
    const isSystemField = raw.removable === false || ['subject', 'description', 'status', 'tickettype', 'priority', 'group', 'assignee'].includes((raw.type || '').toLowerCase());
    const displayType = isSystemField ? `[System] ${raw.type}` : raw.type;

    const exportRow: CustomFieldExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Type: displayType || '',
      Active: Boolean(raw.active),
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
  const rawList = await fetchAllPages<ZendeskScheduleRaw>('/api/v2/business_hours/schedules.json', 'schedules', onProgress);

  return rawList.map(raw => {
    const days = formatScheduleIntervals(raw.intervals);

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

    const exportRow: SupportAddressExportRow = {
      ID: raw.id,
      Name: raw.name || '',
      Email: raw.email || '',
      'Brand ID': brandStr,
      Default: Boolean(raw.default),
      'Forwarding Status': raw.forwarding_status || '',
      'SPF Status': raw.spf_status || '',
      'CNAME Status': raw.cname_status || '',
      'DNS Verification Status': raw.dns_results || '',
      'Domain Verification Status': raw.domain_verification_status || '',
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
          .map(fid => {
            const field = lookups.ticketFields.get(fid);
            return field ? `${field.title} (${fid})` : `Field ${fid}`;
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
    const { all } = formatConditions(raw.filter, lookups);
    const metricsStr = formatSLAMetricsList(raw.policy_metrics);

    const exportRow: GroupSLAPolicyExportRow = {
      ID: raw.id,
      Title: raw.title || '',
      Description: raw.description || '',
      Position: Number(raw.position ?? 0),
      'All Conditions': all,
      'Policy Metrics': metricsStr,
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
