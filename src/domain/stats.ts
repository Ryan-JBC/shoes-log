export type RangeKind = 'month' | 'year' | 'all' | 'custom';

export interface StatLogInput {
  shoe_id: number;
  date: string;
  distance: number | null;
}
export interface StatShoeInput {
  id: number;
  name: string;
}
export interface StatsResult {
  totalDistance: number;
  totalWears: number;
  mostWorn: { name: string; count: number } | null;
  perShoe: { name: string; distance: number }[];
  monthly: { month: string; distance: number }[];
}

export function rangeFor(
  kind: RangeKind,
  today: string,
  custom?: { start: string; end: string },
): { start: string; end: string } {
  if (kind === 'all') return { start: '0000-01-01', end: '9999-12-31' };
  if (kind === 'custom') return custom ?? { start: today, end: today };
  if (kind === 'year') return { start: `${today.slice(0, 4)}-01-01`, end: today };
  // month
  return { start: `${today.slice(0, 7)}-01`, end: today };
}

export function computeStats(
  shoes: StatShoeInput[],
  logs: StatLogInput[],
  range: { start: string; end: string },
): StatsResult {
  const nameById = new Map(shoes.map((s) => [s.id, s.name]));
  const inRange = logs.filter((l) => l.date >= range.start && l.date <= range.end);

  let totalDistance = 0;
  const distByShoe = new Map<number, number>();
  const countByShoe = new Map<number, number>();
  const distByMonth = new Map<string, number>();

  for (const l of inRange) {
    const d = l.distance ?? 0;
    totalDistance += d;
    distByShoe.set(l.shoe_id, (distByShoe.get(l.shoe_id) ?? 0) + d);
    countByShoe.set(l.shoe_id, (countByShoe.get(l.shoe_id) ?? 0) + 1);
    const mk = l.date.slice(0, 7);
    distByMonth.set(mk, (distByMonth.get(mk) ?? 0) + d);
  }

  let mostWorn: { name: string; count: number } | null = null;
  for (const [id, count] of countByShoe) {
    if (!mostWorn || count > mostWorn.count) {
      mostWorn = { name: nameById.get(id) ?? '(삭제됨)', count };
    }
  }

  const perShoe = [...distByShoe.entries()]
    .map(([id, distance]) => ({ name: nameById.get(id) ?? '(삭제됨)', distance }))
    .sort((a, b) => b.distance - a.distance);

  const monthly = [...distByMonth.entries()]
    .map(([month, distance]) => ({ month, distance }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return { totalDistance, totalWears: inRange.length, mostWorn, perShoe, monthly };
}
