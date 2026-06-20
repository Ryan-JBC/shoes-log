import { rangeFor, computeStats, StatLogInput, StatShoeInput } from './stats';

describe('rangeFor', () => {
  test('month', () => {
    expect(rangeFor('month', '2026-06-21')).toEqual({ start: '2026-06-01', end: '2026-06-21' });
  });
  test('year', () => {
    expect(rangeFor('year', '2026-06-21')).toEqual({ start: '2026-01-01', end: '2026-06-21' });
  });
  test('all', () => {
    expect(rangeFor('all', '2026-06-21')).toEqual({ start: '0000-01-01', end: '9999-12-31' });
  });
  test('custom', () => {
    expect(rangeFor('custom', '2026-06-21', { start: '2026-03-01', end: '2026-03-31' }))
      .toEqual({ start: '2026-03-01', end: '2026-03-31' });
  });
});

const shoes: StatShoeInput[] = [
  { id: 1, name: '페가수스' },
  { id: 2, name: '울트라' },
];
const logs: StatLogInput[] = [
  { shoe_id: 1, date: '2026-06-02', distance: 5 },
  { shoe_id: 1, date: '2026-06-10', distance: 3 },
  { shoe_id: 2, date: '2026-06-15', distance: 10 },
  { shoe_id: 1, date: '2026-05-20', distance: 7 }, // 범위 밖(6월 기준)
];

describe('computeStats (2026-06 범위)', () => {
  const r = { start: '2026-06-01', end: '2026-06-30' };
  test('총 거리/횟수는 범위 내만', () => {
    const s = computeStats(shoes, logs, r);
    expect(s.totalDistance).toBe(18);
    expect(s.totalWears).toBe(3);
  });
  test('가장 많이 신은 신발 = 페가수스(2회)', () => {
    expect(computeStats(shoes, logs, r).mostWorn).toEqual({ name: '페가수스', count: 2 });
  });
  test('신발별 누적 거리 내림차순', () => {
    expect(computeStats(shoes, logs, r).perShoe).toEqual([
      { name: '울트라', distance: 10 },
      { name: '페가수스', distance: 8 },
    ]);
  });
  test('월별 버킷', () => {
    expect(computeStats(shoes, logs, r).monthly).toEqual([{ month: '2026-06', distance: 18 }]);
  });
  test('빈 데이터', () => {
    const s = computeStats(shoes, [], r);
    expect(s).toEqual({ totalDistance: 0, totalWears: 0, mostWorn: null, perShoe: [], monthly: [] });
  });
});
