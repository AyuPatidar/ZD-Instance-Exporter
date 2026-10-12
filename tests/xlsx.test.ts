import { describe, test, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  buildWorksheet,
  generateExportFilename,
  generateIndividualExportFilename,
  buildTriggersAuditWorkbook,
  buildMacrosAuditWorkbook,
  buildStandardTabAuditWorkbook,
} from '../src/services/export/xlsxExporter';

describe('XLSX Exporter', () => {
  test('preserves native numbers and booleans as actual cell types', () => {
    const rows = [
      {
        ID: 101,
        Title: 'VIP Escalation Rule',
        Active: true,
        Position: 1,
        'Created At': '2026-09-18 13:30:42 UTC',
      },
      {
        ID: 102,
        Title: 'Disabled Rule',
        Active: false,
        Position: 2,
        'Created At': '2026-09-18 14:00:00 UTC',
      },
    ];

    const ws = buildWorksheet(rows);

    // Header row is R=0. Row 1 is R=1, Row 2 is R=2.
    // ID is Col A (C=0)
    const cellId1 = ws['A2'];
    expect(cellId1.t).toBe('n'); // number type
    expect(cellId1.v).toBe(101);

    // Active is Col C (C=2)
    const cellActive1 = ws['C2'];
    expect(cellActive1.t).toBe('b'); // boolean type
    expect(cellActive1.v).toBe(true);

    const cellActive2 = ws['C3'];
    expect(cellActive2.t).toBe('b');
    expect(cellActive2.v).toBe(false);

    // Position is Col D (C=3)
    const cellPos1 = ws['D2'];
    expect(cellPos1.t).toBe('n');
    expect(cellPos1.v).toBe(1);
  });

  test('adds wrapText style to multiline cells', () => {
    const rows = [
      {
        ID: 101,
        Conditions: 'Status | Is | Open\nPriority | Is | High',
      },
    ];

    const ws = buildWorksheet(rows);
    const cell = ws['B2']; // Conditions
    expect(cell.v).toContain('\n');
    expect(cell.s?.alignment?.wrapText).toBe(true);
  });

  test('configures autofilter across data columns', () => {
    const rows = [
      { ID: 1, Name: 'Alpha' },
      { ID: 2, Name: 'Beta' },
    ];
    const ws = buildWorksheet(rows);
    expect(ws['!autofilter']).toBeDefined();
    expect(ws['!autofilter']?.ref).toBe('A1:B3');
  });

  test('calculates appropriate column widths based on cell content', () => {
    const rows = [
      { ID: 1, LongColumn: 'This is a significantly longer text string to test column auto sizing' },
    ];
    const ws = buildWorksheet(rows);
    expect(ws['!cols']).toBeDefined();
    expect(ws['!cols']!.length).toBe(2);
    expect(ws['!cols']![1].wch).toBeGreaterThan(20);
  });

  test('generates valid and sanitized filenames with timestamps', () => {
    const filename = generateExportFilename('test-subdomain');
    expect(filename.startsWith('zendesk-test-subdomain-configuration-export-')).toBe(true);
    expect(filename.endsWith('.xlsx')).toBe(true);
  });

  test('generates individual export filenames matching the example report format', () => {
    const fnWithSubdomain = generateIndividualExportFilename('Triggers', 'accesstrainingacademies');
    expect(fnWithSubdomain).toBe('Accesstrainingacademies Zendesk Triggers Audit Report.xlsx');

    const fnWithoutSubdomain = generateIndividualExportFilename('Macros');
    expect(fnWithoutSubdomain).toBe('Zendesk Macros Audit Report.xlsx');
  });

  test('builds Triggers Audit Workbook with all 7 sheets matching example structure', () => {
    const triggerItems = [
      {
        id: 5584848912799,
        raw: {},
        exportRow: {
          ID: 5584848912799,
          Title: 'Set tickets with no priority to normal',
          Active: true,
          'Category Name': 'Adjust Ticket at Creation',
          'Category Position': 1,
          Position: 1,
          'Usage (1h)': 62,
          'Usage (24h)': 288,
          'Usage (7d)': 2398,
          'Usage (30d)': 8703,
          'All Conditions': '1. Update Type | Is | Create\n2. Priority | Is | (empty)',
          'Any Conditions': '',
          Actions: '1. Priority → normal',
          URL: 'https://example.zendesk.com/rules/triggers/5584848912799',
          'Created At': '2026-03-31 09:14:56 UTC',
          'Updated At': '2026-06-29 07:26:11 UTC',
        },
      },
    ];

    const wb = buildTriggersAuditWorkbook(triggerItems as any, { triggers: 1, views: 5 });
    expect(wb.SheetNames).toEqual([
      'Audit',
      'Executive Dashboard',
      'Reviewer Workspace',
      'Trigger Summary',
      'Trigger Audit View',
      'Dashboard Data',
      'Triggers',
    ]);

    // Check Trigger Summary row
    const summaryWs = wb.Sheets['Trigger Summary'];
    const summaryData = XLSX.utils.sheet_to_json<any>(summaryWs);
    expect(summaryData.length).toBe(1);
    expect(summaryData[0]['Trigger ID']).toBe('5584848912799');
    expect(summaryData[0]['Status']).toBe('Active');
    expect(summaryData[0]['Usage Range (30d)']).toBe('>100');
    expect(summaryData[0]['All Conditions']).toBe(2);
    expect(summaryData[0]['Actions']).toBe(1);
    expect(summaryData[0]['Created Date']).toBe(46112);

    // Check Trigger Audit View rows (2 conditions + 1 action = 3 rows)
    const auditWs = wb.Sheets['Trigger Audit View'];
    const auditData = XLSX.utils.sheet_to_json<any>(auditWs);
    expect(auditData.length).toBe(3);
    expect(auditData[0]['Section']).toBe('All Conditions');
    expect(auditData[0]['Field']).toBe('Update Type');
    expect(auditData[0]['Operator']).toBe('Is');
    expect(auditData[0]['Value']).toBe('Create');
    expect(auditData[2]['Section']).toBe('Actions');
    expect(auditData[2]['Field']).toBe('Priority');
    expect(auditData[2]['Value']).toBe('normal');

    // Check Audit sheet (placed in cols K & L to accommodate the 3D bar chart)
    const auditSheet = wb.Sheets['Audit'];
    expect(auditSheet['K1']?.v).toBe('Business Rule ');
    expect(auditSheet['L1']?.v).toBe('Count');

    // Check AutoFilter configured on Triggers, Trigger Summary, and Trigger Audit View
    expect(summaryWs['!autofilter']).toBeDefined();
    expect(auditWs['!autofilter']).toBeDefined();
    expect(wb.Sheets['Triggers']['!autofilter']).toBeDefined();

    // Check Formulas configured on Trigger Summary and Trigger Audit View
    expect(summaryWs['A2']?.f).toBeDefined();
    expect(summaryWs['B2']?.f).toBeDefined();
    expect(summaryWs['C2']?.f).toBeDefined();
    expect(auditWs['A2']?.f).toBeDefined();
    expect(auditWs['B2']?.f).toBeDefined();

    // Check Reviewer Workspace has interactive formulas
    const rvwWs = wb.Sheets['Reviewer Workspace'];
    expect(rvwWs['B6']?.f).toBeDefined();
    expect(rvwWs['D6']?.f).toBeDefined();
    expect(rvwWs['A9']?.f).toBeDefined();
  });

  test('builds Macros Audit Workbook with 3 sheets matching example structure', () => {
    const macroItems = [
      {
        id: 5780566763295,
        raw: {},
        exportRow: {
          ID: 5780566763295,
          Name: 'Escalations :: Level 2 Support',
          Description: 'Escalate ticket to L2',
          Active: true,
          Default: false,
          Actions: '1. Ticket Form → General Support\n2. Group → Level 2 Queue',
          Restriction: 'Everyone',
          URL: 'https://example.zendesk.com/rules/macros/5780566763295',
          'Created At': '2026-05-22 05:42:41 UTC',
          'Updated At': '2026-07-01 14:57:49 UTC',
        },
      },
    ];

    const wb = buildMacrosAuditWorkbook(macroItems as any);
    expect(wb.SheetNames).toEqual(['Macro Summary', 'Macro Audit View', 'Macros']);

    // Check Macro Summary parsing
    const summaryData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Macro Summary']);
    expect(summaryData.length).toBe(1);
    expect(summaryData[0]['Category']).toBe('Escalations');
    expect(summaryData[0]['Sub-category']).toBe('Level 2 Support');
    expect(summaryData[0]['Actions']).toBe(2);
    expect(summaryData[0]['Has Description']).toBe('Yes');

    // Check Macro Audit View (2 actions = 2 rows)
    const auditData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Macro Audit View']);
    expect(auditData.length).toBe(2);
    expect(auditData[0]['Action Field']).toBe('Ticket Form');
    expect(auditData[0]['Value']).toBe('General Support');
    expect(auditData[1]['Action Field']).toBe('Group');
    // Check AutoFilter and formulas on Macro sheets
    const macroSummaryWs = wb.Sheets['Macro Summary'];
    const macroAuditWs = wb.Sheets['Macro Audit View'];
    const macrosWs = wb.Sheets['Macros'];
    expect(macroSummaryWs['!autofilter']).toBeDefined();
    expect(macroAuditWs['!autofilter']).toBeDefined();
    expect(macrosWs['!autofilter']).toBeDefined();

    expect(macroSummaryWs['A2']?.f).toBeDefined();
    expect(macroSummaryWs['B2']?.f).toBeDefined();
    expect(macroSummaryWs['C2']?.f).toBeDefined();
    expect(macroAuditWs['A2']?.f).toBeDefined();
    expect(macroAuditWs['B2']?.f).toBeDefined();
  });

  test('builds standard single-sheet audit workbook for other tabs with autofilter', () => {
    const wb = buildStandardTabAuditWorkbook('Automations', [
      { ID: 1, Title: 'Close Solved Tickets', Active: true },
    ]);
    expect(wb.SheetNames).toEqual(['Automations']);
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets['Automations']);
    expect(data.length).toBe(1);
    expect(data[0].Title).toBe('Close Solved Tickets');
    expect(wb.Sheets['Automations']['!autofilter']).toBeDefined();
  });

  test('injects chart into workbook with Audit sheet', async () => {
    const { injectChartIntoWorkbook } = await import('../src/services/export/chartInjector');
    const JSZip = (await import('jszip')).default;

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {
      K1: { t: 's', v: 'Business Rule ' },
      L1: { t: 's', v: 'Count' },
      K2: { t: 's', v: 'Triggers' },
      L2: { t: 'n', v: 42 },
      '!ref': 'A1:L2',
    };
    XLSX.utils.book_append_sheet(wb, ws, 'Audit');
    const rawBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const enriched = await injectChartIntoWorkbook(rawBuffer, 1, 42);
    expect(enriched).toBeDefined();

    const zip = await JSZip.loadAsync(enriched);
    expect(zip.file('xl/charts/chart1.xml')).toBeDefined();
    expect(zip.file('xl/drawings/drawing1.xml')).toBeDefined();
    expect(zip.file('xl/drawings/_rels/drawing1.xml.rels')).toBeDefined();
    expect(zip.file('xl/worksheets/_rels/sheet1.xml.rels')).toBeDefined();

    const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
    expect(sheet1Xml).toContain('<drawing r:id="rId1"/>');
  });
});
