import * as XLSX from 'xlsx';
import { ConfigTabKey, TabConfig, ResourceItem } from '../../types/resources';
import { buildWorksheet } from './xlsxExporter';
import { injectChartIntoWorkbook, triggerFileDownload } from './chartInjector';

/**
 * Format subdomain to Title Case for filename, matching example:
 * 'accesstrainingacademies' -> 'Accesstrainingacademies'
 */
export function formatSubdomainForFilename(subdomain?: string): string {
  if (!subdomain || !subdomain.trim()) return '';
  const clean = subdomain.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Generates filename for individual tab export:
 * e.g. "Accesstrainingacademies Zendesk Triggers Audit Report.xlsx"
 * or "Zendesk Triggers Audit Report.xlsx" if subdomain is not available.
 */
export function generateIndividualExportFilename(tabLabel: string, subdomain?: string): string {
  const formattedSubdomain = formatSubdomainForFilename(subdomain);
  const prefix = formattedSubdomain ? `${formattedSubdomain} Zendesk ` : 'Zendesk ';
  return `${prefix}${tabLabel} Audit Report.xlsx`;
}

/**
 * Converts a date string (e.g. "2026-03-31 09:14:56 UTC" or ISO format)
 * to an Excel serial date number (days since 1899-12-30).
 */
export function toExcelDate(dateStr?: string): number | string {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const dateUtc = Date.UTC(y, m, d);
    const epochUtc = Date.UTC(1899, 11, 30);
    return Math.round((dateUtc - epochUtc) / 86400000);
  }
  return '';
}

/**
 * Calculates usage range bucket matching the example audit file:
 * 0, 1-10, 11-50, 51-100, >100
 */
export function getUsageRange(val: number): string {
  if (val <= 0 || isNaN(val)) return '0';
  if (val <= 10) return '1-10';
  if (val <= 50) return '11-50';
  if (val <= 100) return '51-100';
  return '>100';
}

interface ParsedRuleLine {
  seq: number;
  section: 'All Conditions' | 'Any Conditions' | 'Actions';
  raw: string;
  field: string;
  operator: string;
  value: string;
}

/**
 * Parses multiline conditions or actions into individual structured items.
 */
function parseRuleLines(
  str: any,
  section: 'All Conditions' | 'Any Conditions' | 'Actions'
): ParsedRuleLine[] {
  if (!str) return [];
  const lines = String(str)
    .split('\n')
    .filter(l => l.trim().length > 0);

  return lines.map((line, idx) => {
    const clean = line.replace(/^\d+\.\s*/, '').trim();
    let field = '';
    let operator = '';
    let value = '';

    if (section === 'Actions') {
      const parts = clean.split(' → ');
      field = parts[0]?.trim() || '';
      value = parts.slice(1).join(' → ').trim();
    } else {
      const parts = clean.split(' | ');
      field = parts[0]?.trim() || '';
      operator = parts[1]?.trim() || '';
      value = parts.slice(2).join(' | ').trim();
    }

    return {
      seq: idx + 1,
      section,
      raw: clean,
      field,
      operator,
      value,
    };
  });
}

/**
 * Builds the 'Audit' sheet containing Business Rule counts placed in columns K & L
 * exactly as structured in the example audit report workbook.
 */
export function buildAuditSheet(
  tabCounts?: Record<string, number | undefined>,
  fallbackItemCount: number = 0,
  fallbackItemLabel: string = 'Triggers'
): { ws: XLSX.WorkSheet; ruleCount: number; maxCount: number } {
  const ws: XLSX.WorkSheet = {};
  ws['K1'] = { t: 's', v: 'Business Rule ' };
  ws['L1'] = { t: 's', v: 'Count' };

  const orderedRules: [string, number][] = [];

  if (tabCounts && Object.keys(tabCounts).length > 0) {
    const canonicalOrder = [
      { key: 'views', label: 'Views' },
      { key: 'custom_fields', label: 'Custom Fields' },
      { key: 'macros', label: 'Macros' },
      { key: 'agents', label: 'Agents' },
      { key: 'groups', label: 'Groups' },
      { key: 'triggers', label: 'Triggers' },
      { key: 'support_addresses', label: 'Support Addresses' },
      { key: 'slas', label: 'SLAs' },
      { key: 'forms', label: 'Forms' },
      { key: 'automations', label: 'Automations' },
      { key: 'organizations', label: 'Organizations' },
      { key: 'business_hours', label: 'Business Hours' },
      { key: 'group_slas', label: 'Group SLAs' },
    ];

    canonicalOrder.forEach(({ key, label }) => {
      const count = tabCounts[key] ?? 0;
      orderedRules.push([label, count]);
    });
  } else {
    orderedRules.push([fallbackItemLabel, fallbackItemCount]);
  }

  let maxCount = 0;
  orderedRules.forEach(([label, count], idx) => {
    const r = idx + 2;
    ws[`K${r}`] = { t: 's', v: label };
    ws[`L${r}`] = { t: 'n', v: count };
    if (count > maxCount) maxCount = count;
  });

  const lastRow = orderedRules.length + 1;
  ws['!ref'] = `A1:L${Math.max(lastRow, 14)}`;
  ws['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 12 },
  ];

  return { ws, ruleCount: orderedRules.length, maxCount };
}

/**
 * -------------------------------------------------------------
 * TRIGGERS AUDIT WORKBOOK BUILDER
 * Generates:
 * 1. Audit (with 3D Bar Chart)
 * 2. Executive Dashboard
 * 3. Reviewer Workspace (interactive filter formulas)
 * 4. Trigger Summary (formulas & AutoFilter)
 * 5. Trigger Audit View (formulas & AutoFilter)
 * 6. Dashboard Data (KPI & distribution formulas)
 * 7. Triggers (data table with AutoFilter)
 * -------------------------------------------------------------
 */
export function buildTriggersAuditWorkbook(
  items: ResourceItem[],
  tabCounts?: Record<string, number | undefined>
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Audit Sheet
  const { ws: auditWs } = buildAuditSheet(tabCounts, items.length, 'Triggers');

  // 2. Executive Dashboard Sheet
  const execWs: XLSX.WorkSheet = {};
  execWs['B2'] = { t: 's', v: 'ZENDESK TRIGGERS AUDIT — EXECUTIVE DASHBOARD' };
  execWs['B6'] = { t: 's', v: 'TRIGGER KPIs' };
  execWs['!ref'] = 'A1:U6';
  execWs['!cols'] = [{ wch: 3 }, { wch: 45 }];

  // 3. Triggers Raw Sheet (16 canonical columns matching the audit template)
  const triggerExportRows = items.map(it => it.exportRow as Record<string, any>);
  const canonicalTriggerRows = triggerExportRows.map(r => ({
    ID: r.ID ?? '',
    Title: r.Title ?? '',
    Active: Boolean(r.Active),
    'Category Name': r['Category Name'] ?? '',
    'Category Position': r['Category Position'] ?? '',
    Position: r.Position ?? '',
    'Usage (1h)': r['Usage (1h)'] ?? '',
    'Usage (24h)': r['Usage (24h)'] ?? '',
    'Usage (7d)': r['Usage (7d)'] ?? '',
    'Usage (30d)': r['Usage (30d)'] ?? '',
    'All Conditions': r['All Conditions'] ?? '',
    'Any Conditions': r['Any Conditions'] ?? '',
    Actions: r.Actions ?? '',
    URL: r.URL ?? '',
    'Created At': r['Created At'] ?? '',
    'Updated At': r['Updated At'] ?? '',
  }));

  const triggersWs = buildWorksheet(canonicalTriggerRows);
  const totalTriggers = canonicalTriggerRows.length;
  triggersWs['!autofilter'] = { ref: `A1:P${Math.max(totalTriggers + 1, 2)}` };

  // Pre-calculate ranks & metrics for initial cell values
  const usages30d = canonicalTriggerRows.map(r => {
    const val = r['Usage (30d)'];
    return typeof val === 'number' ? val : parseInt(String(val), 10) || 0;
  });

  // 4. Trigger Summary Sheet with Excel formulas
  const summaryWs: XLSX.WorkSheet = {};
  const summaryHeaders = [
    'Trigger ID', 'Title', 'Status', 'Category Name', 'Category Position', 'Position',
    'Usage 7d', 'Usage 30d', 'Usage Range (30d)', 'Usage Rank (30d)',
    'All Conditions', 'Any Conditions', 'Actions', 'Created Date', 'Updated Date', 'URL', 'Usage Range (7d)'
  ];
  const summaryCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  summaryHeaders.forEach((h, idx) => {
    summaryWs[`${summaryCols[idx]}1`] = { t: 's', v: h };
  });

  canonicalTriggerRows.forEach((row, idx) => {
    const r = idx + 2; // Excel row in Triggers and Trigger Summary
    const u7 = typeof row['Usage (7d)'] === 'number' ? row['Usage (7d)'] : parseInt(String(row['Usage (7d)']), 10) || 0;
    const u30 = usages30d[idx];

    let rank = 1;
    for (let j = 0; j < usages30d.length; j++) {
      if (usages30d[j] > u30 || (usages30d[j] === u30 && j < idx)) {
        rank++;
      }
    }

    const allCondCount = row['All Conditions']
      ? String(row['All Conditions']).split('\n').filter(l => l.trim().length > 0).length
      : 0;
    const anyCondCount = row['Any Conditions']
      ? String(row['Any Conditions']).split('\n').filter(l => l.trim().length > 0).length
      : 0;
    const actionsCount = row.Actions
      ? String(row.Actions).split('\n').filter(l => l.trim().length > 0).length
      : 0;

    summaryWs[`A${r}`] = { t: 's', f: `IF(Triggers!$A${r}="","",TEXT(Triggers!$A${r},"0"))`, v: String(row.ID ?? '') };
    summaryWs[`B${r}`] = { t: 's', f: `Triggers!$B${r}&""`, v: row.Title ?? '' };
    summaryWs[`C${r}`] = { t: 's', f: `IF(A${r}="","",IF(OR(Triggers!$C${r}=TRUE,UPPER(Triggers!$C${r}&"")="TRUE"),"Active","Inactive"))`, v: row.Active ? 'Active' : 'Inactive' };
    summaryWs[`D${r}`] = { t: 's', f: `Triggers!$D${r}&""`, v: row['Category Name'] ?? '' };
    summaryWs[`E${r}`] = { t: 'n', f: `Triggers!$E${r}`, v: row['Category Position'] ?? 0 };
    summaryWs[`F${r}`] = { t: 'n', f: `Triggers!$F${r}`, v: row.Position ?? 0 };
    summaryWs[`G${r}`] = { t: 'n', f: `N(Triggers!$I${r})`, v: u7 };
    summaryWs[`H${r}`] = { t: 'n', f: `N(Triggers!$J${r})`, v: u30 };
    summaryWs[`I${r}`] = { t: 's', f: `IF(H${r}="","",IF(H${r}=0,"0",IF(H${r}<=10,"1-10",IF(H${r}<=50,"11-50",IF(H${r}<=100,"51-100",">100")))))`, v: getUsageRange(u30) };
    summaryWs[`J${r}`] = { t: 'n', f: `RANK(H${r},$H$2:$H$${totalTriggers + 1})+COUNTIF($H$2:H${r},H${r})-1`, v: rank };
    summaryWs[`K${r}`] = { t: 'n', f: `IF(Triggers!$K${r}="",0,SUMPRODUCT(--ISNUMBER(FIND(CHAR(10)&ROW($1:$40)&". ",CHAR(10)&Triggers!$K${r}))))`, v: allCondCount };
    summaryWs[`L${r}`] = { t: 'n', f: `IF(Triggers!$L${r}="",0,SUMPRODUCT(--ISNUMBER(FIND(CHAR(10)&ROW($1:$40)&". ",CHAR(10)&Triggers!$L${r}))))`, v: anyCondCount };
    summaryWs[`M${r}`] = { t: 'n', f: `IF(Triggers!$M${r}="",0,SUMPRODUCT(--ISNUMBER(FIND(CHAR(10)&ROW($1:$40)&". ",CHAR(10)&Triggers!$M${r}))))`, v: actionsCount };
    summaryWs[`N${r}`] = { t: 'n', f: `IFERROR(DATE(VALUE(LEFT(Triggers!$O${r},4)),VALUE(MID(Triggers!$O${r},6,2)),VALUE(MID(Triggers!$O${r},9,2))),"")`, v: toExcelDate(row['Created At']) };
    summaryWs[`O${r}`] = { t: 'n', f: `IFERROR(DATE(VALUE(LEFT(Triggers!$P${r},4)),VALUE(MID(Triggers!$P${r},6,2)),VALUE(MID(Triggers!$P${r},9,2))),"")`, v: toExcelDate(row['Updated At']) };
    summaryWs[`P${r}`] = { t: 's', f: `Triggers!$N${r}&""`, v: row.URL ?? '' };
    summaryWs[`Q${r}`] = { t: 's', f: `IF(G${r}="","",IF(G${r}=0,"0",IF(G${r}<=10,"1-10",IF(G${r}<=50,"11-50",IF(G${r}<=100,"51-100",">100")))))`, v: getUsageRange(u7) };
  });

  const lastSummaryRow = Math.max(totalTriggers + 1, 2);
  summaryWs['!ref'] = `A1:Q${lastSummaryRow}`;
  summaryWs['!autofilter'] = { ref: `A1:Q${lastSummaryRow}` };
  summaryWs['!cols'] = [
    { wch: 16 }, { wch: 45 }, { wch: 10 }, { wch: 28 }, { wch: 18 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 45 }, { wch: 18 }
  ];

  // 5. Trigger Audit View Sheet with Excel formulas
  const auditViewWs: XLSX.WorkSheet = {};
  const auditViewHeaders = [
    'Trigger ID', 'Title', 'Status', 'Category Name', 'Category Position', 'Position',
    'Usage 7d', 'Usage 30d', 'URL', 'Created At', 'Updated At',
    'Section', 'Seq', 'Condition / Action', 'Field', 'Operator', 'Value', 'Source Row'
  ];
  const auditViewCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
  auditViewHeaders.forEach((h, idx) => {
    auditViewWs[`${auditViewCols[idx]}1`] = { t: 's', v: h };
  });

  interface AuditViewRowRecord {
    sourceRow: number;
    isFirst: boolean;
    triggerId: string;
    title: string;
    status: string;
    category: string;
    catPos: number | string;
    pos: number | string;
    u7: number;
    u30: number;
    url: string;
    createdAt: string;
    updatedAt: string;
    section: string;
    seq: number;
    raw: string;
    field: string;
    operator: string;
    value: string;
  }

  const auditViewList: AuditViewRowRecord[] = [];
  canonicalTriggerRows.forEach((row, idx) => {
    const sourceRow = idx + 2;
    const u7 = typeof row['Usage (7d)'] === 'number' ? row['Usage (7d)'] : parseInt(String(row['Usage (7d)']), 10) || 0;
    const u30 = typeof row['Usage (30d)'] === 'number' ? row['Usage (30d)'] : parseInt(String(row['Usage (30d)']), 10) || 0;

    const allConds = parseRuleLines(row['All Conditions'], 'All Conditions');
    const anyConds = parseRuleLines(row['Any Conditions'], 'Any Conditions');
    const actions = parseRuleLines(row.Actions, 'Actions');

    const combined = [...allConds, ...anyConds, ...actions];
    if (combined.length === 0) {
      combined.push({
        seq: 1,
        section: 'All Conditions',
        raw: '',
        field: '',
        operator: '',
        value: '',
      });
    }

    combined.forEach((item, itemIdx) => {
      auditViewList.push({
        sourceRow,
        isFirst: itemIdx === 0,
        triggerId: String(row.ID ?? ''),
        title: row.Title ?? '',
        status: row.Active ? 'Active' : 'Inactive',
        category: row['Category Name'] ?? '',
        catPos: row['Category Position'] ?? '',
        pos: row.Position ?? '',
        u7,
        u30,
        url: row.URL ?? '',
        createdAt: row['Created At'] ?? '',
        updatedAt: row['Updated At'] ?? '',
        section: item.section,
        seq: item.seq,
        raw: item.raw,
        field: item.field,
        operator: item.operator,
        value: item.value,
      });
    });
  });

  auditViewList.forEach((item, idx) => {
    const r = idx + 2;
    const sRow = item.sourceRow;

    if (item.isFirst) {
      auditViewWs[`A${r}`] = { t: 's', f: `'Trigger Summary'!$A$${sRow}`, v: item.triggerId };
      auditViewWs[`B${r}`] = { t: 's', f: `Triggers!$B$${sRow}&""`, v: item.title };
      auditViewWs[`C${r}`] = { t: 's', f: `'Trigger Summary'!$C$${sRow}`, v: item.status };
      auditViewWs[`D${r}`] = { t: 's', f: `Triggers!$D$${sRow}&""`, v: item.category };
      auditViewWs[`E${r}`] = { t: 'n', f: `Triggers!$E${sRow}`, v: Number(item.catPos) || 0 };
      auditViewWs[`F${r}`] = { t: 'n', f: `Triggers!$F${sRow}`, v: Number(item.pos) || 0 };
      auditViewWs[`G${r}`] = { t: 'n', f: `'Trigger Summary'!$G$${sRow}`, v: item.u7 };
      auditViewWs[`H${r}`] = { t: 'n', f: `'Trigger Summary'!$H$${sRow}`, v: item.u30 };
      auditViewWs[`I${r}`] = { t: 's', f: `Triggers!$N$${sRow}&""`, v: item.url };
      auditViewWs[`J${r}`] = { t: 's', f: `Triggers!$O$${sRow}&""`, v: item.createdAt };
      auditViewWs[`K${r}`] = { t: 's', f: `Triggers!$P$${sRow}&""`, v: item.updatedAt };
    }

    auditViewWs[`L${r}`] = { t: 's', v: item.section };
    auditViewWs[`M${r}`] = { t: 'n', v: item.seq };
    auditViewWs[`N${r}`] = { t: 's', v: item.raw };
    auditViewWs[`O${r}`] = { t: 's', v: item.field };
    auditViewWs[`P${r}`] = { t: 's', v: item.operator };
    auditViewWs[`Q${r}`] = { t: 's', v: item.value };
    auditViewWs[`R${r}`] = { t: 'n', v: sRow };
  });

  const totalAuditRows = auditViewList.length;
  const lastAuditViewRow = Math.max(totalAuditRows + 1, 2);
  auditViewWs['!ref'] = `A1:R${lastAuditViewRow}`;
  auditViewWs['!autofilter'] = { ref: `A1:R${lastAuditViewRow}` };
  auditViewWs['!cols'] = [
    { wch: 16 }, { wch: 45 }, { wch: 10 }, { wch: 28 }, { wch: 18 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 24 }, { wch: 24 },
    { wch: 16 }, { wch: 6 }, { wch: 45 }, { wch: 22 }, { wch: 14 }, { wch: 30 }, { wch: 12 }
  ];

  // 6. Reviewer Workspace with interactive filtering formulas
  const reviewerWs: XLSX.WorkSheet = {};
  reviewerWs['A1'] = { t: 's', v: 'TRIGGER REVIEWER WORKSPACE' };

  // Filter criteria header (Row 3)
  const filterHeaders = [
    'Trigger ID', 'Title', 'Status ▾', 'Category ▾',
    'Usage Range (7d) ▾', 'Usage Range (30d) ▾',
    'Section ▾', 'Field ▾', 'Operator ▾', 'Value'
  ];
  filterHeaders.forEach((h, idx) => {
    reviewerWs[`${String.fromCharCode(65 + idx)}3`] = { t: 's', v: h };
  });

  // KPI Row (Row 6)
  reviewerWs['A6'] = { t: 's', v: 'Matching Triggers' };
  reviewerWs['B6'] = { t: 'n', f: `SUM($X$2:$X$${totalTriggers + 1})`, v: totalTriggers };
  reviewerWs['C6'] = { t: 's', v: 'Rows Shown' };
  reviewerWs['D6'] = { t: 'n', f: `MAX($AG$2:$AG$${totalAuditRows + 1})`, v: totalAuditRows };

  // Table Headers (Row 8)
  const rvwHeaders = [
    'Trigger ID', 'Title', 'Status', 'Category Name', 'Usage 7d', 'Usage 30d',
    'Section', 'Field', 'Operator', 'Value', 'Seq', 'Category Position', 'Position',
    'URL', 'Created At', 'Updated At'
  ];
  rvwHeaders.forEach((h, idx) => {
    reviewerWs[`${String.fromCharCode(65 + idx)}8`] = { t: 's', v: h };
  });
  reviewerWs['R8'] = { t: 's', v: 'Row' };

  // Helper filter logic (Cols U..AG)
  reviewerWs['U2'] = { t: 'b', f: 'OR($G$4<>"",$H$4<>"",$I$4<>"",$J$4<>"")', v: false };

  for (let trIdx = 0; trIdx < totalTriggers; trIdx++) {
    const trRow = trIdx + 2;
    reviewerWs[`V${trRow}`] = {
      t: 'b',
      f: `AND('Trigger Summary'!$A$${trRow}<>"",OR($A$4="",ISNUMBER(FIND(TRIM($A$4),'Trigger Summary'!$A$${trRow}))),OR($B$4="",ISNUMBER(FIND(LOWER(TRIM($B$4)),LOWER('Trigger Summary'!$B$${trRow})))),OR($C$4="",'Trigger Summary'!$C$${trRow}=$C$4),OR($D$4="",'Trigger Summary'!$D$${trRow}=$D$4),OR($F$4="",'Trigger Summary'!$I$${trRow}=$F$4),OR($E$4="",'Trigger Summary'!$Q$${trRow}=$E$4))`,
      v: true
    };
    reviewerWs[`W${trRow}`] = {
      t: 'n',
      f: `COUNTIFS($Z$2:$Z$${totalAuditRows + 1},ROW(),$AE$2:$AE$${totalAuditRows + 1},1)`,
      v: 1
    };
    reviewerWs[`X${trRow}`] = {
      t: 'n',
      f: `IF(AND(V${trRow},OR(NOT($U$2),W${trRow}>0)),1,0)`,
      v: 1
    };
  }

  for (let audIdx = 0; audIdx < totalAuditRows; audIdx++) {
    const audRow = audIdx + 2;
    const sRow = auditViewList[audIdx].sourceRow;

    reviewerWs[`Z${audRow}`] = { t: 'n', f: `'Trigger Audit View'!$R$${audRow}`, v: sRow };
    reviewerWs[`AA${audRow}`] = { t: 'b', f: `OR($G$4="",'Trigger Audit View'!$L$${audRow}=$G$4)`, v: true };
    reviewerWs[`AB${audRow}`] = { t: 'b', f: `OR($H$4="",'Trigger Audit View'!$O$${audRow}=$H$4)`, v: true };
    reviewerWs[`AC${audRow}`] = { t: 'b', f: `OR($I$4="",'Trigger Audit View'!$P$${audRow}=$I$4)`, v: true };
    reviewerWs[`AD${audRow}`] = { t: 'b', f: `OR($J$4="",ISNUMBER(FIND(LOWER(TRIM($J$4)),LOWER('Trigger Audit View'!$Q$${audRow}))))`, v: true };
    reviewerWs[`AE${audRow}`] = { t: 'n', f: `IF(AND(AA${audRow},AB${audRow},AC${audRow},AD${audRow}),1,0)`, v: 1 };
    reviewerWs[`AF${audRow}`] = { t: 'n', f: `INDEX($X$1:$X$${totalTriggers + 1},Z${audRow})`, v: 1 };
    reviewerWs[`AG${audRow}`] = { t: 'n', f: audRow === 2 ? 'AF2' : `AG${audRow - 1}+AF${audRow}`, v: audIdx + 1 };
  }

  // Display Table Rows (Rows 9+)
  for (let k = 1; k <= totalAuditRows; k++) {
    const r = k + 8;
    const item = auditViewList[k - 1];

    reviewerWs[`R${r}`] = { t: 'n', f: `IFERROR(MATCH(${k},$AG$2:$AG$${totalAuditRows + 1},0),"")`, v: k };
    reviewerWs[`A${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$A$2:$A$${totalAuditRows + 1},$R${r})&"")`, v: item.triggerId };
    reviewerWs[`B${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$B$2:$B$${totalAuditRows + 1},$R${r})&"")`, v: item.title };
    reviewerWs[`C${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$C$2:$C$${totalAuditRows + 1},$R${r})&"")`, v: item.status };
    reviewerWs[`D${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$D$2:$D$${totalAuditRows + 1},$R${r})&"")`, v: item.category };
    reviewerWs[`E${r}`] = { t: 'n', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$G$2:$G$${totalAuditRows + 1},$R${r})&"")`, v: item.u7 };
    reviewerWs[`F${r}`] = { t: 'n', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$H$2:$H$${totalAuditRows + 1},$R${r})&"")`, v: item.u30 };
    reviewerWs[`G${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$L$2:$L$${totalAuditRows + 1},$R${r})&"")`, v: item.section };
    reviewerWs[`H${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$O$2:$O$${totalAuditRows + 1},$R${r})&"")`, v: item.field };
    reviewerWs[`I${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$P$2:$P$${totalAuditRows + 1},$R${r})&"")`, v: item.operator };
    reviewerWs[`J${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$Q$2:$Q$${totalAuditRows + 1},$R${r})&"")`, v: item.value };
    reviewerWs[`K${r}`] = { t: 'n', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$M$2:$M$${totalAuditRows + 1},$R${r})&"")`, v: item.seq };
    reviewerWs[`L${r}`] = { t: 'n', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$E$2:$E$${totalAuditRows + 1},$R${r})&"")`, v: Number(item.catPos) || 0 };
    reviewerWs[`M${r}`] = { t: 'n', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$F$2:$F$${totalAuditRows + 1},$R${r})&"")`, v: Number(item.pos) || 0 };
    reviewerWs[`N${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$I$2:$I$${totalAuditRows + 1},$R${r})&"")`, v: item.url };
    reviewerWs[`O${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$J$2:$J$${totalAuditRows + 1},$R${r})&"")`, v: item.createdAt };
    reviewerWs[`P${r}`] = { t: 's', f: `IF($R${r}="","",INDEX('Trigger Audit View'!$K$2:$K$${totalAuditRows + 1},$R${r})&"")`, v: item.updatedAt };
  }

  const lastReviewerRow = Math.max(totalAuditRows + 8, 9);
  reviewerWs['!ref'] = `A1:AG${lastReviewerRow}`;
  reviewerWs['!cols'] = [
    { wch: 16 }, { wch: 45 }, { wch: 10 }, { wch: 28 }, { wch: 12 }, { wch: 12 },
    { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 30 }, { wch: 6 }, { wch: 18 },
    { wch: 10 }, { wch: 45 }, { wch: 24 }, { wch: 24 }
  ];

  // 7. Dashboard Data Sheet with Excel formulas
  const dashWs: XLSX.WorkSheet = {};
  dashWs['B1'] = { t: 's', v: 'DASHBOARD DATA — TRIGGERS' };
  dashWs['B3'] = { t: 's', v: 'Trigger KPIs' };
  dashWs['G3'] = { t: 's', v: 'Category Distribution' };

  dashWs['B4'] = { t: 's', v: 'Metric' };
  dashWs['C4'] = { t: 's', v: 'Value' };
  dashWs['G4'] = { t: 's', v: 'Category' };
  dashWs['H4'] = { t: 's', v: 'Active' };
  dashWs['I4'] = { t: 's', v: 'Inactive' };
  dashWs['J4'] = { t: 's', v: 'Total' };
  dashWs['K4'] = { t: 's', v: 'Usage 7d' };
  dashWs['L4'] = { t: 's', v: 'Usage 30d' };
  dashWs['M4'] = { t: 's', v: '% of Triggers' };

  const trEnd = Math.max(totalTriggers + 1, 2);
  const activeCount = canonicalTriggerRows.filter(r => r.Active).length;
  const inactiveCount = totalTriggers - activeCount;

  dashWs['B5'] = { t: 's', v: 'Total Triggers' };
  dashWs['C5'] = { t: 'n', f: `COUNTIF('Trigger Summary'!$C$2:$C$${trEnd},"Active")+COUNTIF('Trigger Summary'!$C$2:$C$${trEnd},"Inactive")`, v: totalTriggers };
  dashWs['B6'] = { t: 's', v: 'Active Triggers' };
  dashWs['C6'] = { t: 'n', f: `COUNTIF('Trigger Summary'!$C$2:$C$${trEnd},"Active")`, v: activeCount };
  dashWs['B7'] = { t: 's', v: 'Inactive Triggers' };
  dashWs['C7'] = { t: 'n', f: `COUNTIF('Trigger Summary'!$C$2:$C$${trEnd},"Inactive")`, v: inactiveCount };

  // Distinct categories
  const catSet = new Set<string>();
  canonicalTriggerRows.forEach(r => {
    catSet.add(r['Category Name'] || '(No Category)');
  });
  const catList = Array.from(catSet);
  const catEnd = 4 + catList.length;

  dashWs['B8'] = { t: 's', v: 'Trigger Categories' };
  dashWs['C8'] = { t: 'n', f: `SUMPRODUCT(--(J5:J${catEnd}>0))`, v: catList.length };

  const totalU7 = usages30d.reduce((acc, _, idx) => {
    const u = Number(canonicalTriggerRows[idx]['Usage (7d)']) || 0;
    return acc + u;
  }, 0);
  const totalU30 = usages30d.reduce((acc, v) => acc + v, 0);
  const highUsageCount = usages30d.filter(v => v > 100).length;
  const unusedCount = usages30d.filter(v => v === 0).length;

  dashWs['B9'] = { t: 's', v: 'Total Usage 7d' };
  dashWs['C9'] = { t: 'n', f: `SUM('Trigger Summary'!$G$2:$G$${trEnd})`, v: totalU7 };
  dashWs['B10'] = { t: 's', v: 'Total Usage 30d' };
  dashWs['C10'] = { t: 'n', f: `SUM('Trigger Summary'!$H$2:$H$${trEnd})`, v: totalU30 };
  dashWs['B11'] = { t: 's', v: 'High Usage Triggers (>100 in 30d)' };
  dashWs['C11'] = { t: 'n', f: `COUNTIF('Trigger Summary'!$H$2:$H$${trEnd},">100")`, v: highUsageCount };
  dashWs['B12'] = { t: 's', v: 'Unused Triggers (0 in 30d)' };
  dashWs['C12'] = { t: 'n', f: `COUNTIF('Trigger Summary'!$H$2:$H$${trEnd},0)`, v: unusedCount };

  // Populate category distribution rows
  catList.forEach((cName, idx) => {
    const r = 5 + idx;
    dashWs[`G${r}`] = { t: 's', v: cName };
    dashWs[`H${r}`] = { t: 'n', f: `SUMPRODUCT(EXACT('Trigger Summary'!$D$2:$D$${trEnd},$G${r})*('Trigger Summary'!$C$2:$C$${trEnd}="Active"))`, v: 0 };
    dashWs[`I${r}`] = { t: 'n', f: `SUMPRODUCT(EXACT('Trigger Summary'!$D$2:$D$${trEnd},$G${r})*('Trigger Summary'!$C$2:$C$${trEnd}="Inactive"))`, v: 0 };
    dashWs[`J${r}`] = { t: 'n', f: `H${r}+I${r}`, v: 0 };
    dashWs[`K${r}`] = { t: 'n', f: `SUMPRODUCT(EXACT('Trigger Summary'!$D$2:$D$${trEnd},$G${r})*'Trigger Summary'!$G$2:$G$${trEnd})`, v: 0 };
    dashWs[`L${r}`] = { t: 'n', f: `SUMPRODUCT(EXACT('Trigger Summary'!$D$2:$D$${trEnd},$G${r})*'Trigger Summary'!$H$2:$H$${trEnd})`, v: 0 };
    dashWs[`M${r}`] = { t: 'n', f: `IF($C$5=0,0,J${r}/$C$5)`, v: 0 };
  });

  const catTotalRow = catEnd + 1;
  dashWs[`G${catTotalRow}`] = { t: 's', v: 'Total' };
  dashWs[`H${catTotalRow}`] = { t: 'n', f: `SUM(H5:H${catEnd})`, v: activeCount };
  dashWs[`I${catTotalRow}`] = { t: 'n', f: `SUM(I5:I${catEnd})`, v: inactiveCount };
  dashWs[`J${catTotalRow}`] = { t: 'n', f: `SUM(J5:J${catEnd})`, v: totalTriggers };
  dashWs[`K${catTotalRow}`] = { t: 'n', f: `SUM(K5:K${catEnd})`, v: totalU7 };
  dashWs[`L${catTotalRow}`] = { t: 'n', f: `SUM(L5:L${catEnd})`, v: totalU30 };
  dashWs[`M${catTotalRow}`] = { t: 'n', f: `SUM(M5:M${catEnd})`, v: 1 };

  // Top 10 Most Used Triggers (starting row 14)
  dashWs['G13'] = { t: 's', v: 'Top 10 Most Used Triggers (30d)' };
  dashWs['G14'] = { t: 's', v: 'Trigger Name' };
  dashWs['H14'] = { t: 's', v: 'Usage 7d' };
  dashWs['I14'] = { t: 's', v: 'Usage 30d' };
  dashWs['J14'] = { t: 's', v: 'Rank' };

  for (let rank = 1; rank <= 10; rank++) {
    const r = 14 + rank;
    dashWs[`J${r}`] = { t: 'n', v: rank };
    dashWs[`G${r}`] = { t: 's', f: `INDEX('Trigger Summary'!$B$2:$B$${trEnd},MATCH(J${r},'Trigger Summary'!$J$2:$J$${trEnd},0))`, v: '' };
    dashWs[`H${r}`] = { t: 'n', f: `INDEX('Trigger Summary'!$G$2:$G$${trEnd},MATCH(J${r},'Trigger Summary'!$J$2:$J$${trEnd},0))`, v: 0 };
    dashWs[`I${r}`] = { t: 'n', f: `INDEX('Trigger Summary'!$H$2:$H$${trEnd},MATCH(J${r},'Trigger Summary'!$J$2:$J$${trEnd},0))`, v: 0 };
  }

  // Trigger Status summary (Rows 16..19)
  dashWs['B15'] = { t: 's', v: 'Trigger Status' };
  dashWs['B16'] = { t: 's', v: 'Status' };
  dashWs['C16'] = { t: 's', v: 'Triggers' };
  dashWs['D16'] = { t: 's', v: '% of Triggers' };

  dashWs['B17'] = { t: 's', v: 'Active' };
  dashWs['C17'] = { t: 'n', f: `SUMPRODUCT(--EXACT('Trigger Summary'!$C$2:$C$${trEnd},$B17))`, v: activeCount };
  dashWs['D17'] = { t: 'n', f: `IF($C$5=0,0,C17/$C$5)`, v: totalTriggers > 0 ? activeCount / totalTriggers : 0 };

  dashWs['B18'] = { t: 's', v: 'Inactive' };
  dashWs['C18'] = { t: 'n', f: `SUMPRODUCT(--EXACT('Trigger Summary'!$C$2:$C$${trEnd},$B18))`, v: inactiveCount };
  dashWs['D18'] = { t: 'n', f: `IF($C$5=0,0,C18/$C$5)`, v: totalTriggers > 0 ? inactiveCount / totalTriggers : 0 };

  dashWs['B19'] = { t: 's', v: 'Total' };
  dashWs['C19'] = { t: 'n', f: 'SUM(C17:C18)', v: totalTriggers };
  dashWs['D19'] = { t: 'n', f: 'SUM(D17:D18)', v: 1 };

  // Usage Range distribution (Rows 21..28)
  dashWs['B21'] = { t: 's', v: 'Trigger Usage Distribution (30d)' };
  dashWs['B22'] = { t: 's', v: 'Usage Range' };
  dashWs['C22'] = { t: 's', v: 'Triggers' };
  dashWs['D22'] = { t: 's', v: '% of Triggers' };

  const ranges = ['0', '1-10', '11-50', '51-100', '>100'];
  ranges.forEach((rng, idx) => {
    const r = 23 + idx;
    dashWs[`B${r}`] = { t: 's', v: rng };
    dashWs[`C${r}`] = { t: 'n', f: `SUMPRODUCT(--EXACT('Trigger Summary'!$I$2:$I$${trEnd},$B${r}))`, v: 0 };
    dashWs[`D${r}`] = { t: 'n', f: `IF($C$5=0,0,C${r}/$C$5)`, v: 0 };
  });
  dashWs['B28'] = { t: 's', v: 'Total' };
  dashWs['C28'] = { t: 'n', f: 'SUM(C23:C27)', v: totalTriggers };
  dashWs['D28'] = { t: 'n', f: 'SUM(D23:D27)', v: 1 };

  dashWs['!ref'] = `A1:M${Math.max(catTotalRow + 2, 30)}`;
  dashWs['!cols'] = [
    { wch: 3 }, { wch: 32 }, { wch: 14 }, { wch: 14 },
    { wch: 5 }, { wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }
  ];

  // Append worksheets in exact template order
  XLSX.utils.book_append_sheet(wb, auditWs, 'Audit');
  XLSX.utils.book_append_sheet(wb, execWs, 'Executive Dashboard');
  XLSX.utils.book_append_sheet(wb, reviewerWs, 'Reviewer Workspace');
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Trigger Summary');
  XLSX.utils.book_append_sheet(wb, auditViewWs, 'Trigger Audit View');
  XLSX.utils.book_append_sheet(wb, dashWs, 'Dashboard Data');
  XLSX.utils.book_append_sheet(wb, triggersWs, 'Triggers');

  return wb;
}

/**
 * -------------------------------------------------------------
 * MACROS AUDIT WORKBOOK BUILDER
 * Generates:
 * 1. Audit (with 3D Bar Chart if tabCounts provided)
 * 2. Macro Summary (formulas & AutoFilter)
 * 3. Macro Audit View (formulas & AutoFilter)
 * 4. Macros (data table with AutoFilter)
 * -------------------------------------------------------------
 */
export function buildMacrosAuditWorkbook(
  items: ResourceItem[],
  tabCounts?: Record<string, number | undefined>
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const macroExportRows = items.map(it => it.exportRow as Record<string, any>);
  const totalMacros = macroExportRows.length;

  // 1. Audit Sheet (if tabCounts available)
  if (tabCounts && Object.keys(tabCounts).length > 0) {
    const { ws: auditWs } = buildAuditSheet(tabCounts, items.length, 'Macros');
    XLSX.utils.book_append_sheet(wb, auditWs, 'Audit');
  }

  // 2. Macros Raw Sheet with AutoFilter
  const canonicalMacroRows = macroExportRows.map(r => ({
    ID: r.ID ?? '',
    Name: r.Name ?? '',
    Description: r.Description ?? '',
    Active: Boolean(r.Active),
    Default: Boolean(r.Default),
    Actions: r.Actions ?? '',
    Restriction: r.Restriction ?? '',
    URL: r.URL ?? '',
    'Created At': r['Created At'] ?? '',
    'Updated At': r['Updated At'] ?? '',
  }));
  const macrosWs = buildWorksheet(canonicalMacroRows);
  macrosWs['!autofilter'] = { ref: `A1:J${Math.max(totalMacros + 1, 2)}` };

  // 3. Macro Summary Sheet with formulas
  const summaryWs: XLSX.WorkSheet = {};
  const summaryHeaders = [
    'Macro ID', 'Name', 'Status', 'Category', 'Sub-category', 'Has Description',
    'Actions', 'Default', 'Restriction', 'Created Date', 'Updated Date', 'Duplicate Name', 'URL'
  ];
  const summaryCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  summaryHeaders.forEach((h, idx) => {
    summaryWs[`${summaryCols[idx]}1`] = { t: 's', v: h };
  });

  canonicalMacroRows.forEach((row, idx) => {
    const r = idx + 2;
    const name = String(row.Name || '').trim();
    let category = '(No category)';
    let subCategory = '(None)';
    if (name.includes('::')) {
      const parts = name.split('::').map(p => p.trim());
      category = parts[0] || '(No category)';
      subCategory = parts.slice(1).join(' :: ') || '(None)';
    }

    const actionCount = row.Actions
      ? String(row.Actions).split('\n').filter(l => l.trim().length > 0).length
      : 0;

    summaryWs[`A${r}`] = { t: 's', f: `IF(Macros!$A${r}="","",TEXT(Macros!$A${r},"0"))`, v: String(row.ID ?? '') };
    summaryWs[`B${r}`] = { t: 's', f: `Macros!$B${r}&""`, v: name };
    summaryWs[`C${r}`] = { t: 's', f: `IF(A${r}="","",IF(OR(Macros!$D${r}=TRUE,UPPER(Macros!$D${r}&"")="TRUE"),"Active","Inactive"))`, v: row.Active ? 'Active' : 'Inactive' };
    summaryWs[`D${r}`] = { t: 's', f: `IFERROR(TRIM(LEFT(Macros!$B${r},FIND("::",Macros!$B${r})-1)),"(No category)")`, v: category };
    summaryWs[`E${r}`] = { t: 's', f: `IFERROR(TRIM(IFERROR(LEFT(MID(Macros!$B${r},FIND("::",Macros!$B${r})+2,500),FIND("::",MID(Macros!$B${r},FIND("::",Macros!$B${r})+2,500))-1),MID(Macros!$B${r},FIND("::",Macros!$B${r})+2,500))),"(None)")`, v: subCategory };
    summaryWs[`F${r}`] = { t: 's', f: `IF(TRIM(Macros!$C${r}&"")="","No","Yes")`, v: row.Description ? 'Yes' : 'No' };
    summaryWs[`G${r}`] = { t: 'n', f: `IF(Macros!$F${r}="",0,SUMPRODUCT(--ISNUMBER(FIND(CHAR(10)&ROW($1:$40)&". ",CHAR(10)&Macros!$F${r}))))`, v: actionCount };
    summaryWs[`H${r}`] = { t: 's', f: `IF(OR(Macros!$E${r}=TRUE,UPPER(Macros!$E${r}&"")="TRUE"),"Yes","No")`, v: row.Default ? 'Yes' : 'No' };
    summaryWs[`I${r}`] = { t: 's', f: `Macros!$G${r}&""`, v: row.Restriction ?? 'Everyone' };
    summaryWs[`J${r}`] = { t: 'n', f: `IFERROR(DATE(VALUE(LEFT(Macros!$I${r},4)),VALUE(MID(Macros!$I${r},6,2)),VALUE(MID(Macros!$I${r},9,2))),"")`, v: toExcelDate(row['Created At']) };
    summaryWs[`K${r}`] = { t: 'n', f: `IFERROR(DATE(VALUE(LEFT(Macros!$J${r},4)),VALUE(MID(Macros!$J${r},6,2)),VALUE(MID(Macros!$J${r},9,2))),"")`, v: toExcelDate(row['Updated At']) };
    summaryWs[`L${r}`] = { t: 's', f: `IF(SUMPRODUCT(--(Macros!$B$2:$B$${totalMacros + 1}=Macros!$B${r}))>1,"Yes","No")`, v: 'No' };
    summaryWs[`M${r}`] = { t: 's', f: `Macros!$H${r}&""`, v: row.URL ?? '' };
  });

  const lastMacroSummaryRow = Math.max(totalMacros + 1, 2);
  summaryWs['!ref'] = `A1:M${lastMacroSummaryRow}`;
  summaryWs['!autofilter'] = { ref: `A1:M${lastMacroSummaryRow}` };
  summaryWs['!cols'] = [
    { wch: 16 }, { wch: 45 }, { wch: 10 }, { wch: 22 }, { wch: 25 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 45 }
  ];

  // 4. Macro Audit View Sheet with formulas
  const auditViewWs: XLSX.WorkSheet = {};
  const auditViewHeaders = [
    'Macro ID', 'Name', 'Status', 'Category', 'Sub-category', 'URL',
    'Created At', 'Updated At', 'Seq', 'Action', 'Action Field', 'Value', 'Source Row'
  ];
  const auditViewCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  auditViewHeaders.forEach((h, idx) => {
    auditViewWs[`${auditViewCols[idx]}1`] = { t: 's', v: h };
  });

  interface MacroAuditRecord {
    sourceRow: number;
    isFirst: boolean;
    macroId: string;
    name: string;
    status: string;
    category: string;
    subCategory: string;
    url: string;
    createdAt: string;
    updatedAt: string;
    seq: number;
    raw: string;
    field: string;
    value: string;
  }

  const macroAuditList: MacroAuditRecord[] = [];
  canonicalMacroRows.forEach((row, idx) => {
    const sourceRow = idx + 2;
    const name = String(row.Name || '').trim();
    let category = '(No category)';
    let subCategory = '(None)';
    if (name.includes('::')) {
      const parts = name.split('::').map(p => p.trim());
      category = parts[0] || '(No category)';
      subCategory = parts.slice(1).join(' :: ') || '(None)';
    }

    const actions = parseRuleLines(row.Actions, 'Actions');
    if (actions.length === 0) {
      actions.push({
        seq: 1,
        section: 'Actions',
        raw: '',
        field: '',
        operator: '',
        value: '',
      });
    }

    actions.forEach((item, itemIdx) => {
      macroAuditList.push({
        sourceRow,
        isFirst: itemIdx === 0,
        macroId: String(row.ID ?? ''),
        name,
        status: row.Active ? 'Active' : 'Inactive',
        category,
        subCategory,
        url: row.URL ?? '',
        createdAt: row['Created At'] ?? '',
        updatedAt: row['Updated At'] ?? '',
        seq: item.seq,
        raw: item.raw,
        field: item.field,
        value: item.value,
      });
    });
  });

  macroAuditList.forEach((item, idx) => {
    const r = idx + 2;
    const sRow = item.sourceRow;

    if (item.isFirst) {
      auditViewWs[`A${r}`] = { t: 's', f: `'Macro Summary'!$A$${sRow}`, v: item.macroId };
      auditViewWs[`B${r}`] = { t: 's', f: `Macros!$B$${sRow}&""`, v: item.name };
      auditViewWs[`C${r}`] = { t: 's', f: `'Macro Summary'!$C$${sRow}`, v: item.status };
      auditViewWs[`D${r}`] = { t: 's', f: `'Macro Summary'!$D$${sRow}`, v: item.category };
      auditViewWs[`E${r}`] = { t: 's', f: `'Macro Summary'!$E$${sRow}`, v: item.subCategory };
      auditViewWs[`F${r}`] = { t: 's', f: `Macros!$H$${sRow}&""`, v: item.url };
      auditViewWs[`G${r}`] = { t: 's', f: `Macros!$I$${sRow}&""`, v: item.createdAt };
      auditViewWs[`H${r}`] = { t: 's', f: `Macros!$J$${sRow}&""`, v: item.updatedAt };
    }

    auditViewWs[`I${r}`] = { t: 'n', v: item.seq };
    auditViewWs[`J${r}`] = { t: 's', v: item.raw };
    auditViewWs[`K${r}`] = { t: 's', v: item.field };
    auditViewWs[`L${r}`] = { t: 's', v: item.value };
    auditViewWs[`M${r}`] = { t: 'n', v: sRow };
  });

  const totalMacroAuditRows = macroAuditList.length;
  const lastMacroAuditViewRow = Math.max(totalMacroAuditRows + 1, 2);
  auditViewWs['!ref'] = `A1:M${lastMacroAuditViewRow}`;
  auditViewWs['!autofilter'] = { ref: `A1:M${lastMacroAuditViewRow}` };
  auditViewWs['!cols'] = [
    { wch: 16 }, { wch: 45 }, { wch: 10 }, { wch: 22 }, { wch: 25 }, { wch: 45 },
    { wch: 24 }, { wch: 24 }, { wch: 6 }, { wch: 45 }, { wch: 22 }, { wch: 30 }, { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Macro Summary');
  XLSX.utils.book_append_sheet(wb, auditViewWs, 'Macro Audit View');
  XLSX.utils.book_append_sheet(wb, macrosWs, 'Macros');

  return wb;
}

/**
 * -------------------------------------------------------------
 * STANDARD TAB WORKBOOK BUILDER
 * Generates a workbook with a single formatted worksheet with
 * AutoFilter enabled across all data columns.
 * -------------------------------------------------------------
 */
export function buildStandardTabAuditWorkbook(
  sheetName: string,
  rows: Record<string, any>[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = buildWorksheet(rows);
  const safeSheetName = sheetName.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  return wb;
}

/**
 * -------------------------------------------------------------
 * DISPATCHER FOR INDIVIDUAL TAB EXPORT
 * Handles building the workbook, injecting the chart if 'Audit'
 * sheet is present, and downloading the enriched file.
 * -------------------------------------------------------------
 */
export async function exportIndividualTabWorkbook(
  tabKey: ConfigTabKey,
  tabInfo: TabConfig,
  items: ResourceItem[],
  subdomain?: string,
  tabCounts?: Record<string, number | undefined>
): Promise<void> {
  let wb: XLSX.WorkBook;
  let hasAuditSheet = false;
  let ruleCount = 13;
  let maxCount = 421;

  if (tabKey === 'triggers') {
    wb = buildTriggersAuditWorkbook(items, tabCounts);
    hasAuditSheet = true;
    if (tabCounts) {
      ruleCount = Object.keys(tabCounts).length;
      maxCount = Math.max(...Object.values(tabCounts).map(v => v || 0), 10);
    }
  } else if (tabKey === 'macros') {
    wb = buildMacrosAuditWorkbook(items, tabCounts);
    if (tabCounts && Object.keys(tabCounts).length > 0) {
      hasAuditSheet = true;
      ruleCount = Object.keys(tabCounts).length;
      maxCount = Math.max(...Object.values(tabCounts).map(v => v || 0), 10);
    }
  } else {
    const rows = items.map(item => item.exportRow);
    wb = buildStandardTabAuditWorkbook(tabInfo.sheetName, rows);
  }

  const filename = generateIndividualExportFilename(tabInfo.label, subdomain);

  if (hasAuditSheet) {
    const rawBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const enrichedBuffer = await injectChartIntoWorkbook(rawBuffer, ruleCount, maxCount);
    triggerFileDownload(enrichedBuffer, filename);
  } else {
    XLSX.writeFile(wb, filename);
  }
}
