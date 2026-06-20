import { isValidISODate, isNotFuture, daysSince } from './dates';

describe('isValidISODate', () => {
  test('올바른 날짜', () => { expect(isValidISODate('2026-06-21')).toBe(true); });
  test('형식 틀림(5글자)', () => { expect(isValidISODate('2026-')).toBe(false); });
  test('숫자 아님', () => { expect(isValidISODate('abcde')).toBe(false); });
  test('존재하지 않는 달/일', () => {
    expect(isValidISODate('2026-13-40')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
  });
  test('빈 문자열', () => { expect(isValidISODate('')).toBe(false); });
});

describe('isNotFuture', () => {
  test('오늘은 통과', () => { expect(isNotFuture('2026-06-21', '2026-06-21')).toBe(true); });
  test('과거는 통과', () => { expect(isNotFuture('2026-06-20', '2026-06-21')).toBe(true); });
  test('미래는 실패', () => { expect(isNotFuture('2026-06-22', '2026-06-21')).toBe(false); });
});

describe('daysSince', () => {
  test('같은 날 = 0', () => { expect(daysSince('2026-06-21', '2026-06-21')).toBe(0); });
  test('과거 = 양수', () => { expect(daysSince('2026-06-01', '2026-06-21')).toBe(20); });
  test('월 경계 넘김', () => { expect(daysSince('2026-05-31', '2026-06-01')).toBe(1); });
  test('잘못된 날짜 = null', () => { expect(daysSince('bad', '2026-06-21')).toBeNull(); });
});
