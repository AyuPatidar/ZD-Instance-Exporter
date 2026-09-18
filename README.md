# Zendesk Configuration Exporter

A production-quality Zendesk Support app built with **React**, **TypeScript**, **Tailwind CSS**, and **SheetJS**, integrated with the **Zendesk Apps Framework (ZAF v2)**. It enables administrators and support engineers to inspect, search, and export configuration data across **13 core Zendesk resources** into a beautifully formatted multi-sheet Excel (`.xlsx`) workbook.

---

## Key Features

- **13 Configuration Resources Supported**:
  1. **Triggers**: Condition trees, actions, active status, position order.
  2. **Automations**: Time-based rules, conditions, and actions.
  3. **Views**: Filters, output columns, sorting, group-by, and access restrictions.
  4. **Organizations**: Domains, custom organization fields, tags, and groups.
  5. **Agents**: Team members and admins, roles, custom roles, groups, and brand access.
  6. **Groups**: Routing queues, agent counts, public/default flags.
  7. **Macros**: Full action steps, privacy/group restrictions.
  8. **Custom Fields**: Ticket fields, types, portal visibility, and formatted dropdown tagger options (`Name → Value [Default]`).
  9. **Business Hours**: Schedules converted from weekly minute offsets into human-readable weekday hours (`09:00 - 17:00` or `Closed`).
  10. **Support Addresses**: Support emails, brands, SPF/CNAME/forwarding verification statuses.
  11. **Ticket Forms**: End-user visibility, brands, and resolved ticket field names.
  12. **SLAs**: Service level agreements, filters, and priority response/resolution targets.
  13. **Group SLAs**: Internal group ownership targets and priority metrics.

- **Human-Readable Transformations**:
  - Deeply nested condition objects are converted to `Field | Operator | Value` (e.g. `Status | Is | Open`).
  - Action arrays are formatted as `Field → Value` (e.g. `Set Group → Tier 2 Support (36000100002)`).
  - Weekly schedule minute offsets are converted into standard weekday business hours.
  - Dropdown options preserve both names and raw tag values.

- **Cross-Reference Resolution**:
  - Centralized lookup cache automatically resolves numeric IDs (`group_id`, `assignee_id`, `organization_id`, `form_id`, `brand_id`) into human-readable names while preserving original numeric IDs in the underlying model.

- **Raw Data Preservation & Inspection**:
  - Every item maintains both its raw Zendesk API representation and its formatted export row.
  - Interactive **Raw JSON Viewer** modal allows inspecting and copying the original Zendesk API response payload for any item.

- **Client-Side Multi-Sheet XLSX Generation**:
  - Generates a single Excel file with **13 dedicated worksheets**.
  - Preserves native cell types (`number`, `boolean`, `string`, `date`) rather than stringifying everything.
  - Enables multiline text wrapping (`wrapText: true`), column autofilters, and automated column width calculation.
  - Supports both **"Export Current Tab"** and **"Export All as XLSX"** with a live progress checklist modal.

- **Enterprise Reliability & Rate Limiting**:
  - Central request queue with controlled concurrency (`MAX_CONCURRENT_REQUESTS = 3`).
  - Automatic handling and backoff for **HTTP 429 Rate Limits** respecting `Retry-After` headers.
  - Supports both Zendesk **cursor pagination** (`meta.has_more`, `meta.after_cursor`, `links.next`) and URL-based offset pagination (`next_page`).
  - **Partial Failure Resilience**: If plan-restricted endpoints (such as Group SLAs) return `403 Forbidden`, the exporter continues processing other datasets and includes a clear warning summary in the export report.

- **Strict Security & Privacy**:
  - **Zero credentials or API tokens stored**: Uses the active authenticated Zendesk session via ZAF SDK.
  - **No external backend**: 100% client-side operation inside the Zendesk Support iframe.
  - Safe sanitized export filenames: `zendesk-[subdomain]-configuration-export-YYYY-MM-DD-HHmmss.xlsx`.

- **Standalone Dev Mode**:
  - Automatically detects when running outside a Zendesk iframe (e.g. local browser) and provides realistic mock fixtures covering all 13 resources.

---

## Project Structure

```
├── manifest.json              # Zendesk App Framework 2.0 manifest
├── index.html                 # App entry point with ZAF SDK script
├── package.json               # Dependencies and scripts (npm)
├── tsconfig.json              # TypeScript strict configuration
├── vite.config.ts             # Vite configuration with relative base
├── tailwind.config.js         # Tailwind CSS styling tokens
├── src/
│   ├── types/                 # Strongly-typed API & export interfaces
│   │   ├── common.ts          # Condition, action, pagination types
│   │   ├── resources.ts       # 13 raw models + 13 export row models
│   │   ├── lookups.ts         # Central lookup cache interfaces
│   │   └── zaf.ts             # ZAF Client typings
│   ├── services/
│   │   ├── zaf/
│   │   │   ├── zafClient.ts   # Shared ZAF Client instance + mock fallback
│   │   │   └── mockData.ts    # Comprehensive mock fixtures for all 13 endpoints
│   │   ├── api/
│   │   │   ├── zendeskRequest.ts # Concurrency queue, 429 backoff, error mapping
│   │   │   ├── pagination.ts  # Generic cursor & offset pagination engine
│   │   │   ├── lookupService.ts # Priority lookup cache (Groups, Users, Orgs, Fields)
│   │   │   └── configServices.ts # 13 resource fetch & transformation services
│   │   └── export/
│   │       └── xlsxExporter.ts # SheetJS workbook builder with typed cells & wrapText
│   ├── utils/formatters/
│   │   ├── conditionFormatter.ts
│   │   ├── actionFormatter.ts
│   │   ├── scheduleFormatter.ts
│   │   ├── slaFormatter.ts
│   │   ├── customFieldFormatter.ts
│   │   ├── fieldFormatter.ts
│   │   └── dateFormatter.ts
│   ├── components/
│   │   ├── Header.tsx         # Instance metadata, refresh, and global export button
│   │   ├── TabNavigation.tsx  # 13 tab switcher with icons & count badges
│   │   ├── DataTable.tsx      # Compact table with search, sorting, pagination
│   │   ├── RawDataModal.tsx   # JSON inspection modal
│   │   └── ExportProgressModal.tsx # Step-by-step export progress checklist
│   ├── App.tsx                # Main app state coordinator
│   ├── main.tsx               # React DOM root
│   └── index.css              # Tailwind base + custom scrollbars
└── tests/
    ├── formatters.test.ts     # Unit tests for all formatting utilities
    ├── xlsx.test.ts           # Unit tests for workbook & cell type preservation
    └── api_and_resilience.test.ts # Tests for all 13 services & partial failure resilience
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later, tested with v22+)
- **npm** (v9 or later, tested with v11+)

### Installation

Clone or open the repository, then install dependencies:

```bash
npm install
```

### Development Server

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically launch in **Mock Dev Mode** with realistic Zendesk configuration data.

### Running Unit Tests

Run the test suite with **Vitest**:

```bash
npm test
```

All 34 tests covering formatters, lookups, XLSX cell types, and partial failure resilience will execute.

### Building for Zendesk App Framework

Compile the app into the `assets/` directory (required by `manifest.json` and Zendesk CLI):

```bash
npm run build
```

During development with `zcli apps:server`, you can run watch mode in one terminal so changes automatically compile into `assets/`:

```bash
npm run build:watch
```

### Preview Production Build Standalone

Preview the production build locally in standalone mode:

```bash
npm run preview
```

---

## Zendesk Development & Deployment

### 1. Local Testing Inside Zendesk (`zcli apps:server`)

To run and test the app live inside your authenticated Zendesk instance:

1. Build the app into `assets/` (or use watch mode):
   ```bash
   npm run build:watch
   ```
2. In a second terminal, start the Zendesk CLI local server:
   ```bash
   npx @zendesk/zcli apps:server
   ```
3. Open your Zendesk instance in your browser and append `?zat=true` to the URL:
   ```
   https://YOURSUBDOMAIN.zendesk.com/agent/?zat=true
   ```
   Zendesk will load the app directly from `http://localhost:4567/0/assets/index.html`.

### 2. Zendesk CLI (`zcli`) Packaging

To package the app as a zip file for uploading to Zendesk Support:

1. Build the app:
   ```bash
   npm run build
   ```
2. Package the app:
   ```bash
   npx @zendesk/zcli apps:package
   ```
   This packages `manifest.json` and the `assets/` directory into an uploadable zip in the `tmp/` folder.

### 3. Manual Private App Upload

1. Navigate to **Zendesk Admin Center** > **Apps and integrations** > **Zendesk Support apps**.
2. Click **Upload private app**.
3. Provide the packaged zip file containing `manifest.json` and the compiled assets.
4. Assign permissions to Administrators or designated agent roles.

---

## Acceptance & Quality Checklist

- [x] All 13 Zendesk configuration resources implemented
- [x] 100% ZAF Client API communication (`client.request`)
- [x] Zero hardcoded secrets, tokens, or backend dependencies
- [x] Full cursor and offset pagination
- [x] Concurrency limit and HTTP 429 rate limit backoff
- [x] Partial failure resilience (handles 403 Forbidden gracefully)
- [x] Human-readable conditions, actions, schedules, and SLA metrics
- [x] Cross-reference resolution for Groups, Users, Organizations, Forms, and Brands
- [x] Multi-sheet XLSX generation with typed cells (`number`, `boolean`, `date`) and multiline wrapping
- [x] Unit tests passing with Vitest (100% pass rate)

---

## License

MIT License.
