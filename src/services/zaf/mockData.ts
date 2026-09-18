export const mockTriggers = {
  triggers: [
    {
      id: 36001234501,
      title: "Notify Requester of Received Request",
      active: true,
      position: 1,
      conditions: {
        all: [
          { field: "update_type", operator: "is", value: "Create" },
          { field: "comment_is_public", operator: "is", value: "true" }
        ],
        any: []
      },
      actions: [
        { field: "notification_user", value: ["requester_and_ccs", "Your request {{ticket.id}} has been received"] }
      ],
      description: "Auto-responder for newly created tickets",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-08-20T14:22:00Z"
    },
    {
      id: 36001234502,
      title: "Route VIP Tickets to Tier 2 Support",
      active: true,
      position: 2,
      conditions: {
        all: [
          { field: "status", operator: "is", value: "new" },
          { field: "current_tags", operator: "includes", value: "vip_customer" }
        ],
        any: []
      },
      actions: [
        { field: "group_id", value: 36000100002 },
        { field: "priority", value: "high" }
      ],
      description: "Priority routing for VIP accounts",
      created_at: "2024-02-10T11:30:00Z",
      updated_at: "2024-09-01T09:15:00Z"
    },
    {
      id: 36001234503,
      title: "Assign Bug Reports to Engineering Queue",
      active: true,
      position: 3,
      conditions: {
        all: [
          { field: "type", operator: "is", value: "incident" },
          { field: "custom_fields_36000200001", operator: "is", value: "software_defect" }
        ],
        any: []
      },
      actions: [
        { field: "group_id", value: 36000100003 },
        { field: "set_tags", value: "bug_reviewed" }
      ],
      description: "Route software defects directly to dev support",
      created_at: "2024-03-05T08:45:00Z",
      updated_at: "2024-07-12T16:40:00Z"
    }
  ]
};

export const mockAutomations = {
  automations: [
    {
      id: 36002234501,
      title: "Close Pending Tickets After 4 Days of Inactivity",
      active: true,
      position: 1,
      conditions: {
        all: [
          { field: "status", operator: "is", value: "pending" },
          { field: "hours_since_pending", operator: "greater_than", value: 96 }
        ],
        any: []
      },
      actions: [
        { field: "status", value: "solved" },
        { field: "notification_user", value: ["requester_id", "Ticket auto-solved due to inactivity"] }
      ],
      created_at: "2024-01-20T12:00:00Z",
      updated_at: "2024-05-18T10:10:00Z"
    },
    {
      id: 36002234502,
      title: "Escalate Unassigned Urgent Tickets After 2 Hours",
      active: true,
      position: 2,
      conditions: {
        all: [
          { field: "status", operator: "is", value: "open" },
          { field: "assignee_id", operator: "is", value: null },
          { field: "priority", operator: "is", value: "urgent" },
          { field: "hours_since_created", operator: "greater_than", value: 2 }
        ],
        any: []
      },
      actions: [
        { field: "group_id", value: 36000100002 },
        { field: "notification_group", value: [36000100002, "Urgent unassigned ticket requires attention!"] }
      ],
      created_at: "2024-02-14T15:00:00Z",
      updated_at: "2024-06-11T13:20:00Z"
    }
  ]
};

export const mockViews = {
  views: [
    {
      id: 36003234501,
      title: "Your Unsolved Tickets",
      active: true,
      default: true,
      position: 1,
      description: "Tickets assigned to current agent that need attention",
      conditions: {
        all: [
          { field: "status", operator: "less_than", value: "solved" },
          { field: "assignee_id", operator: "is", value: "current_user" }
        ],
        any: []
      },
      restriction: { type: "Group", id: 36000100001 },
      execution: {
        group_by: "priority",
        group_order: "desc",
        sort_by: "updated_at",
        sort_order: "desc",
        columns: [
          { id: "subject", title: "Subject" },
          { id: "requester", title: "Requester" },
          { id: "updated_at", title: "Updated" },
          { id: "priority", title: "Priority" }
        ]
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-01T00:00:00Z"
    },
    {
      id: 36003234502,
      title: "VIP Unassigned Tickets",
      active: true,
      default: false,
      position: 2,
      description: "High priority tickets waiting for pickup",
      conditions: {
        all: [
          { field: "status", operator: "is", value: "new" },
          { field: "current_tags", operator: "includes", value: "vip_customer" }
        ],
        any: []
      },
      restriction: { type: "Everyone" },
      execution: {
        group_by: "created_at",
        group_order: "asc",
        sort_by: "priority",
        sort_order: "desc",
        columns: [
          { id: "id", title: "ID" },
          { id: "subject", title: "Subject" },
          { id: "requester", title: "Requester" }
        ]
      },
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2024-07-01T00:00:00Z"
    }
  ]
};

export const mockOrganizations = {
  organizations: [
    {
      id: 36000300001,
      name: "Acme Global Industries",
      details: "Enterprise Tier 1 Customer",
      notes: "Dedicated CSM: Sarah Connor",
      domain_names: ["acmeglobal.com", "acme-corp.io"],
      external_id: "EXT-ORG-1001",
      group_id: 36000100002,
      shared_comments: true,
      shared_tickets: true,
      tags: ["enterprise", "sla_platinum", "us_east"],
      organization_fields: { contract_tier: "platinum", renewal_month: "October" },
      created_at: "2023-05-10T10:00:00Z",
      updated_at: "2024-08-15T14:30:00Z"
    },
    {
      id: 36000300002,
      name: "Stark Dynamics",
      details: "Innovations Partner",
      notes: "Priority 24/7 technical hotline access",
      domain_names: ["starkdynamics.com"],
      external_id: "EXT-ORG-1002",
      group_id: 36000100001,
      shared_comments: true,
      shared_tickets: false,
      tags: ["vip_customer", "innovations"],
      organization_fields: { contract_tier: "gold" },
      created_at: "2023-07-22T08:15:00Z",
      updated_at: "2024-06-19T11:45:00Z"
    }
  ]
};

export const mockAgents = {
  users: [
    {
      id: 36000400001,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      role: "admin",
      role_type: 1,
      custom_role_id: null,
      active: true,
      suspended: false,
      restricted_agent: false,
      alias: "Alice Support Lead",
      details: "Lead Support Operations",
      notes: "Shift: EMEA morning",
      phone: "+1-555-0192",
      time_zone: "UTC",
      locale: "en-US",
      organization_id: 36000300001,
      default_group_id: 36000100001,
      group_ids: [36000100001, 36000100002],
      agent_brand_ids: [36000900001],
      tags: ["lead", "admin_ops"],
      user_fields: { department: "Global Operations" },
      created_at: "2023-01-10T09:00:00Z",
      updated_at: "2024-08-01T10:00:00Z",
      last_login_at: "2024-09-18T08:30:00Z",
      verified: true
    },
    {
      id: 36000400002,
      name: "Bob Ramirez",
      email: "bob.ramirez@example.com",
      role: "agent",
      role_type: 2,
      custom_role_id: 36000700001,
      active: true,
      suspended: false,
      restricted_agent: false,
      alias: "Bob Tech Support",
      details: "Senior Escalation Engineer",
      notes: "Hardware specialist",
      phone: "+1-555-0193",
      time_zone: "America/New_York",
      locale: "en-US",
      organization_id: null,
      default_group_id: 36000100002,
      group_ids: [36000100002, 36000100003],
      agent_brand_ids: [36000900001],
      tags: ["tier_2", "escalation"],
      user_fields: { department: "Engineering Support" },
      created_at: "2023-03-15T11:00:00Z",
      updated_at: "2024-07-20T14:15:00Z",
      last_login_at: "2024-09-17T17:45:00Z",
      verified: true
    }
  ]
};

export const mockGroups = {
  groups: [
    {
      id: 36000100001,
      name: "Tier 1 Customer Care",
      description: "Frontline triage and primary ticket resolution team",
      default: true,
      is_public: true,
      deleted: false,
      agent_count: 18,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-05-01T00:00:00Z"
    },
    {
      id: 36000100002,
      name: "Tier 2 Technical Support",
      description: "Advanced escalation and technical issue investigations",
      default: false,
      is_public: true,
      deleted: false,
      agent_count: 8,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-06-01T00:00:00Z"
    },
    {
      id: 36000100003,
      name: "Engineering Defect Queue",
      description: "Direct bridge to software engineering for verified defects",
      default: false,
      is_public: false,
      deleted: false,
      agent_count: 5,
      created_at: "2023-02-01T00:00:00Z",
      updated_at: "2024-07-01T00:00:00Z"
    }
  ]
};

export const mockMacros = {
  macros: [
    {
      id: 36000500001,
      title: "Request Log Files from Customer",
      description: "Sends detailed instructions for generating diagnostic archive",
      active: true,
      default: false,
      actions: [
        { field: "comment_mode_is_public", value: "true" },
        { field: "comment_value", value: "Hi {{ticket.requester.first_name}},\nPlease attach your diagnostic logs from Help > Export Logs." },
        { field: "status", value: "pending" },
        { field: "current_tags", value: ["awaiting_logs"] }
      ],
      restriction: { type: "Everyone" },
      created_at: "2023-06-10T10:00:00Z",
      updated_at: "2024-08-10T12:00:00Z"
    },
    {
      id: 36000500002,
      title: "Escalate to Tier 2 with Internal Note",
      description: "Assigns to Tier 2 and sets status to open",
      active: true,
      default: false,
      actions: [
        { field: "group_id", value: 36000100002 },
        { field: "status", value: "open" },
        { field: "comment_mode_is_public", value: "false" },
        { field: "comment_value", value: "Tier 1 checklist verified. Escalating for deep-dive analysis." }
      ],
      restriction: { type: "Group", id: 36000100001 },
      created_at: "2023-07-01T14:30:00Z",
      updated_at: "2024-07-25T11:00:00Z"
    }
  ]
};

export const mockTicketFields = {
  ticket_fields: [
    {
      id: 36000200001,
      title: "Issue Category",
      type: "tagger",
      active: true,
      description: "Classification of customer problem",
      agent_description: "Select closest root domain",
      title_in_portal: "What is this issue related to?",
      visible_in_portal: true,
      editable_in_portal: true,
      required: true,
      required_in_portal: true,
      agent_can_edit: true,
      collapsed_for_agents: false,
      position: 1,
      tag: "category_classified",
      regexp_for_validation: null,
      custom_field_options: [
        { id: 1, name: "Software Defect / Bug", value: "software_defect", default: false },
        { id: 2, name: "Billing & Invoicing", value: "billing_inquiry", default: false },
        { id: 3, name: "Feature Request", value: "feature_request", default: false },
        { id: 4, name: "General Question", value: "general_inquiry", default: true }
      ],
      relationship_target_type: null,
      relationship_filter: null,
      creator_app_name: "Admin Center",
      created_at: "2023-01-10T10:00:00Z",
      updated_at: "2024-04-12T15:00:00Z"
    },
    {
      id: 36000200002,
      title: "Customer System OS",
      type: "text",
      active: true,
      description: "Client operating system and build number",
      agent_description: "E.g. Windows 11 23H2 or macOS Sonoma",
      title_in_portal: "Operating System",
      visible_in_portal: true,
      editable_in_portal: true,
      required: false,
      required_in_portal: false,
      agent_can_edit: true,
      collapsed_for_agents: false,
      position: 2,
      tag: null,
      regexp_for_validation: "^[A-Za-z0-9 ._-]{3,50}$",
      custom_field_options: [],
      relationship_target_type: null,
      relationship_filter: null,
      creator_app_name: "Admin Center",
      created_at: "2023-02-15T09:00:00Z",
      updated_at: "2024-03-20T11:30:00Z"
    }
  ]
};

export const mockSchedules = {
  schedules: [
    {
      id: 36000600001,
      name: "Global Support Business Hours (US East)",
      time_zone: "America/New_York",
      intervals: [
        // Monday: 09:00 (1440 + 540 = 1980) to 17:00 (1440 + 1020 = 2460)
        { start_time: 1980, end_time: 2460 },
        // Tuesday: 09:00 (2880 + 540 = 3420) to 17:00 (2880 + 1020 = 3900)
        { start_time: 3420, end_time: 3900 },
        // Wednesday: 09:00 (4320 + 540 = 4860) to 17:00 (4320 + 1020 = 5340)
        { start_time: 4860, end_time: 5340 },
        // Thursday: 09:00 (5760 + 540 = 6300) to 17:00 (5760 + 1020 = 6780)
        { start_time: 6300, end_time: 6780 },
        // Friday: 09:00 (7200 + 540 = 7740) to 17:00 (7200 + 1020 = 8220)
        { start_time: 7740, end_time: 8220 }
      ],
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z"
    }
  ]
};

export const mockSupportAddresses = {
  recipient_addresses: [
    {
      id: 36000800001,
      name: "Main Support Helpdesk",
      email: "support@example.com",
      brand_id: 36000900001,
      default: true,
      forwarding_status: "verified",
      spf_status: "verified",
      cname_status: "verified",
      dns_results: "pass",
      domain_verification_status: "verified",
      created_at: "2022-11-01T12:00:00Z",
      updated_at: "2024-03-01T10:00:00Z"
    },
    {
      id: 36000800002,
      name: "VIP Escalation Desk",
      email: "vip-escalations@example.com",
      brand_id: 36000900001,
      default: false,
      forwarding_status: "verified",
      spf_status: "verified",
      cname_status: "verified",
      dns_results: "pass",
      domain_verification_status: "verified",
      created_at: "2023-04-10T14:00:00Z",
      updated_at: "2024-02-12T09:30:00Z"
    }
  ]
};

export const mockTicketForms = {
  ticket_forms: [
    {
      id: 36001000001,
      name: "Standard Support Request",
      display_name: "Submit a Support Ticket",
      active: true,
      default: true,
      position: 1,
      end_user_visible: true,
      in_all_brands: true,
      restricted_brand_ids: [],
      ticket_field_ids: [36000200001, 36000200002],
      agent_conditions: [],
      end_user_conditions: [],
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-05-10T11:00:00Z"
    },
    {
      id: 36001000002,
      name: "Bug Report Form",
      display_name: "Report a Product Bug",
      active: true,
      default: false,
      position: 2,
      end_user_visible: true,
      in_all_brands: true,
      restricted_brand_ids: [],
      ticket_field_ids: [36000200001, 36000200002],
      agent_conditions: [],
      end_user_conditions: [],
      created_at: "2023-02-15T12:00:00Z",
      updated_at: "2024-06-20T14:30:00Z"
    }
  ]
};

export const mockSLAs = {
  sla_policies: [
    {
      id: 36001100001,
      title: "Platinum Customer SLA",
      description: "Strictest response targets for Enterprise Platinum tier",
      position: 1,
      filter: {
        all: [
          { field: "current_tags", operator: "includes", value: "sla_platinum" }
        ],
        any: []
      },
      policy_metrics: [
        { priority: "urgent", metric: "first_reply_time", target: 15, business_hours: false },
        { priority: "high", metric: "first_reply_time", target: 60, business_hours: true },
        { priority: "normal", metric: "first_reply_time", target: 120, business_hours: true },
        { priority: "urgent", metric: "requester_wait_time", target: 120, business_hours: false }
      ],
      created_at: "2023-03-01T10:00:00Z",
      updated_at: "2024-08-01T09:00:00Z"
    },
    {
      id: 36001100002,
      title: "Standard Support SLA",
      description: "Baseline SLA targets for all customers",
      position: 2,
      filter: {
        all: [],
        any: []
      },
      policy_metrics: [
        { priority: "urgent", metric: "first_reply_time", target: 60, business_hours: true },
        { priority: "high", metric: "first_reply_time", target: 240, business_hours: true },
        { priority: "normal", metric: "first_reply_time", target: 480, business_hours: true },
        { priority: "low", metric: "first_reply_time", target: 1440, business_hours: true }
      ],
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-04-10T15:30:00Z"
    }
  ]
};

export const mockGroupSLAs = {
  group_sla_policies: [
    {
      id: 36001200001,
      title: "Tier 2 Escalation Group SLA",
      description: "Internal ownership handover deadlines for Tier 2",
      position: 1,
      filter: {
        all: [
          { field: "group_id", operator: "is", value: 36000100002 }
        ],
        any: []
      },
      policy_metrics: [
        { priority: "urgent", metric: "group_ownership_time", target: 30, business_hours: true },
        { priority: "high", metric: "group_ownership_time", target: 60, business_hours: true },
        { priority: "normal", metric: "group_ownership_time", target: 180, business_hours: true }
      ],
      created_at: "2023-06-01T10:00:00Z",
      updated_at: "2024-07-15T11:20:00Z"
    }
  ]
};

export const mockBrands = {
  brands: [
    {
      id: 36000900001,
      name: "Main Corporate Brand",
      has_help_center: true,
      subdomain: "example-corp"
    }
  ]
};
