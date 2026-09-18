import { describe, test, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildWorksheet, generateExportFilename } from '../src/services/export/xlsxExporter';

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
});
