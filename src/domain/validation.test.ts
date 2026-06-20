import { validateShoeInput, validateWearLogInput } from './validation';
import { NewShoe } from '../types';

const baseShoe: NewShoe = {
  name: '페가수스 40',
  brand: '나이키',
  category: '러닝화',
  photo_uri: null,
  purchase_date: null,
  price: null,
  target_distance: null,
};

describe('validateShoeInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateShoeInput(baseShoe)).toEqual([]);
  });
  test('이름 비어있으면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, name: '   ' })).toContain('신발 이름을 입력하세요.');
  });
  test('가격 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, price: -100 })).toContain('가격은 0 이상이어야 합니다.');
  });
  test('목표 거리 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, target_distance: -1 })).toContain('목표 거리는 0 이상이어야 합니다.');
  });
});

describe('validateWearLogInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: 5 })).toEqual([]);
  });
  test('shoe_id 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 0, date: '2026-06-20', distance: 5 })).toContain('신발을 선택하세요.');
  });
  test('날짜 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '', distance: 5 })).toContain('날짜를 입력하세요.');
  });
  test('거리 음수면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: -3 })).toContain('거리는 0 이상이어야 합니다.');
  });
  test('거리 null은 허용', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: null })).toEqual([]);
  });
});
