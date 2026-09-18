import * as XLSX from 'xlsx';
import { ConfigTabKey } from '../../types/resources';

export interface TabExportData {
  tabKey: ConfigTabKey;
  sheetName: string;
  data: Record<string, any>[];
}

export function generateExportFilename(subdomain?: string): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = now.getUTCFullYear();
  const MM = pad(now.getUTCMonth() + 1);
  const dd = pad(now.getUTCDate());
  const HH = pad(now.getUTCHours());
  const mm = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());

  const prefix = subdomain ? `zendesk-${subdomain.replace(/[^a-zA-Z0-9_-]/g, '')}` : 'zendesk';
  return `${prefix}-configuration-export-${yyyy}-${MM}-${dd}-${HH}${mm}${ss}.xlsx`;
}

export function buildWorksheet(rows: Record<string, any>[]): XLSX.WorkSheet {
  if (!rows || rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([['No records found']]);
  }

  // Create worksheet from JSON with preservation of raw types
  const ws = XLSX.utils.json_to_sheet(rows, {
    cellDates: true,
  });

  // Calculate column widths and enable wrapText on multiline cells
  const colWidths: { wch: number }[] = [];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 10;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell || cell.v === undefined || cell.v === null) continue;

      // Check for multiline string or long content
      const strVal = String(cell.v);
      const lines = strVal.split('\n');
      for (const line of lines) {
        if (line.length > maxLen) {
          maxLen = line.length;
        }
      }

      // Add wrapText style attribute if cell has newline
      if (lines.length > 1) {
        cell.s = cell.s || {};
        cell.s.alignment = { wrapText: true, vertical: 'top' };
      }
    }

    colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 12), 65) });
  }

  ws['!cols'] = colWidths;

  // Add auto-filter across all columns
  ws['!autofilter'] = { ref: ws['!ref'] || 'A1:A1' };

  return ws;
}

export function exportSingleTabToXLSX(
  sheetName: string,
  rows: Record<string, any>[],
  subdomain?: string
): void {
  const wb = XLSX.utils.book_new();
  const ws = buildWorksheet(rows);
  // Sheet name cannot exceed 31 chars in Excel
  const safeSheetName = sheetName.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const filename = generateExportFilename(subdomain);
  XLSX.writeFile(wb, filename);
}

export function buildWorkbook(tabDatasets: TabExportData[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  for (const item of tabDatasets) {
    if (item.data && item.data.length > 0) {
      const ws = buildWorksheet(item.data);
      const safeSheetName = item.sheetName.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    } else {
      // Empty sheet placeholder
      const ws = XLSX.utils.aoa_to_sheet([['No records found or permission denied']]);
      const safeSheetName = item.sheetName.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }
  }

  return wb;
}

export function exportMultipleTabsToXLSX(
  tabDatasets: TabExportData[],
  subdomain?: string
): void {
  const wb = buildWorkbook(tabDatasets);
  const filename = generateExportFilename(subdomain);
  XLSX.writeFile(wb, filename);
}
