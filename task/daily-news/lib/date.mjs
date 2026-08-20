export const DEFAULT_NEWS_TZ = 'Asia/Shanghai';

export function todayInTimeZone(now = new Date(), timeZone = DEFAULT_NEWS_TZ) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function assertNewsDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`NEWS_DATE must be YYYY-MM-DD, got: ${value}`);
  }
  return value;
}
