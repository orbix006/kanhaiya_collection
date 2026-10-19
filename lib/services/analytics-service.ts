/**
 * Local Analytics Service for Kanhaiya Collection Administrative Dashboard
 * 
 * Provides:
 * 1. Local preview tracking: captures preview visits in localStorage during development.
 * 2. Deterministic demo history: generates realistic, deterministic daily traffic metrics
 *    when third-party analytics / Supabase are not connected.
 * 3. Month-by-month navigation and analytics summarization.
 * 
 * CRITICAL:
 * - This service strictly operates in offline/local mode.
 * - Does not connect to external analytics or Supabase.
 * - Explicitly tags all simulated counts as demo data.
 */

export interface DailyVisitorMetric {
  date: string; // ISO date string "YYYY-MM-DD"
  day: number; // 1..31
  dayOfWeek: string; // "Sun", "Mon", "Tue", ...
  formattedDate: string; // "Oct 1"
  visitors: number;
  uniqueVisitors: number;
  pageViews: number;
  isSimulated: boolean;
  localPreviewVisits: number;
}

export interface MonthlyAnalyticsSummary {
  year: number;
  month: number; // 1..12
  monthLabel: string; // e.g. "October 2026"
  daysInMonth: number;
  dailyMetrics: DailyVisitorMetric[];
  totalVisitors: number;
  totalUniqueVisitors: number;
  totalPageViews: number;
  avgDailyVisitors: number;
  peakDay: {
    day: number;
    date: string;
    formattedDate: string;
    visitors: number;
  };
  isSimulated: boolean;
  totalLocalPreviewVisits: number;
}

const LOCAL_ANALYTICS_STORAGE_KEY = "kanhaiya_preview_analytics_v1";

interface LocalTrackingStore {
  dailyVisits: Record<string, number>; // "YYYY-MM-DD" -> count
  totalRecorded: number;
  lastVisitAt?: string;
  lastVisitedPath?: string;
}

/**
 * Reads local preview tracking hits recorded in this browser
 */
function getLocalTrackingStore(): LocalTrackingStore {
  if (typeof window === "undefined") {
    return { dailyVisits: {}, totalRecorded: 0 };
  }
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_STORAGE_KEY);
    if (!raw) return { dailyVisits: {}, totalRecorded: 0 };
    return JSON.parse(raw);
  } catch {
    return { dailyVisits: {}, totalRecorded: 0 };
  }
}

/**
 * Records a development preview visit for the current date
 */
export function recordPreviewVisit(path: string = "/"): void {
  if (typeof window === "undefined") return;
  try {
    const store = getLocalTrackingStore();
    const today = new Date().toISOString().split("T")[0];
    store.dailyVisits[today] = (store.dailyVisits[today] || 0) + 1;
    store.totalRecorded = (store.totalRecorded || 0) + 1;
    store.lastVisitAt = new Date().toISOString();
    store.lastVisitedPath = path;
    localStorage.setItem(LOCAL_ANALYTICS_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("[AnalyticsService] Unable to record preview visit in localStorage:", err);
  }
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 * Ensures reproducible, non-flickering values for any date.
 */
function deterministicPRNG(seed: number): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Computes monthly analytics data with deterministic demo patterns
 * and blends in any real preview visits recorded in localStorage.
 * 
 * @param year e.g. 2026
 * @param month 1..12 (1 = January, 10 = October)
 */
export function getMonthlyAnalytics(year: number, month: number): MonthlyAnalyticsSummary {
  const daysInMonth = new Date(year, month, 0).getDate();
  const localStore = getLocalTrackingStore();

  const dailyMetrics: DailyVisitorMetric[] = [];
  let totalVisitors = 0;
  let totalUniqueVisitors = 0;
  let totalPageViews = 0;
  let peakDay = { day: 1, date: "", formattedDate: "", visitors: 0 };
  let totalLocalPreviewVisits = 0;

  const monthShort = MONTH_NAMES[month - 1].slice(0, 3);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeek = DAY_NAMES[dayOfWeekIndex];
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const formattedDate = `${monthShort} ${day}`;

    // Seed depends strictly on Year, Month, Day for determinism
    const seed = year * 100000 + month * 1000 + day * 13;
    const rand1 = deterministicPRNG(seed);
    const rand2 = deterministicPRNG(seed + 99);
    const rand3 = deterministicPRNG(seed + 199);

    // Baseline spiritual ecommerce traffic (420 - 780 visitors)
    let baseVisitors = 420 + Math.floor(rand1 * 360);

    // Weekend uplift: Saturday & Sunday pooja shopping surges by 25-45%
    if (dayOfWeekIndex === 0 || dayOfWeekIndex === 6) {
      baseVisitors = Math.round(baseVisitors * (1.28 + rand2 * 0.18));
    }

    // Mid-month auspicious festival spike (e.g. Navratri / Diwali / Ekadashi period, days 16-22)
    if (day >= 16 && day <= 22) {
      baseVisitors = Math.round(baseVisitors * (1.35 + rand3 * 0.25));
    }

    // Blend in any actual local preview visits recorded for this day
    const localHits = localStore.dailyVisits[dateStr] || 0;
    totalLocalPreviewVisits += localHits;
    const dayVisitors = baseVisitors + localHits;

    const uniqueVisitors = Math.round(dayVisitors * (0.68 + rand2 * 0.16));
    const pageViews = Math.round(dayVisitors * (3.1 + rand3 * 1.8));

    totalVisitors += dayVisitors;
    totalUniqueVisitors += uniqueVisitors;
    totalPageViews += pageViews;

    if (dayVisitors > peakDay.visitors) {
      peakDay = {
        day,
        date: dateStr,
        formattedDate,
        visitors: dayVisitors,
      };
    }

    dailyMetrics.push({
      date: dateStr,
      day,
      dayOfWeek,
      formattedDate,
      visitors: dayVisitors,
      uniqueVisitors,
      pageViews,
      isSimulated: true,
      localPreviewVisits: localHits,
    });
  }

  const avgDailyVisitors = Math.round(totalVisitors / daysInMonth);

  return {
    year,
    month,
    monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
    daysInMonth,
    dailyMetrics,
    totalVisitors,
    totalUniqueVisitors,
    totalPageViews,
    avgDailyVisitors,
    peakDay,
    isSimulated: true,
    totalLocalPreviewVisits,
  };
}

/**
 * Calculates previous or next month parameters
 */
export function getAdjacentMonth(
  year: number,
  month: number,
  delta: -1 | 1
): { year: number; month: number } {
  let nextMonth = month + delta;
  let nextYear = year;

  if (nextMonth < 1) {
    nextMonth = 12;
    nextYear -= 1;
  } else if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return { year: nextYear, month: nextMonth };
}

/**
 * Returns available recent months for the selector dropdown
 */
export function getAvailableMonths(
  anchorYear: number = 2026,
  anchorMonth: number = 10,
  count: number = 12
): Array<{ year: number; month: number; label: string }> {
  const result: Array<{ year: number; month: number; label: string }> = [];

  let currentYear = anchorYear;
  let currentMonth = anchorMonth;

  for (let i = 0; i < count; i++) {
    result.push({
      year: currentYear,
      month: currentMonth,
      label: `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`,
    });

    const prev = getAdjacentMonth(currentYear, currentMonth, -1);
    currentYear = prev.year;
    currentMonth = prev.month;
  }

  return result;
}
