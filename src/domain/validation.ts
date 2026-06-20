import { NewShoe, NewWearLog } from '../types';

export function validateShoeInput(input: NewShoe): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.trim() === '') {
    errors.push('신발 이름을 입력하세요.');
  }
  if (input.price != null && input.price < 0) {
    errors.push('가격은 0 이상이어야 합니다.');
  }
  if (input.target_distance != null && input.target_distance < 0) {
    errors.push('목표 거리는 0 이상이어야 합니다.');
  }
  return errors;
}

export function validateWearLogInput(
  input: Pick<NewWearLog, 'shoe_id' | 'date' | 'distance'>,
): string[] {
  const errors: string[] = [];
  if (!input.shoe_id) {
    errors.push('신발을 선택하세요.');
  }
  if (!input.date || input.date.trim() === '') {
    errors.push('날짜를 입력하세요.');
  }
  if (input.distance != null && input.distance < 0) {
    errors.push('거리는 0 이상이어야 합니다.');
  }
  return errors;
}
