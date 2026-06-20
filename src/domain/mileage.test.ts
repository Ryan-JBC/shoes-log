import { totalDistance, replacementStatus, remainingDistance } from './mileage';

describe('totalDistance', () => {
  test('빈 목록은 0', () => {
    expect(totalDistance([])).toBe(0);
  });
  test('distance 합산', () => {
    expect(totalDistance([{ distance: 5 }, { distance: 3.5 }])).toBe(8.5);
  });
  test('null distance는 0으로 취급', () => {
    expect(totalDistance([{ distance: 5 }, { distance: null }])).toBe(5);
  });
});

describe('replacementStatus', () => {
  test('target 없으면 none', () => {
    expect(replacementStatus(700, null)).toBe('none');
  });
  test('여유 있으면 none (남은 거리 > 50)', () => {
    expect(replacementStatus(500, 600)).toBe('none');
  });
  test('임박: 남은 거리 정확히 50', () => {
    expect(replacementStatus(550, 600)).toBe('imminent');
  });
  test('임박: 남은 거리 50 미만', () => {
    expect(replacementStatus(580, 600)).toBe('imminent');
  });
  test('도달: 누적 == target', () => {
    expect(replacementStatus(600, 600)).toBe('reached');
  });
  test('도달: 누적 > target', () => {
    expect(replacementStatus(601, 600)).toBe('reached');
  });
});

describe('remainingDistance', () => {
  test('target 없으면 null', () => {
    expect(remainingDistance(100, null)).toBeNull();
  });
  test('남은 거리 = target - total', () => {
    expect(remainingDistance(550, 600)).toBe(50);
  });
  test('초과 시 0 (음수 아님)', () => {
    expect(remainingDistance(650, 600)).toBe(0);
  });
});
