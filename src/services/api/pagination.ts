import { zendeskRequest } from './zendeskRequest';
import { PaginatedResponse } from '../../types/common';

function toRelativeZendeskUrl(urlStr?: string | null): string | null {
  if (!urlStr) return null;
  try {
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      const parsed = new URL(urlStr);
      return parsed.pathname + parsed.search;
    }
  } catch {
    // Fall back to original string
  }
  return urlStr;
}

export async function fetchAllPages<T>(
  initialUrl: string,
  resourceKey: string,
  onProgress?: (count: number) => void
): Promise<T[]> {
  const allRecords: T[] = [];
  let nextUrl: string | null = toRelativeZendeskUrl(initialUrl);

  while (nextUrl) {
    const currentUrl: string = nextUrl;
    const response: PaginatedResponse<T> = await zendeskRequest<PaginatedResponse<T>>({
      url: currentUrl,
      type: 'GET',
    });

    const pageRecords = (response && (response as any)[resourceKey]) || [];
    if (Array.isArray(pageRecords)) {
      allRecords.push(...pageRecords);
      if (onProgress) {
        onProgress(allRecords.length);
      }
    }

    // Determine next page URL
    // 1. Cursor pagination via links.next or meta.has_more + meta.after_cursor
    if (response.meta && typeof response.meta.has_more === 'boolean') {
      if (response.meta.has_more && response.links?.next) {
        nextUrl = toRelativeZendeskUrl(response.links.next);
      } else if (response.meta.has_more && response.meta.after_cursor) {
        const urlObj: URL = new URL(currentUrl, 'https://localhost');
        urlObj.searchParams.set('page[after]', response.meta.after_cursor);
        nextUrl = urlObj.pathname + urlObj.search;
      } else {
        nextUrl = null;
      }
    } else if (response.next_page) {
      // 2. Offset / URL based pagination (e.g. next_page)
      nextUrl = toRelativeZendeskUrl(response.next_page);
    } else if (response.links?.next) {
      nextUrl = toRelativeZendeskUrl(response.links.next);
    } else {
      nextUrl = null;
    }

    // Safeguard: if page returned 0 records even with nextUrl, prevent infinite loop
    if (pageRecords.length === 0) {
      break;
    }
  }

  return allRecords;
}
