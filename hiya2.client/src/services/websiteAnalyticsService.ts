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

export interface VisitorExtendedSummaryResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  activeUsers: number;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  eventCount: number;
  averageEngagementTimeSeconds: number;
}

export interface VisitorExtendedSummary {
  activeUsers: number;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  sessions: number;
  eventCount: number;
  averageEngagementTimeSeconds: number;
}

export interface VisitorExtendedSummaryWithPreviousResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  current: VisitorExtendedSummary;
  previous: VisitorExtendedSummary;
}

export interface SessionChannel {
  channel: string;
  sessions: number;
  percentage: number;
}

export interface SessionChannelsResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  channels: SessionChannel[];
  totalSessions: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  activeUsers: number;
}

export interface TrafficSourcesResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  sources: TrafficSource[];
}

export interface VisitorDay {
  date: string; // yyyy-MM-dd
  activeUsers: number;
}

export interface VisitorHour {
  hour: number; // 0-23, India time
  activeUsers: number;
  /** Today only: Google Analytics has not processed this hour yet (0 means "unknown", not "no visitors"). */
  pending?: boolean;
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
  pageTitle: string;
  views: number;
  activeUsers: number;
  averageEngagementTimeSeconds: number;
}

export interface GeoLocationItem {
  name: string;
  activeUsers: number;
}

export interface GeoResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  countries: GeoLocationItem[];
  cities: GeoLocationItem[];
}

export interface DeviceCategoryItem {
  category: string;
  activeUsers: number;
  percentage: number;
}

export interface DeviceResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  categories: DeviceCategoryItem[];
  totalUsers: number;
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

  // Visits that came from AI assistants (a link to hiyaghar.com clicked inside ChatGPT etc.).
  static getAiReferrals(range: VisitorRange) {
    return getJson<AiReferralsResponse>('ai-referrals', rangeQuery(range));
  }

  // Extended summary metrics for Website Analytics page.
  static getExtendedSummary(range: VisitorRange) {
    return getJson<VisitorExtendedSummaryResponse>('extended-summary', rangeQuery(range));
  }

  // All extended metrics with current and previous period data for comparison.
  static getAllMetricsWithPrevious(range: VisitorRange) {
    return getJson<VisitorExtendedSummaryWithPreviousResponse>('all-metrics-with-previous', rangeQuery(range));
  }

  // Sessions by channel grouping.
  static getSessionChannels(range: VisitorRange) {
    return getJson<SessionChannelsResponse>('session-channels', rangeQuery(range));
  }

  // Top traffic sources.
  static getTopTrafficSources(range: VisitorRange, top: number = 10) {
    const params = rangeQuery(range);
    params.set('top', String(top));
    return getJson<TrafficSourcesResponse>('top-traffic-sources', params);
  }

  // Visitors by Country and City (top 10 each).
  static getGeoReport(range: VisitorRange, top: number = 10) {
    const params = rangeQuery(range);
    params.set('top', String(top));
    return getJson<GeoResponse>('geo', params);
  }

  // Device category breakdown (Desktop, Mobile, Tablet).
  static getDeviceReport(range: VisitorRange) {
    return getJson<DeviceResponse>('devices', rangeQuery(range));
  }

  // People on the website right now (Google Analytics Realtime, last 30 minutes).
  static getRealtime() {
    return getJson<RealtimeResponse>('realtime', new URLSearchParams());
  }
}

export interface RealtimeItem {
  name: string;
  activeUsers: number;
}

export interface RealtimeResponse {
  isSuccess: boolean;
  activeUsers30Min: number;
  activeUsers5Min: number;
  pageViews30Min: number;
  /** 30 values, oldest first; the last one is the current minute. */
  perMinute: number[];
  pages: RealtimeItem[];
  countries: RealtimeItem[];
  cities: RealtimeItem[];
  devices: RealtimeItem[];
  fetchedAtUtc: string;
}

export interface AiReferral {
  tool: string; // ChatGPT, Perplexity, Gemini, Copilot, Claude
  sessions: number;
  activeUsers: number;
}

export interface AiReferralsResponse {
  isSuccess: boolean;
  rangeType: VisitorRangeType;
  startDate: string;
  endDate: string;
  tools: AiReferral[];
  totalSessions: number;
  /** Users counted once across all AI assistants. */
  totalUsers: number;
}
