import { ZAFClientInstance, ZAFClientRequestOptions, ZAFClientContext } from '../../types/zaf';
import {
  mockTriggers,
  mockAutomations,
  mockViews,
  mockOrganizations,
  mockAgents,
  mockGroups,
  mockMacros,
  mockTicketFields,
  mockSchedules,
  mockSupportAddresses,
  mockTicketForms,
  mockSLAs,
  mockGroupSLAs,
  mockBrands,
} from './mockData';

class MockZAFClient implements ZAFClientInstance {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  async invoke(_name: string, ..._args: any[]): Promise<any> {
    return { success: true };
  }

  async get(_name: string | string[]): Promise<any> {
    return {};
  }

  async set(_name: string, _value: any): Promise<any> {
    return {};
  }

  async metadata(): Promise<any> {
    return { appTitle: 'Zendesk Configuration Exporter', version: '1.0.0' };
  }

  async context(): Promise<ZAFClientContext> {
    return {
      account: {
        subdomain: 'demo-enterprise',
      },
      product: 'support',
      location: 'nav_bar',
      instanceGuid: 'mock-instance-guid-12345',
    };
  }

  on(name: string, handler: (...args: any[]) => void): void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(handler);
  }

  async request<T = any>(options: ZAFClientRequestOptions): Promise<T> {
    const url = options.url || '';
    // Simulate brief network latency for realistic feel
    await new Promise(resolve => setTimeout(resolve, 80));

    if (url.includes('/api/v2/triggers')) {
      return mockTriggers as unknown as T;
    }
    if (url.includes('/api/v2/automations')) {
      return mockAutomations as unknown as T;
    }
    if (url.includes('/api/v2/views')) {
      return mockViews as unknown as T;
    }
    if (url.includes('/api/v2/organizations')) {
      return mockOrganizations as unknown as T;
    }
    if (url.includes('/api/v2/users')) {
      return mockAgents as unknown as T;
    }
    if (url.includes('/api/v2/groups')) {
      return mockGroups as unknown as T;
    }
    if (url.includes('/api/v2/macros')) {
      return mockMacros as unknown as T;
    }
    if (url.includes('/api/v2/ticket_fields')) {
      return mockTicketFields as unknown as T;
    }
    if (url.includes('/api/v2/business_hours/schedules')) {
      return mockSchedules as unknown as T;
    }
    if (url.includes('/api/v2/recipient_addresses')) {
      return mockSupportAddresses as unknown as T;
    }
    if (url.includes('/api/v2/ticket_forms')) {
      return mockTicketForms as unknown as T;
    }
    if (url.includes('/api/v2/slas/policies')) {
      return mockSLAs as unknown as T;
    }
    if (url.includes('/api/v2/group_slas/policies')) {
      return mockGroupSLAs as unknown as T;
    }
    if (url.includes('/api/v2/brands')) {
      return mockBrands as unknown as T;
    }

    console.warn(`[MockZAFClient] Unhandled URL: ${url}`);
    return {} as T;
  }
}

let realClientInstance: ZAFClientInstance | null = null;
const mockClientInstance = new MockZAFClient();

export function getZAFClient(): ZAFClientInstance {
  if (!realClientInstance && typeof window !== 'undefined' && window.ZAFClient) {
    try {
      const client = window.ZAFClient.init();
      if (client && typeof client.request === 'function') {
        realClientInstance = client;
      }
    } catch (err) {
      console.warn('[ZAF] Failed to initialize native ZAFClient, falling back to mock:', err);
    }
  }
  return realClientInstance || mockClientInstance;
}

export function isUsingLiveZAF(): boolean {
  if (typeof window === 'undefined' || !window.ZAFClient) return false;
  getZAFClient();
  return !!realClientInstance;
}

export const zafClient: ZAFClientInstance = new Proxy({} as ZAFClientInstance, {
  get(_target, prop: string | symbol) {
    const active = getZAFClient();
    const value = (active as any)[prop];
    return typeof value === 'function' ? value.bind(active) : value;
  },
});

export const isStandaloneDevMode = typeof window === 'undefined' || !window.ZAFClient;

