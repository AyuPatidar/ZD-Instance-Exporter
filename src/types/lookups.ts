export interface TicketFieldLookup {
  id: number;
  title: string;
  type: string;
  options?: Map<string, string>; // value -> name
}

export interface ZendeskLookups {
  groups: Map<number, string>;
  users: Map<number, string>;
  organizations: Map<number, string>;
  ticketFields: Map<number, TicketFieldLookup>;
  forms: Map<number, string>;
  brands: Map<number, string>;
}

export function createEmptyLookups(): ZendeskLookups {
  return {
    groups: new Map(),
    users: new Map(),
    organizations: new Map(),
    ticketFields: new Map(),
    forms: new Map(),
    brands: new Map(),
  };
}
