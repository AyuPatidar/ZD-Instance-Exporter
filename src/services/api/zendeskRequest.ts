import { zafClient } from '../zaf/zafClient';
import { ZAFClientRequestOptions } from '../../types/zaf';

export class ZendeskApiError extends Error {
  status: number;
  responseJSON?: any;
  endpoint: string;
  isPermissionError: boolean;
  isRateLimitError: boolean;

  constructor(status: number, message: string, endpoint: string, responseJSON?: any) {
    super(message);
    this.name = 'ZendeskApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.responseJSON = responseJSON;
    this.isPermissionError = status === 403 || status === 401;
    this.isRateLimitError = status === 429;
  }
}

// Central concurrency queue
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const waitingQueue: Array<() => void> = [];

async function acquireRequestSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }

  return new Promise<void>(resolve => {
    waitingQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseRequestSlot(): void {
  activeRequests--;
  if (waitingQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const next = waitingQueue.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function zendeskRequest<T>(
  options: ZAFClientRequestOptions,
  maxRetries = 3
): Promise<T> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    await acquireRequestSlot();
    try {
      const response = await zafClient.request<T>({
        ...options,
        dataType: 'json',
      });
      return response;
    } catch (err: any) {
      const status = err?.status || err?.responseJSON?.status || 500;
      const headers = err?.headers || {};
      const endpoint = options.url;

      // Handle 429 Rate Limit
      if (status === 429 && attempt < maxRetries) {
        attempt++;
        const retryAfterHeader = headers['retry-after'] || headers['Retry-After'];
        let waitSeconds = 2 * attempt;
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsedSeconds)) {
            waitSeconds = Math.max(parsedSeconds, 1);
          }
        }
        console.warn(`[Zendesk API 429] Rate limit reached on ${endpoint}. Retrying in ${waitSeconds}s (attempt ${attempt}/${maxRetries})...`);
        releaseRequestSlot();
        await sleep(waitSeconds * 1000);
        continue;
      }

      // Format clean user-facing error message
      let friendlyMessage = `Zendesk API error (${status}) on ${endpoint}`;
      if (status === 401) {
        friendlyMessage = 'Authentication failed. Please re-authenticate your Zendesk session.';
      } else if (status === 403) {
        friendlyMessage = `Zendesk returned 403 Forbidden. Your account or current agent role may lack permissions for this resource or the feature is not enabled on your plan.`;
      } else if (status === 404) {
        friendlyMessage = `Resource not found on ${endpoint}.`;
      } else if (status === 429) {
        friendlyMessage = 'Rate limit exceeded. Too many requests were sent to Zendesk.';
      } else if (err?.responseJSON?.description) {
        friendlyMessage = err.responseJSON.description;
      } else if (err?.responseJSON?.error) {
        friendlyMessage = typeof err.responseJSON.error === 'string' ? err.responseJSON.error : JSON.stringify(err.responseJSON.error);
      } else if (err?.message) {
        friendlyMessage = err.message;
      }

      throw new ZendeskApiError(status, friendlyMessage, endpoint, err?.responseJSON);
    } finally {
      releaseRequestSlot();
    }
  }

  throw new ZendeskApiError(500, 'Max request retries exceeded', options.url);
}
