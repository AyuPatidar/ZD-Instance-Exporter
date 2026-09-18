export interface ZendeskCondition {
  field: string;
  operator: string;
  value: string | number | boolean | null | (string | number)[];
}

export interface ZendeskConditions {
  all?: ZendeskCondition[];
  any?: ZendeskCondition[];
}

export interface ZendeskAction {
  field: string;
  value: any;
}

export interface ZendeskCursorMeta {
  has_more?: boolean;
  after_cursor?: string | null;
  before_cursor?: string | null;
}

export interface ZendeskLinks {
  next?: string | null;
  prev?: string | null;
}

export interface PaginatedResponse<T = any> {
  [key: string]: any;
  items?: T[];
  meta?: ZendeskCursorMeta;
  links?: ZendeskLinks;
  next_page?: string | null;
  previous_page?: string | null;
  count?: number;
}
