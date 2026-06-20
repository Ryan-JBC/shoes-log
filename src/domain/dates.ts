export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isNotFuture(s: string, today: string): boolean {
  // ISO 'YYYY-MM-DD' 문자열은 사전식 비교가 날짜 순서와 일치
  return s <= today;
}

export function daysSince(fromDate: string, today: string): number | null {
  if (!isValidISODate(fromDate) || !isValidISODate(today)) return null;
  const toUTC = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(today) - toUTC(fromDate)) / 86_400_000);
}
