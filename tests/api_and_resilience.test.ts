import { describe, test, expect } from 'vitest';
import {
  getTriggers,
  getAutomations,
  getViews,
  getOrganizations,
  getAgents,
  getGroups,
  getMacros,
  getCustomFields,
  getBusinessHours,
  getSupportAddresses,
  getForms,
  getSLAs,
  getGroupSLAs,
} from '../src/services/api/configServices';
import { getZendeskLookups, invalidateLookupCache } from '../src/services/api/lookupService';
import { fetchWithUsageFallback } from '../src/services/api/pagination';
import { buildWorkbook, TabExportData } from '../src/services/export/xlsxExporter';

describe('Zendesk Configuration Services (All 13 Resources)', () => {
  test('retrieves and transforms Triggers preserving raw and formatted rows with categories and URL', async () => {
    const items = await getTriggers();
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect(first.raw.id).toBeDefined();
    expect(first.exportRow.ID).toBe(first.raw.id);
    expect(first.exportRow.Description).toBe('Auto-responder for newly created tickets');
    expect(typeof first.exportRow.Active).toBe('boolean');
    expect(typeof first.exportRow.Position).toBe('number');
    expect(first.exportRow['Category Name']).toBe('Notifications');
    expect(first.exportRow['Category Position']).toBe(1);
    expect(first.exportRow['All Conditions']).toBeDefined();
    expect(first.exportRow.Actions).toBeDefined();
    expect(first.exportRow['Usage (1h)']).toBe(14);
    expect(first.exportRow['Usage (24h)']).toBe(312);
    expect(first.exportRow['Usage (7d)']).toBe(2180);
    expect(first.exportRow['Usage (30d)']).toBe(9450);
    expect(first.exportRow.URL).toContain('/admin/objects-rules/rules/triggers/');
  });

  test('retrieves and transforms Automations with direct URL and usage metrics', async () => {
    const items = await getAutomations();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Title).toBeDefined();
    expect(items[0].exportRow.Description).toBe('Close pending tickets after 4 days of customer inactivity');
    expect(typeof items[0].exportRow.Position).toBe('number');
    expect(items[0].exportRow['Usage (1h)']).toBe(5);
    expect(items[0].exportRow['Usage (24h)']).toBe(88);
    expect(items[0].exportRow['Usage (7d)']).toBe(615);
    expect(items[0].exportRow['Usage (30d)']).toBe(2640);
    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/rules/automations/');
  });

  test('retrieves and transforms Views with execution columns resolved and direct URL', async () => {
    const items = await getViews();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Columns).toBeDefined();
    expect(items[0].exportRow['Group By']).toBeDefined();
    expect(items[0].exportRow['SLA ID']).toBe(36001100001);
    expect(items[0].exportRow.Watchable).toBe(true);
    expect(items[0].exportRow.URL).toContain('/admin/workspaces/agent-workspace/views/');
  });

  test('retrieves and transforms Organizations resolving domain names, custom fields and direct URL', async () => {
    const items = await getOrganizations();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Domain Names']).toBeDefined();
    expect(items[0].exportRow['Ticket Restriction']).toBe('organization');
    expect(items[1].exportRow['Ticket Restriction']).toBe('restricted');
    expect(items[0].exportRow['Custom Fields']).toContain('Contract Tier: Platinum');
    expect(items[0].exportRow['Custom Fields']).toContain('Renewal Month: October');
    expect(items[0].exportRow['Custom Fields']).toContain('SLA Plan: -');
    expect(items[0].exportRow.URL).toContain('/agent/organizations/');
  });

  test('retrieves and transforms Agents filtering for team members, user fields and direct URL', async () => {
    const items = await getAgents();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Email).toBeDefined();
    expect(['admin', 'agent']).toContain(items[0].exportRow.Role);
    expect(items[0].exportRow['Two-Factor Auth Enabled']).toBe(true);
    expect(items[0].exportRow['Ticket Restriction']).toBe('organization');
    expect(items[0].exportRow['External ID']).toBe('EXT-USR-101');
    expect(items[1].exportRow['Custom Role Name']).toBe('Senior Support Engineer Tier 2');
    expect(items[0].exportRow['User Fields']).toContain('Department: Global Operations');
    expect(items[0].exportRow['User Fields']).toContain('Employee ID: -');
    expect(items[0].exportRow.URL).toContain('/agent/users/');
  });

  test('retrieves and transforms Groups with direct URL and resolved Agent Count', async () => {
    const items = await getGroups();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Name).toBeDefined();
    expect(typeof items[0].exportRow['Agent Count']).toBe('number');
    expect(items[0].exportRow['Agent Count']).toBeGreaterThan(0);
    expect(items[0].exportRow.URL).toContain('/admin/people/team/groups/');
  });

  test('retrieves and transforms Macros with direct URL and usage metrics', async () => {
    const items = await getMacros();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Actions).toBeDefined();
    expect(items[0].exportRow['Usage (1h)']).toBe(8);
    expect(items[0].exportRow['Usage (24h)']).toBe(96);
    expect(items[0].exportRow['Usage (7d)']).toBe(670);
    expect(items[0].exportRow['Usage (30d)']).toBe(2890);
    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/rules/macros/');
  });

  test('retrieves and transforms Custom Ticket Fields with options formatting and direct URL', async () => {
    const items = await getCustomFields();
    expect(items.length).toBeGreaterThan(0);
    const taggerField = items.find(f => f.raw.type === 'tagger');
    expect(taggerField).toBeDefined();
    expect(taggerField!.exportRow.Key).toBe('issue_category');
    expect(taggerField!.exportRow.Removable).toBe(true);
    expect(taggerField!.exportRow['Custom Field Options']).toContain('→');

    const priorityField = items.find(f => f.raw.type === 'priority');
    expect(priorityField).toBeDefined();
    expect(priorityField!.exportRow.Type).toBe('[System] priority');
    expect(priorityField!.exportRow.Removable).toBe(false);
    expect(priorityField!.exportRow['Custom Field Options']).toContain('Normal → normal');

    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/tickets/ticket-fields/');
  });

  test('retrieves and transforms Business Hours into weekday interval schedules with direct URL', async () => {
    const items = await getBusinessHours();
    expect(items.length).toBeGreaterThan(0);
    const schedule = items[0].exportRow;
    expect(schedule['Time Zone']).toBeDefined();
    expect(schedule.Monday).toContain(':');
    expect(schedule.Holidays).toContain('Christmas Day');
    expect(schedule.URL).toContain('/admin/objects-rules/rules/schedules/');
  });

  test('retrieves and transforms Support Addresses with direct URL and DNS Verification Status', async () => {
    const items = await getSupportAddresses();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Email).toBeDefined();
    expect(items[0].exportRow['DNS Verification Status']).toBe('pass');
    expect(items[0].exportRow['Domain Verification Code']).toBe('zd_verify_a1b2c3d4e5f6');
    expect(items[0].exportRow.URL).toContain('/admin/channels/talk-and-email/email/addresses/');
  });

  test('retrieves and transforms Ticket Forms resolving ticket field IDs with direct URL', async () => {
    const items = await getForms();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Ticket Field IDs']).toBeDefined();
    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/tickets/ticket-forms/');
  });

  test('retrieves and transforms SLA Policies formatting metrics with direct URL', async () => {
    const items = await getSLAs();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Metrics).toContain('Priority:');
    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/rules/slas/');
  });

  test('retrieves and transforms Group SLA Policies with direct URL', async () => {
    const items = await getGroupSLAs();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Policy Metrics']).toContain('Priority:');
    expect(items[0].exportRow['Any Conditions']).toContain('Type | Is | incident');
    expect(items[0].exportRow.URL).toContain('/admin/objects-rules/rules/group-slas/');
  });
});

describe('Cross-Reference Lookups Cache', () => {
  test('caches lookups and invalidates cache on request', async () => {
    invalidateLookupCache();
    const lookups1 = await getZendeskLookups();
    expect(lookups1.groups.size).toBeGreaterThan(0);

    const lookups2 = await getZendeskLookups();
    expect(lookups1).toBe(lookups2); // Same cached instance

    invalidateLookupCache();
    const lookups3 = await getZendeskLookups();
    expect(lookups3.groups.size).toBeGreaterThan(0);
  });

  test('loads custom roles, organization fields, and user fields into lookup cache', async () => {
    invalidateLookupCache();
    const lookups = await getZendeskLookups();
    expect(lookups.customRoles.get(25176440012818)).toBe('Tier 2 Specialist');
    expect(lookups.customRoles.get('25176440012818')).toBe('Tier 2 Specialist');
    expect(lookups.organizationFields.length).toBeGreaterThan(0);
    expect(lookups.userFields.length).toBeGreaterThan(0);
  });
});

describe('Partial Failure Resilience', () => {
  test('handles failed tabs without aborting export of successful tabs', () => {
    const datasets: TabExportData[] = [
      {
        tabKey: 'triggers',
        sheetName: 'Triggers',
        data: [{ ID: 1, Title: 'Trigger 1' }],
      },
      {
        tabKey: 'slas',
        sheetName: 'SLAs',
        data: [], // Simulates 403 Forbidden / unavailable on plan
      },
    ];

    // Must build workbook with both sheets without error
    const wb = buildWorkbook(datasets);
    expect(wb.SheetNames).toHaveLength(2);
    expect(wb.SheetNames).toContain('Triggers');
    expect(wb.SheetNames).toContain('SLAs');
  });

  test('fetchWithUsageFallback degrades gracefully when usage URL fails', async () => {
    // When the primary usage URL fails (e.g. 403 or 400 on plan restriction), fallback URL succeeds
    const items = await fetchWithUsageFallback<any>(
      '/api/v2/unsupported_usage_endpoint.json?include=usage_1h',
      '/api/v2/triggers.json?page[size]=100',
      'triggers'
    );
    expect(items.length).toBeGreaterThan(0);
  });
});
