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

const TODAY = '2026-06-21';

describe('validateShoeInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateShoeInput(baseShoe, TODAY)).toEqual([]);
  });
  test('이름 비어있으면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, name: '   ' }, TODAY)).toContain('신발 이름을 입력하세요.');
  });
  test('가격 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, price: -100 }, TODAY)).toContain('가격은 0 이상이어야 합니다.');
  });
  test('목표 거리 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, target_distance: -1 }, TODAY)).toContain('목표 거리는 0 이상이어야 합니다.');
  });
});

describe('validateShoeInput 날짜', () => {
  test('구매일 미래면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: '2026-06-22' }, TODAY))
      .toContain('구매일은 미래일 수 없습니다.');
  });
  test('구매일 형식 틀리면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: '2026-6-1' }, TODAY))
      .toContain('구매일 형식이 올바르지 않습니다.');
  });
  test('구매일 비어있으면 통과', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: null }, TODAY)).toEqual([]);
  });
});

describe('validateWearLogInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: 5 }, TODAY)).toEqual([]);
  });
  test('shoe_id 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 0, date: '2026-06-20', distance: 5 }, TODAY)).toContain('신발을 선택하세요.');
  });
  test('날짜 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '', distance: 5 }, TODAY)).toContain('날짜를 입력하세요.');
  });
  test('거리 음수면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: -3 }, TODAY)).toContain('거리는 0 이상이어야 합니다.');
  });
  test('거리 null은 허용', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: null }, TODAY)).toEqual([]);
  });
});

describe('validateWearLogInput 날짜', () => {
  test('날짜 미래면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-22', distance: 5 }, TODAY))
      .toContain('날짜는 미래일 수 없습니다.');
  });
  test('날짜 형식 틀리면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: 'bad', distance: 5 }, TODAY))
      .toContain('날짜 형식이 올바르지 않습니다.');
  });
});
