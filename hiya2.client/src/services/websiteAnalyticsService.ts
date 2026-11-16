import { AdminAuthService } from './adminAuthService';

// Website visitor numbers (Google Analytics, HiyaGhar web stream only). The browser only talks to
// our own server (/api/websiteanalytics); the server queries Google.

export type VisitorRangePreset = 'today' | 'yesterday' | 7 | 14 | 30;

// Which range the server answered for ("dates" = 7 / 14 / 30 days or custom dates).
export type VisitorRangeType = 'today' | 'yesterday' | 'dates';

// Either a preset (today, yesterday, or the last 7 / 14 / 30 days including today) or a custom
// yyyy-MM-dd range.
export type VisitorRange =
  | { preset: VisitorRangePreset }
  | { startDate: string; endDate: string };

export interface VisitorSummaryResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  activeUsers: number;
  pageViews: number;
}

export interface VisitorDay {
  date: string; // yyyy-MM-dd
  activeUsers: number;
}

export interface VisitorHour {
  hour: number; // 0-23, India time
  activeUsers: number;
}

// Today / yesterday come back per hour ("hours"); every other range per day ("days").
export interface VisitorDailyResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  granularity: 'day' | 'hour';
  startDate: string;
  endDate: string;
  days?: VisitorDay[];
  hours?: VisitorHour[];
}

export interface VisitorPage {
  pagePath: string;
  views: number;
  activeUsers: number;
}

export interface VisitorPagesResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  pages: VisitorPage[];
}

export interface AnalyticsApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE = '/api/websiteanalytics';

function rangeQuery(range: VisitorRange): URLSearchParams {
  const params = new URLSearchParams();
  if ('preset' in range) {
    params.set('range', String(range.preset));
  } else {
    params.set('startDate', range.startDate);
    params.set('endDate', range.endDate);
  }
  return params;
}

async function getJson<T>(path: string, params: URLSearchParams): Promise<AnalyticsApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}/${path}?${params.toString()}`, {
      headers: AdminAuthService.getAuthHeaders(),
    });
    if (res.status === 401) {
      return { success: false, message: 'Your admin session has expired. Please log in again.' };
    }
    if (res.status === 403) {
      return { success: false, message: 'You do not have access to website analytics.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.isSuccess) {
      return { success: false, message: data?.message || 'Could not load website analytics right now.' };
    }
    return { success: true, data: data as T };
  } catch {
    return { success: false, message: 'Could not reach the server to load website analytics.' };
  }
}

export class WebsiteAnalyticsService {
  static getSummary(range: VisitorRange) {
    return getJson<VisitorSummaryResponse>('summary', rangeQuery(range));
  }

  static getDaily(range: VisitorRange) {
    return getJson<VisitorDailyResponse>('daily', rangeQuery(range));
  }

  // top: only the N most viewed pages; leave out for every page.
  static getPages(range: VisitorRange, top?: number) {
    const params = rangeQuery(range);
    if (top) params.set('top', String(top));
    return getJson<VisitorPagesResponse>('pages', params);
  }
}
