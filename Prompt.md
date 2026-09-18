# Build a Zendesk Configuration Exporter

## 1. Objective

Build a production-quality Zendesk Support app using:

* React
* TypeScript
* Tailwind CSS
* Zendesk Apps Framework (ZAF)
* ZAF Client APIs for **all communication with Zendesk**
* Client-side XLSX generation
* No custom backend
* No direct `fetch()`/Axios calls to Zendesk
* No Zendesk API credentials, API tokens, or secrets embedded in the application

The application will export configuration data from the currently authenticated Zendesk Support instance.

The application must provide a clean UI where each configuration type has its own tabular view and can be exported to XLSX.

---

# 2. Mandatory Zendesk Integration Rule

All communication with Zendesk MUST go through:

```ts
const client = ZAFClient.init();
```

and:

```ts
client.request(...)
```

Do not use:

```ts
fetch(...)
axios(...)
XMLHttpRequest(...)
```

for Zendesk API communication.

Zendesk's documentation explicitly supports using `client.request()` for authenticated Zendesk REST API calls. The browser's Zendesk session is used for authentication.

Use the ZAF SDK from:

```html
https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js
```

The app should initialize one shared ZAF client instance and expose it through a small API/service layer.

Example:

```ts
import ZAFClient from "zafclient";

export const zafClient = ZAFClient.init();
```

If the installed ZAF SDK does not expose suitable TypeScript typings, create a minimal local type declaration rather than weakening the entire project to `any`.

---

# 3. Documentation Requirement

Before implementing each exporter, consult the current Zendesk API documentation for that resource.

Do not guess JSON properties, condition names, action names, operators, enum values, or nested object structures.

The relevant Zendesk APIs include:

* Triggers
* Automations
* Views
* Organizations
* Users/Agents
* Groups
* Macros
* Ticket Fields
* Schedules/Business Hours
* Support Addresses
* Ticket Forms
* SLA Policies
* Group SLA Policies

Zendesk's API reference is the authoritative source for endpoint behavior and JSON formats.

The implementation must preserve the actual Zendesk configuration semantics instead of merely dumping raw JSON.

---

# 4. Configuration Tabs

Create exactly these primary tabs:

1. Triggers
2. Automations
3. Views
4. Organizations
5. Agents
6. Groups
7. Macros
8. Custom Fields
9. Business Hours
10. Support Addresses
11. Forms
12. SLAs
13. Group SLAs

Each tab must have:

* Table
* Search
* Column sorting
* Loading state
* Empty state
* Error state
* Refresh button
* Record count
* Export XLSX button
* Optional "Export all" control
* Human-readable nested data

The UI should not display raw JSON blobs unless the user explicitly opens a details/JSON view.

---

# 5. Application Architecture

Keep API retrieval, transformation, presentation, and export logic separate.

---

# 6. API Service Layer

Create a generic ZAF API wrapper.

Example:

```ts
export async function zendeskRequest<T>(
  options: ZendeskRequestOptions
): Promise<T> {
  return zafClient.request<T>({
    ...options,
    dataType: "json",
  });
}
```

Do not expose raw ZAF requests throughout React components.

Instead:

```ts
getTriggers()
getAutomations()
getViews()
getOrganizations()
getAgents()
getGroups()
getMacros()
getCustomFields()
getBusinessHours()
getSupportAddresses()
getForms()
getSLAs()
getGroupSLAs()
```

should be the only functions used by the UI.

---

# 7. Pagination

Pagination is mandatory.

Never assume the first API response contains all records.

Prefer cursor pagination where the endpoint supports it.

The implementation must continue requesting pages until there is no next cursor/page.

Support Zendesk's cursor pagination format, including:

```text
meta.has_more
meta.after_cursor
links.next
```

and endpoint-specific pagination structures where applicable.

Do not use arbitrary limits such as:

```ts
page <= 10
```

unless the API explicitly requires it.

The exporter must export the complete accessible dataset.

For example, Zendesk's Views API returns up to 100 records per page and supports cursor pagination.

Users also support cursor pagination and have a maximum of 100 records per page.

---

# 8. Rate Limiting

Implement a centralized request/rate-limit strategy.

If Zendesk returns HTTP 429:

* Respect `Retry-After`
* Wait before retrying
* Retry safely
* Avoid uncontrolled parallel requests
* Show progress in the UI

ZAF can automatically retry rate-limited requests by default, but the application should still avoid generating an unnecessarily large number of concurrent requests.

Use a small concurrency limit, for example:

```ts
const MAX_CONCURRENT_REQUESTS = 3;
```

unless API behavior demonstrates that another value is safer.

---

# 9. Data Model Requirement

For every resource, define explicit TypeScript interfaces.

Do NOT use:

```ts
any[]
```

for the exported dataset.

Example:

```ts
interface Trigger {
  id: number;
  title: string;
  active: boolean;
  position: number;
  conditions: TriggerConditions;
  actions: TriggerAction[];
  created_at: string;
  updated_at: string;
}
```

Then create a separate export model:

```ts
interface TriggerExportRow {
  ID: number | null;
  Title: string;
  Active: boolean;
  Position: number | null;
  Conditions: string;
  Actions: string;
  CreatedAt: string | null;
  UpdatedAt: string | null;
}
```

The API model and export model must remain separate.

---

# 10. Data Types

Use correct data types.

Do not stringify everything before XLSX generation.

Use:

* `number` for IDs, positions, numeric targets, counts, durations
* `boolean` for true/false configuration properties
* `Date` or ISO-compatible date values for timestamps
* `string` for names, descriptions, operators, field names, titles
* arrays/objects internally
* formatted strings only for human-readable nested fields

For XLSX, preserve actual cell types.

For example:

```text
ID             -> number
Active         -> boolean
Position       -> number
Created At     -> date/string date representation
Conditions     -> readable string
Actions        -> readable string
```

Do not turn:

```text
true
123
false
456
```

into:

```text
"true"
"123"
"false"
"456"
```

inside the XLSX data model.

---

# 11. Human-Readable Nested Data

Zendesk configurations contain deeply nested objects and arrays.

Do NOT put this directly into a table cell:

```json
{"all":[{"field":"status","operator":"is","value":"open"}]}
```

Instead render it as readable text.

For example:

```text
ALL:
Status | Is | Open
Priority | Is Not | Low

ANY:
Tags | Includes | vip
```

For actions:

```text
Set Status -> Pending
Set Group -> Technical Support
Notify User -> Requester
Add Tags -> vip, priority
```

For export cells, use line breaks where appropriate.

Example:

```text
Status | Is | Open
Priority | Greater Than | Normal
```

Use Excel-compatible newline characters:

```ts
"\n"
```

and enable:

```ts
wrapText: true
```

for exported cells where supported.

---

# 12. Conditions and Actions

This is particularly important for:

* Triggers
* Automations
* Views
* SLAs
* Group SLAs
* Forms where applicable

Do not simply display internal API keywords.

Create formatting utilities that convert Zendesk API values into readable labels.

Example:

```ts
formatOperator("is_not")
```

should produce:

```text
Is Not
```

Example:

```ts
formatField("group_id")
```

should produce:

```text
Group
```

Example:

```ts
formatAction({
  field: "status",
  value: "pending"
})
```

should produce:

```text
Status → Pending
```

Maintain a mapping layer rather than hard-coding formatting throughout components.

Important:

The original Zendesk API values must remain available in the underlying data.

Human-readable formatting is for presentation/export only.

---

# 13. Triggers

Use the Zendesk Ticket Triggers API.

Triggers consist of conditions and actions and are evaluated in order, so preserve:

* ID
* Title
* Active
* Position
* Conditions
* Actions
* Created At
* Updated At
* Any additional documented configuration properties returned by the API

Zendesk documents trigger conditions/actions separately and states that trigger order is significant.

Recommended columns:

| Column         | Type        |
| -------------- | ----------- |
| ID             | number      |
| Title          | string      |
| Active         | boolean     |
| Position       | number      |
| All Conditions | string      |
| Any Conditions | string      |
| Actions        | string      |
| Created At     | date/string |
| Updated At     | date/string |

If the API returns additional useful properties, retain them in the detailed/raw model.

---

# 14. Automations

Use the Automations API.

Automations contain:

* actions
* active
* conditions
* timestamps
* position and other documented properties where returned

Zendesk describes automations as time-based rules whose conditions are evaluated periodically.

Recommended columns:

| Column         | Type        |
| -------------- | ----------- |
| ID             | number      |
| Title          | string      |
| Active         | boolean     |
| Position       | number      |
| All Conditions | string      |
| Any Conditions | string      |
| Actions        | string      |
| Created At     | date/string |
| Updated At     | date/string |

Pay special attention to time-based conditions such as:

* hours since created
* hours since open
* hours since pending
* hours since on-hold
* hours since solved

Zendesk documents these automation-specific condition concepts.

---

# 15. Views

Use:

```text
GET /api/v2/views
```

and the appropriate pagination mechanism.

Capture:

* ID
* Title
* Active
* Default
* Description
* Position
* Conditions
* Restriction
* Execution/output
* Created At
* Updated At

Views contain conditions and execution/output configuration, including columns, grouping and sorting.

Recommended columns:

| Column             | Type        |
| ------------------ | ----------- |
| ID                 | number      |
| Title              | string      |
| Active             | boolean     |
| Default            | boolean     |
| Position           | number      |
| Description        | string      |
| Access Restriction | string      |
| All Conditions     | string      |
| Any Conditions     | string      |
| Columns            | string      |
| Group By           | string      |
| Group Order        | string      |
| Sort By            | string      |
| Sort Order         | string      |
| Created At         | date/string |
| Updated At         | date/string |

Use readable names for standard view columns.

For custom fields, resolve the field title where possible.

---

# 16. Organizations

Use the Organizations API.

Export:

* ID
* Name
* Details
* Notes
* Domain Names
* External ID
* Group ID
* Shared Comments
* Shared Tickets
* Tags
* Organization Fields
* Created At
* Updated At

Zendesk documents organization properties including `domain_names`, `group_id`, `organization_fields`, `shared_comments`, `shared_tickets`, and `tags`.

Recommended columns:

```text
ID
Name
Details
Notes
Domain Names
External ID
Group ID
Shared Comments
Shared Tickets
Tags
Custom Fields
Created At
Updated At
```

Arrays such as domain names and tags should be readable:

```text
example.com
example.org
example.net
```

rather than raw JSON.

---

# 17. Agents

Use the Users API with appropriate role filtering.

The objective is to export agents, not end users.

Filter appropriately for:

```text
role=agent
role=admin
```

depending on how Zendesk exposes the account's team members.

Preserve enough information to distinguish:

* Agent
* Administrator
* Light Agent where applicable
* Custom role information where returned

Zendesk documents user roles including end users, agents, and administrators and exposes fields such as `role`, `role_type`, `custom_role_id`, `restricted_agent`, `suspended`, groups, and user fields.

Recommended columns:

```text
ID
Name
Email
Role
Role Type
Custom Role ID
Active
Suspended
Restricted Agent
Alias
Details
Notes
Phone
Time Zone
Locale
Organization ID
Group IDs
Agent Brand IDs
Tags
User Fields
Created At
Updated At
Last Login At
Verified
```

Do not export authentication credentials or secrets.

---

# 18. Groups

Use the Groups API.

Recommended columns:

```text
ID
Name
Description
Default
Public
Deleted
Created At
Updated At
```

Zendesk groups are central to ticket routing and group assignment.

Where group/user membership is available without excessive additional API calls, provide:

```text
Agent Count
```

and/or:

```text
Agent IDs
```

But do not make thousands of unnecessary requests merely to populate membership.

---

# 19. Macros

Use the Macros API.

Macros contain actions and configuration metadata.

Zendesk documents `actions`, `active`, `default`, `description`, IDs and timestamps for macros.

Recommended columns:

```text
ID
Name
Description
Active
Default
Actions
Restriction
Created At
Updated At
```

Actions must be formatted using the same action formatter used by triggers and automations.

---

# 20. Custom Fields

The "Custom Fields" tab should primarily export custom ticket fields.

Use the Ticket Fields API.

Do not mix system fields into the custom-field export unless clearly marked.

Zendesk's Ticket Fields API exposes field metadata including type, title, description, portal settings, options, validation, relationship information, and other configuration properties.

Recommended columns:

```text
ID
Title
Type
Active
Description
Agent Description
Title In Portal
Visible In Portal
Editable In Portal
Required
Required In Portal
Agent Can Edit
Collapsed For Agents
Position
Tag
Regexp For Validation
Custom Field Options
Relationship Target Type
Relationship Filter
Creator App Name
Created At
Updated At
```

For dropdown/tagger options, render:

```text
Option Name → Option Value
```

and indicate the default option where applicable.

Example:

```text
Alfa Romeo → alfa_romeo
Aston Martin → aston_martin [Default]
BMW → bmw
```

Do not lose the original option values.

---

# 21. Business Hours

Use Zendesk's Schedules API.

Endpoint:

```text
GET /api/v2/business_hours/schedules
```

Zendesk represents schedules using:

* ID
* Name
* Time Zone
* Intervals
* Created At
* Updated At

Recommended columns:

```text
ID
Name
Time Zone
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
Created At
Updated At
```

Convert Zendesk interval minute values into readable times.

For example:

```text
09:00 - 17:00
```

If multiple intervals exist:

```text
09:00 - 12:00
13:00 - 17:00
```

Do not expose raw minute offsets unless a details view is opened.

If the API represents intervals using weekday-specific values, map them correctly to weekdays.

---

# 22. Support Addresses

Use:

```text
GET /api/v2/recipient_addresses
```

Zendesk calls these Support Addresses and documents fields including brand, email, default status, forwarding status, SPF status, DNS/CNAME status and timestamps.

Recommended columns:

```text
ID
Name
Email
Brand ID
Default
Forwarding Status
SPF Status
CNAME Status
DNS Verification Status
Domain Verification Status
Created At
Updated At
```

Do not expose verification secrets or domain verification codes unless explicitly required.

Prefer safe configuration metadata over sensitive verification information.

---

# 23. Forms

Use the Ticket Forms API.

Capture:

```text
ID
Name
Display Name
Active
Default
Position
End User Visible
In All Brands
Restricted Brand IDs
Ticket Field IDs
Agent Conditions
End User Conditions
Created At
Deleted At
```

Zendesk's Ticket Forms API documents these properties and the relationship between forms and ticket fields.

For ticket fields, make the table human-readable where practical.

For example:

```text
Subject
Description
Priority
Type
Custom Field: Product
Custom Field: Region
Custom Field: Customer Tier
```

Resolve IDs to field titles when the required data is already available from the Custom Fields export.

Avoid one additional request per field whenever possible.

---

# 24. SLA Policies

Use:

```text
GET /api/v2/slas/policies
```

Zendesk's SLA Policy objects contain:

* title
* description
* filter
* policy metrics
* position
* timestamps
* ID

Recommended columns:

```text
ID
Title
Description
Position
All Conditions
Any Conditions
Metrics
Created At
Updated At
```

Format policy metrics like:

```text
Priority: Urgent
Metric: First Reply Time
Target: 10 minutes
Business Hours: No

Priority: High
Metric: Requester Wait Time
Target: 120 minutes
Business Hours: Yes
```

Do not simply export:

```json
[{"priority":"urgent","metric":"first_reply_time","target":10}]
```

as the primary display value.

Preserve the underlying structured metric information for accurate XLSX export and optional details view.

---

# 25. Group SLA Policies

Use:

```text
GET /api/v2/group_slas/policies
```

These APIs are plan-dependent and require admin permissions. Handle 403/feature-unavailable responses gracefully. Zendesk documents Group SLA policies as Enterprise-and-above functionality.

Recommended columns:

```text
ID
Title
Description
Position
All Conditions
Policy Metrics
Created At
Updated At
```

Format metrics as:

```text
Priority: Normal
Metric: Group Ownership Time
Target: 30 minutes
Business Hours: Yes
```

The filter must remain readable.

For example:

```text
Group ID Includes:
Tier 1 Support
Tier 2 Support
```

If group IDs can be resolved using the Groups dataset, display group names while retaining the original IDs internally.

---

# 26. Cross-Reference Resolution

Build a central lookup cache:

```ts
interface ZendeskLookups {
  groups: Map<number, string>;
  users: Map<number, string>;
  organizations: Map<number, string>;
  ticketFields: Map<number, TicketField>;
  forms: Map<number, string>;
  brands: Map<number, string>;
}
```

Use these mappings to make configuration data readable.

For example:

Instead of:

```text
group_id = 12345
```

display:

```text
Technical Support (12345)
```

Instead of:

```text
assignee_id = 9876
```

display:

```text
John Smith (9876)
```

Always retain the numeric ID in the raw data model.

Do not silently replace IDs with names.

---

# 27. Export Architecture

Provide two export formats.

## XLSX

Generate one workbook containing 13 worksheets:

```text
Triggers
Automations
Views
Organizations
Agents
Groups
Macros
Custom Fields
Business Hours
Support Addresses
Forms
SLAs
Group SLAs
```

The workbook should be named:

```text
zendesk-configuration-export-YYYY-MM-DD-HHmmss.xlsx
```

Each resource gets its own worksheet.

Use a reliable browser-compatible XLSX library such as SheetJS if appropriate.

Preserve:

* numbers as numbers
* booleans as booleans
* dates appropriately
* multiline text
* column widths
* wrapped cells
* header styling
* frozen header row
* autofilter

---

# 29. Export Button Behavior

Provide:

```text
Export Current Tab
Export All as XLSX
```

For "Export Current Tab":

* export only the active tab.

For "Export All as XLSX":

* retrieve all required datasets
* transform them
* generate one workbook
* download once

Show progress:

```text
Fetching configuration...

✓ Triggers
✓ Automations
✓ Views
✓ Organizations
⟳ Agents
...
```

For each dataset show:

```text
Fetched 247 records
```

---

# 30. Table UX

Use Tailwind CSS.

The visual style should feel like a professional Zendesk admin utility.

Include:

* compact table
* sticky header
* alternating row colors
* hover state
* column sorting
* global search
* pagination
* record count
* responsive layout
* horizontal scrolling for wide tables
* readable multiline cells

Long condition/action cells should have:

```text
max-width
line-clamp
tooltip/details
```

or an expandable row/details panel.

Do not make the main table unreadable because of nested JSON.

---

# 31. Search

Implement client-side search after the dataset has been loaded.

Search should work across useful textual fields.

For example, on Triggers:

```text
title
description
conditions
actions
```

On Organizations:

```text
name
details
notes
domains
tags
```

On Agents:

```text
name
email
role
groups
organization
```

Debounce the search input if necessary.

---

# 32. Error Handling

Handle:

* 401
* 403
* 404
* 409
* 422
* 429
* 500
* network errors
* unavailable feature/plan
* permission failures
* malformed API responses

Example user-facing error:

```text
Unable to export Group SLAs.

Zendesk returned 403 Forbidden.
Your account or current agent may not have permission to access Group SLA policies.
```

Do not expose stack traces to the normal user interface.

Log useful diagnostic information to the browser console in development mode.

---

# 33. Partial Failure

One failed configuration type must not cause the entire export to fail.

For example:

```text
Triggers       ✓ 52
Automations    ✓ 19
Views          ✓ 37
Organizations  ✓ 802
Agents         ✓ 64
Groups         ✓ 14
Macros         ✓ 41
Custom Fields  ✓ 119
Business Hours ✓ 3
Addresses      ✓ 8
Forms          ✓ 12
SLAs           ✗ Permission denied
Group SLAs     ✗ Feature unavailable
```

The user should still be able to export the successful datasets.

The XLSX workbook should include successful sheets and omit unavailable datasets, with a clear export summary.

---

# 34. API Response Validation

Validate API responses at the service boundary.

Use a runtime validation library such as Zod if appropriate.

Example:

```ts
const TriggerResponseSchema = z.object({
  triggers: z.array(...)
});
```

Do not allow malformed API data to silently propagate through the application.

If validation fails:

* log the resource
* show a useful error
* preserve raw response information for debugging where safe

---

# 35. Security

Never:

* store Zendesk API tokens
* ask the user for an API token
* embed credentials
* put credentials into localStorage
* send Zendesk data to an external backend
* send Zendesk data to an AI service
* send Zendesk configuration to analytics services

The app must operate using the authenticated Zendesk session through ZAF.

---

# 36. No Backend Requirement

The first implementation must be entirely client-side.

Architecture:

```text
Zendesk
   ↓
ZAF Client
   ↓
API Service
   ↓
Typed Data
   ↓
Transformation / Formatting
   ↓
React Tables
   ↓
XLSX Export
   ↓
Browser Download
```

Do not introduce a backend merely for file generation.

---

# 37. Performance

Do not load all 13 resources simultaneously with unlimited concurrency.

Use controlled parallelism.

For example:

```ts
const resources = [
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
];
```

Use a concurrency limiter.

Prioritize lookup datasets early:

1. Groups
2. Agents
3. Organizations
4. Custom Fields
5. Forms

Then resolve names in the other resources.

Avoid N+1 requests.

---

# 38. Caching

During one export session, cache datasets such as:

```text
groups
users
organizations
ticket fields
forms
```

Do not repeatedly request the same records.

Allow manual refresh to invalidate the cache.

Do not use stale cached data across unrelated Zendesk sessions.

---

# 39. Dates

Normalize Zendesk timestamps consistently.

Display:

```text
2026-09-18 13:30:42 UTC
```

or a clearly labeled local timezone.

Do not silently change timestamps without indicating the timezone.

For XLSX, use an appropriate date representation where possible.

---

# 40. File Naming

Use safe filenames.

Example:

```text
zendesk-configuration-export-2026-09-18-133042.xlsx
```

Do not include Zendesk subdomain names unless they have been safely sanitized.

---

# 41. App Initialization

On application load:

1. Initialize ZAF client.
2. Retrieve context.
3. Verify that the app is running in Zendesk Support.
4. Display the current Zendesk account/subdomain when available.
5. Load the first/default tab.
6. Do not immediately fetch all 13 datasets unless the user chooses "Export All."

This keeps the initial app responsive.

---

# 42. Recommended Initial UI

Header:

```text
Zendesk Configuration Exporter

[Refresh] [Export All XLSX]
```

Tabs:

```text
Triggers | Automations | Views | Organizations | Agents | Groups |
Macros | Custom Fields | Business Hours | Support Addresses |
Forms | SLAs | Group SLAs
```

Content:

```text
Triggers

Search triggers...

52 records                         [XLSX]

┌────┬──────────────────────┬────────┬──────────┬──────────────┐
│ ID │ Title                │ Active │ Position │ Conditions   │
├────┼──────────────────────┼────────┼──────────┼──────────────┤
│ 12 │ Escalate VIP Ticket  │ ✓      │ 1        │ Status is... │
│ 19 │ Notify Support Team  │ ✓      │ 2        │ Priority...  │
└────┴──────────────────────┴────────┴──────────┴──────────────┘
```

---

# 43. Export Summary

After an export, show:

```text
Export completed

13 configuration types processed

Triggers             52
Automations          19
Views                37
Organizations       802
Agents               64
Groups               14
Macros               41
Custom Fields       119
Business Hours        3
Support Addresses     8
Forms                12
SLAs                  6
Group SLAs            4

XLSX downloaded successfully.
```

If anything failed:

```text
Completed with warnings

SLAs: Permission denied
Group SLAs: Feature unavailable
```

---

# 44. Important API Semantics

Do not assume every API uses the same object structure.

Examples:

Triggers and Automations use conditions/actions.

Views use conditions plus execution/output configuration.

Organizations use organization fields.

Ticket Fields contain custom-field options and relationship metadata.

Schedules use intervals and time zones.

Support Addresses contain email/channel verification metadata.

Ticket Forms reference ticket fields.

SLA policies contain filters and policy metrics.

Group SLA policies contain filters and policy metrics specific to group-level SLA behavior.

The exporter must preserve those semantics.

---

# 45. Raw Data Preservation

For every resource maintain two representations:

```ts
{
  raw: ZendeskApiObject,
  exportRow: ExportRow
}
```

The raw object is never displayed as the primary table representation.

The formatted export row is what the user sees and exports.

This is important because human-readable formatting must not destroy the original Zendesk values.

---

# 46. Testing

Create unit tests for:

* pagination
* API response parsing
* condition formatting
* action formatting
* metric formatting
* interval/time formatting
* custom-field option formatting
* lookup resolution
* XLSX generation
* boolean preservation
* numeric preservation
* multiline cells
* empty/null values
* partial API failures
* HTTP 429 handling

Create fixture JSON based on the actual Zendesk API response formats documented by Zendesk.

Do not invent simplified fixtures that omit important nested structures.

---

# 47. Acceptance Criteria

The implementation is complete only when all of the following are true:

* [ ] React application works inside Zendesk.
* [ ] Tailwind CSS is used for styling.
* [ ] ZAF Client is initialized correctly.
* [ ] All Zendesk communication uses `client.request()`.
* [ ] No direct Zendesk `fetch()`/Axios calls exist.
* [ ] No Zendesk credentials are stored in the application.
* [ ] All 13 requested resources are implemented.
* [ ] All supported endpoints are paginated correctly.
* [ ] Cursor pagination is preferred where available.
* [ ] Rate limits are handled.
* [ ] 403/plan restrictions are handled gracefully.
* [ ] Every resource has its own table.
* [ ] Tables support search.
* [ ] Tables support sorting.
* [ ] Tables have loading/empty/error states.
* [ ] Nested JSON is human-readable.
* [ ] Conditions are human-readable.
* [ ] Actions are human-readable.
* [ ] SLA metrics are human-readable.
* [ ] Business-hour intervals are converted to readable times.
* [ ] IDs remain numeric internally.
* [ ] Boolean fields remain boolean internally.
* [ ] Numeric fields remain numeric internally.
* [ ] XLSX has one worksheet per configuration type.
* [ ] Exported XLSX cells use appropriate data types.
* [ ] Excel cells wrap multiline configuration data.
* [ ] Export filenames are safe.
* [ ] Export progress is visible.
* [ ] Partial failures do not destroy successful exports.
* [ ] No secrets are exported.
* [ ] Unit tests cover transformation and export logic.
* [ ] TypeScript is used throughout.
* [ ] No unnecessary `any` types are used.
* [ ] No N+1 API request pattern is introduced.
* [ ] The application remains responsive with large Zendesk instances.

---

# 48. Final Implementation Rule

Do not begin by writing the UI and then guessing the API data structure.

Implement in this order:

1. Read the relevant Zendesk API documentation.
2. Define TypeScript API models.
3. Implement ZAF API clients.
4. Implement pagination.
5. Implement rate-limit handling.
6. Implement lookup caching.
7. Implement transformation/formatting functions.
8. Create export models with explicit types.
9. Implement XLSX exporters.
10. Implement reusable DataTable.
11. Build the 13 tabs.
12. Add export controls.
13. Add error/permission/partial-failure handling.
14. Add tests.
15. Verify the generated XLSX against actual Zendesk API responses.

Never fabricate an API property or endpoint.

When Zendesk's API documentation and an assumption conflict, follow the current Zendesk API documentation.

The final application should be a **read-only configuration exporter**. It must never create, update, delete, reorder, or otherwise modify Zendesk configuration.
