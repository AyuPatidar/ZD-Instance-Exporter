import { ZendeskConditions, ZendeskAction } from './common';

// Generic Wrapper for all resources preserving raw and formatted
export interface ResourceItem<TRaw = any, TExport = any> {
  id: number | string;
  raw: TRaw;
  exportRow: TExport;
}

// 1. Triggers
export interface ZendeskTriggerRaw {
  id: number;
  title: string;
  active: boolean;
  position: number;
  conditions: ZendeskConditions;
  actions: ZendeskAction[];
  description?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface TriggerExportRow {
  ID: number;
  Title: string;
  Active: boolean;
  Position: number;
  'All Conditions': string;
  'Any Conditions': string;
  Actions: string;
  'Created At': string;
  'Updated At': string;
}

// 2. Automations
export interface ZendeskAutomationRaw {
  id: number;
  title: string;
  active: boolean;
  position: number;
  conditions: ZendeskConditions;
  actions: ZendeskAction[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface AutomationExportRow {
  ID: number;
  Title: string;
  Active: boolean;
  Position: number;
  'All Conditions': string;
  'Any Conditions': string;
  Actions: string;
  'Created At': string;
  'Updated At': string;
}

// 3. Views
export interface ZendeskViewRaw {
  id: number;
  title: string;
  active: boolean;
  default?: boolean;
  position: number;
  description?: string;
  conditions?: ZendeskConditions;
  restriction?: {
    type?: string;
    id?: number;
    ids?: number[];
  };
  execution?: {
    group_by?: string;
    group_order?: string;
    sort_by?: string;
    sort_order?: string;
    columns?: Array<{ id: string | number; title?: string }>;
    fields?: Array<{ id: string | number; title?: string }>;
  };
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ViewExportRow {
  ID: number;
  Title: string;
  Active: boolean;
  Default: boolean;
  Position: number;
  Description: string;
  'Access Restriction': string;
  'All Conditions': string;
  'Any Conditions': string;
  Columns: string;
  'Group By': string;
  'Group Order': string;
  'Sort By': string;
  'Sort Order': string;
  'Created At': string;
  'Updated At': string;
}

// 4. Organizations
export interface ZendeskOrganizationRaw {
  id: number;
  name: string;
  details?: string;
  notes?: string;
  domain_names?: string[];
  external_id?: string | null;
  group_id?: number | null;
  shared_comments?: boolean;
  shared_tickets?: boolean;
  tags?: string[];
  organization_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface OrganizationExportRow {
  ID: number;
  Name: string;
  Details: string;
  Notes: string;
  'Domain Names': string;
  'External ID': string;
  'Group ID': string;
  'Shared Comments': boolean;
  'Shared Tickets': boolean;
  Tags: string;
  'Custom Fields': string;
  'Created At': string;
  'Updated At': string;
}

// 5. Agents
export interface ZendeskAgentRaw {
  id: number;
  name: string;
  email: string;
  role: string;
  role_type?: number;
  custom_role_id?: number | null;
  active: boolean;
  suspended: boolean;
  restricted_agent?: boolean;
  alias?: string | null;
  details?: string | null;
  notes?: string | null;
  phone?: string | null;
  time_zone?: string;
  locale?: string;
  organization_id?: number | null;
  default_group_id?: number | null;
  group_ids?: number[];
  agent_brand_ids?: number[];
  tags?: string[];
  user_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  verified?: boolean;
  [key: string]: any;
}

export interface AgentExportRow {
  ID: number;
  Name: string;
  Email: string;
  Role: string;
  'Role Type': string;
  'Custom Role ID': number | string;
  Active: boolean;
  Suspended: boolean;
  'Restricted Agent': boolean;
  Alias: string;
  Details: string;
  Notes: string;
  Phone: string;
  'Time Zone': string;
  Locale: string;
  'Organization ID': string;
  'Group IDs': string;
  'Agent Brand IDs': string;
  Tags: string;
  'User Fields': string;
  'Created At': string;
  'Updated At': string;
  'Last Login At': string;
  Verified: boolean;
}

// 6. Groups
export interface ZendeskGroupRaw {
  id: number;
  name: string;
  description?: string;
  default?: boolean;
  is_public?: boolean;
  deleted?: boolean;
  agent_count?: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface GroupExportRow {
  ID: number;
  Name: string;
  Description: string;
  Default: boolean;
  Public: boolean;
  Deleted: boolean;
  'Agent Count': number | string;
  'Created At': string;
  'Updated At': string;
}

// 7. Macros
export interface ZendeskMacroRaw {
  id: number;
  title: string;
  description?: string;
  active: boolean;
  default?: boolean;
  actions: ZendeskAction[];
  restriction?: {
    type?: string;
    id?: number;
    ids?: number[];
  };
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface MacroExportRow {
  ID: number;
  Name: string;
  Description: string;
  Active: boolean;
  Default: boolean;
  Actions: string;
  Restriction: string;
  'Created At': string;
  'Updated At': string;
}

// 8. Custom Fields (Ticket Fields)
export interface ZendeskCustomFieldOption {
  id?: number;
  name: string;
  value: string;
  default?: boolean;
}

export interface ZendeskTicketFieldRaw {
  id: number;
  title: string;
  type: string;
  active: boolean;
  description?: string;
  agent_description?: string;
  title_in_portal?: string;
  visible_in_portal?: boolean;
  editable_in_portal?: boolean;
  required?: boolean;
  required_in_portal?: boolean;
  agent_can_edit?: boolean;
  collapsed_for_agents?: boolean;
  position: number;
  tag?: string;
  regexp_for_validation?: string | null;
  custom_field_options?: ZendeskCustomFieldOption[];
  relationship_target_type?: string | null;
  relationship_filter?: any;
  creator_app_name?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface CustomFieldExportRow {
  ID: number;
  Title: string;
  Type: string;
  Active: boolean;
  Description: string;
  'Agent Description': string;
  'Title In Portal': string;
  'Visible In Portal': boolean;
  'Editable In Portal': boolean;
  Required: boolean;
  'Required In Portal': boolean;
  'Agent Can Edit': boolean;
  'Collapsed For Agents': boolean;
  Position: number;
  Tag: string;
  'Regexp For Validation': string;
  'Custom Field Options': string;
  'Relationship Target Type': string;
  'Relationship Filter': string;
  'Creator App Name': string;
  'Created At': string;
  'Updated At': string;
}

// 9. Business Hours (Schedules)
export interface ZendeskWorkWeekInterval {
  start_time: number; // minutes from Sunday midnight
  end_time: number;
}

export interface ZendeskScheduleRaw {
  id: number;
  name: string;
  time_zone: string;
  intervals: ZendeskWorkWeekInterval[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ScheduleExportRow {
  ID: number;
  Name: string;
  'Time Zone': string;
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday: string;
  Sunday: string;
  'Created At': string;
  'Updated At': string;
}

// 10. Support Addresses
export interface ZendeskSupportAddressRaw {
  id: number;
  name?: string;
  email: string;
  brand_id?: number | null;
  default?: boolean;
  forwarding_status?: string;
  spf_status?: string;
  cname_status?: string;
  dns_results?: string;
  domain_verification_status?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface SupportAddressExportRow {
  ID: number;
  Name: string;
  Email: string;
  'Brand ID': string;
  Default: boolean;
  'Forwarding Status': string;
  'SPF Status': string;
  'CNAME Status': string;
  'DNS Verification Status': string;
  'Domain Verification Status': string;
  'Created At': string;
  'Updated At': string;
}

// 11. Ticket Forms
export interface ZendeskTicketFormRaw {
  id: number;
  name: string;
  display_name?: string;
  active: boolean;
  default?: boolean;
  position: number;
  end_user_visible?: boolean;
  in_all_brands?: boolean;
  restricted_brand_ids?: number[];
  ticket_field_ids?: number[];
  agent_conditions?: any[];
  end_user_conditions?: any[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface TicketFormExportRow {
  ID: number;
  Name: string;
  'Display Name': string;
  Active: boolean;
  Default: boolean;
  Position: number;
  'End User Visible': boolean;
  'In All Brands': boolean;
  'Restricted Brand IDs': string;
  'Ticket Field IDs': string;
  'Agent Conditions': string;
  'End User Conditions': string;
  'Created At': string;
  'Updated At': string;
}

// 12. SLA Policies
export interface ZendeskSLAMetric {
  priority: string;
  metric: string;
  target: number;
  business_hours: boolean;
}

export interface ZendeskSLAPolicyRaw {
  id: number;
  title: string;
  description?: string;
  position: number;
  filter: ZendeskConditions;
  policy_metrics: ZendeskSLAMetric[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface SLAPolicyExportRow {
  ID: number;
  Title: string;
  Description: string;
  Position: number;
  'All Conditions': string;
  'Any Conditions': string;
  Metrics: string;
  'Created At': string;
  'Updated At': string;
}

// 13. Group SLA Policies
export interface ZendeskGroupSLAPolicyRaw {
  id: number;
  title: string;
  description?: string;
  position: number;
  filter: ZendeskConditions;
  policy_metrics: ZendeskSLAMetric[];
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface GroupSLAPolicyExportRow {
  ID: number;
  Title: string;
  Description: string;
  Position: number;
  'All Conditions': string;
  'Policy Metrics': string;
  'Created At': string;
  'Updated At': string;
}

// Configuration Tabs Enum / Type
export type ConfigTabKey =
  | 'triggers'
  | 'automations'
  | 'views'
  | 'organizations'
  | 'agents'
  | 'groups'
  | 'macros'
  | 'custom_fields'
  | 'business_hours'
  | 'support_addresses'
  | 'forms'
  | 'slas'
  | 'group_slas';

export interface TabConfig {
  key: ConfigTabKey;
  label: string;
  sheetName: string;
}
