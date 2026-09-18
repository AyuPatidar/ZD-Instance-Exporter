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
import { buildWorkbook, TabExportData } from '../src/services/export/xlsxExporter';

describe('Zendesk Configuration Services (All 13 Resources)', () => {
  test('retrieves and transforms Triggers preserving raw and formatted rows', async () => {
    const items = await getTriggers();
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect(first.raw.id).toBeDefined();
    expect(first.exportRow.ID).toBe(first.raw.id);
    expect(typeof first.exportRow.Active).toBe('boolean');
    expect(typeof first.exportRow.Position).toBe('number');
    expect(first.exportRow['All Conditions']).toBeDefined();
    expect(first.exportRow.Actions).toBeDefined();
  });

  test('retrieves and transforms Automations', async () => {
    const items = await getAutomations();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Title).toBeDefined();
    expect(typeof items[0].exportRow.Position).toBe('number');
  });

  test('retrieves and transforms Views with execution columns resolved', async () => {
    const items = await getViews();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Columns).toBeDefined();
    expect(items[0].exportRow['Group By']).toBeDefined();
  });

  test('retrieves and transforms Organizations resolving domain names and custom fields', async () => {
    const items = await getOrganizations();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Domain Names']).toBeDefined();
  });

  test('retrieves and transforms Agents filtering for team members', async () => {
    const items = await getAgents();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Email).toBeDefined();
    expect(['admin', 'agent']).toContain(items[0].exportRow.Role);
  });

  test('retrieves and transforms Groups', async () => {
    const items = await getGroups();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Name).toBeDefined();
  });

  test('retrieves and transforms Macros', async () => {
    const items = await getMacros();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Actions).toBeDefined();
  });

  test('retrieves and transforms Custom Ticket Fields with options formatting', async () => {
    const items = await getCustomFields();
    expect(items.length).toBeGreaterThan(0);
    const taggerField = items.find(f => f.raw.type === 'tagger');
    expect(taggerField).toBeDefined();
    expect(taggerField!.exportRow['Custom Field Options']).toContain('→');
  });

  test('retrieves and transforms Business Hours into weekday interval schedules', async () => {
    const items = await getBusinessHours();
    expect(items.length).toBeGreaterThan(0);
    const schedule = items[0].exportRow;
    expect(schedule['Time Zone']).toBeDefined();
    expect(schedule.Monday).toContain(':');
  });

  test('retrieves and transforms Support Addresses', async () => {
    const items = await getSupportAddresses();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Email).toBeDefined();
  });

  test('retrieves and transforms Ticket Forms resolving ticket field IDs', async () => {
    const items = await getForms();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Ticket Field IDs']).toBeDefined();
  });

  test('retrieves and transforms SLA Policies formatting metrics', async () => {
    const items = await getSLAs();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow.Metrics).toContain('Priority:');
  });

  test('retrieves and transforms Group SLA Policies', async () => {
    const items = await getGroupSLAs();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].exportRow['Policy Metrics']).toContain('Priority:');
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

  test('loads custom roles into lookup cache supporting both number and string keys', async () => {
    invalidateLookupCache();
    const lookups = await getZendeskLookups();
    expect(lookups.customRoles.get(25176440012818)).toBe('Tier 2 Specialist');
    expect(lookups.customRoles.get('25176440012818')).toBe('Tier 2 Specialist');
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
});
