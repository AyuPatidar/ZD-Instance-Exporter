import { ZendeskLookups, createEmptyLookups, TicketFieldLookup } from '../../types/lookups';
import { fetchAllPages } from './pagination';
import { zendeskRequest } from './zendeskRequest';
import { ZendeskGroupRaw, ZendeskAgentRaw, ZendeskOrganizationRaw, ZendeskTicketFieldRaw, ZendeskTicketFormRaw } from '../../types/resources';

let cachedLookups: ZendeskLookups | null = null;
let lookupPromise: Promise<ZendeskLookups> | null = null;

export async function getZendeskLookups(forceRefresh = false): Promise<ZendeskLookups> {
  if (cachedLookups && !forceRefresh) {
    return cachedLookups;
  }

  if (lookupPromise && !forceRefresh) {
    return lookupPromise;
  }

  lookupPromise = (async () => {
    const lookups = createEmptyLookups();

    // 1. Fetch Groups
    try {
      const groups = await fetchAllPages<ZendeskGroupRaw>('/api/v2/groups.json?page[size]=100', 'groups');
      for (const group of groups) {
        lookups.groups.set(group.id, group.name);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch groups for cross-referencing:', err);
    }

    // 2. Fetch Agents (role=agent & role=admin)
    try {
      const agents = await fetchAllPages<ZendeskAgentRaw>('/api/v2/users.json?role[]=agent&role[]=admin&page[size]=100', 'users');
      for (const agent of agents) {
        lookups.users.set(agent.id, agent.name || agent.email);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch agents for cross-referencing:', err);
    }

    // 3. Fetch Organizations
    try {
      const orgs = await fetchAllPages<ZendeskOrganizationRaw>('/api/v2/organizations.json?page[size]=100', 'organizations');
      for (const org of orgs) {
        lookups.organizations.set(org.id, org.name);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch organizations for cross-referencing:', err);
    }

    // 4. Fetch Ticket Fields
    try {
      const fields = await fetchAllPages<ZendeskTicketFieldRaw>('/api/v2/ticket_fields.json?page[size]=100', 'ticket_fields');
      for (const field of fields) {
        const optionMap = new Map<string, string>();
        if (field.custom_field_options) {
          for (const opt of field.custom_field_options) {
            optionMap.set(opt.value, opt.name);
          }
        }
        const lookupItem: TicketFieldLookup = {
          id: field.id,
          title: field.title,
          type: field.type,
          options: optionMap,
        };
        lookups.ticketFields.set(field.id, lookupItem);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch ticket fields for cross-referencing:', err);
    }

    // 5. Fetch Forms
    try {
      const forms = await fetchAllPages<ZendeskTicketFormRaw>('/api/v2/ticket_forms.json?page[size]=100', 'ticket_forms');
      for (const form of forms) {
        lookups.forms.set(form.id, form.name || form.display_name || `Form ${form.id}`);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch forms for cross-referencing:', err);
    }

    // 6. Fetch Brands
    try {
      const brands = await fetchAllPages<any>('/api/v2/brands.json?page[size]=100', 'brands');
      for (const brand of brands) {
        lookups.brands.set(brand.id, brand.name);
      }
    } catch (err) {
      console.warn('[Lookups] Failed to fetch brands for cross-referencing:', err);
    }

    // 7. Fetch Custom Roles (Enterprise accounts)
    try {
      const customRolesRes = await fetchAllPages<any>('/api/v2/custom_roles.json', 'custom_roles');
      for (const role of customRolesRes) {
        if (role && role.id && role.name) {
          lookups.customRoles.set(role.id, role.name);
          lookups.customRoles.set(Number(role.id), role.name);
          lookups.customRoles.set(String(role.id), role.name);
        }
      }
    } catch (err) {
      try {
        const directRes = await zendeskRequest<any>({ url: '/api/v2/custom_roles.json', type: 'GET' });
        const list = directRes?.custom_roles || [];
        for (const role of list) {
          if (role && role.id && role.name) {
            lookups.customRoles.set(role.id, role.name);
            lookups.customRoles.set(Number(role.id), role.name);
            lookups.customRoles.set(String(role.id), role.name);
          }
        }
      } catch (innerErr) {
        console.warn('[Lookups] Custom roles not available or restricted on this plan:', innerErr);
      }
    }

    // 8. Fetch Business Hours Schedules
    try {
      const schedulesRes = await fetchAllPages<any>('/api/v2/business_hours/schedules.json', 'schedules');
      for (const sched of schedulesRes) {
        if (sched && sched.id && sched.name) {
          lookups.schedules.set(sched.id, sched.name);
          lookups.schedules.set(Number(sched.id), sched.name);
          lookups.schedules.set(String(sched.id), sched.name);
        }
      }
    } catch (err) {
      try {
        const directSched = await zendeskRequest<any>({ url: '/api/v2/business_hours/schedules.json', type: 'GET' });
        const list = directSched?.schedules || [];
        for (const sched of list) {
          if (sched && sched.id && sched.name) {
            lookups.schedules.set(sched.id, sched.name);
            lookups.schedules.set(Number(sched.id), sched.name);
            lookups.schedules.set(String(sched.id), sched.name);
          }
        }
      } catch (innerErr) {
        console.warn('[Lookups] Failed to fetch schedules for cross-referencing:', innerErr);
      }
    }

    cachedLookups = lookups;
    lookupPromise = null;
    return lookups;
  })();

  return lookupPromise;
}

export function invalidateLookupCache(): void {
  cachedLookups = null;
  lookupPromise = null;
}
