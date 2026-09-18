export interface ZAFClientRequestOptions {
  url: string;
  type?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  dataType?: 'json' | 'text' | 'xml';
  contentType?: string;
  data?: any;
  cache?: boolean;
  cors?: boolean;
  httpCompleteResponse?: boolean;
}

export interface ZAFClientContext {
  account?: {
    subdomain?: string;
  };
  product?: string;
  location?: string;
  instanceGuid?: string;
}

export interface ZAFClientResponse<T = any> {
  status: number;
  responseJSON: T;
  responseText: string;
  headers?: Record<string, string>;
}

export interface ZAFClientInstance {
  invoke(name: string, ...args: any[]): Promise<any>;
  get(name: string | string[]): Promise<any>;
  set(name: string, value: any): Promise<any>;
  request<T = any>(options: ZAFClientRequestOptions): Promise<T>;
  on(name: string, handler: (...args: any[]) => void): void;
  metadata(): Promise<any>;
  context(): Promise<ZAFClientContext>;
}

declare global {
  interface Window {
    ZAFClient?: {
      init(): ZAFClientInstance;
    };
  }
}
