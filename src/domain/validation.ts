import { NewShoe, NewWearLog } from '../types';
import { isValidISODate, isNotFuture } from './dates';

export function validateShoeInput(
  input: NewShoe,
  today: string = new Date().toISOString().slice(0, 10),
): string[] {
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
  if (input.purchase_date != null && input.purchase_date !== '') {
    if (!isValidISODate(input.purchase_date)) {
      errors.push('구매일 형식이 올바르지 않습니다.');
    } else if (!isNotFuture(input.purchase_date, today)) {
      errors.push('구매일은 미래일 수 없습니다.');
    }
  }
  return errors;
}

export function validateWearLogInput(
  input: Pick<NewWearLog, 'shoe_id' | 'date' | 'distance'>,
  today: string = new Date().toISOString().slice(0, 10),
): string[] {
  const errors: string[] = [];
  if (!input.shoe_id) {
    errors.push('신발을 선택하세요.');
  }
  if (!input.date || input.date.trim() === '') {
    errors.push('날짜를 입력하세요.');
  } else if (!isValidISODate(input.date)) {
    errors.push('날짜 형식이 올바르지 않습니다.');
  } else if (!isNotFuture(input.date, today)) {
    errors.push('날짜는 미래일 수 없습니다.');
  }
  if (input.distance != null && input.distance < 0) {
    errors.push('거리는 0 이상이어야 합니다.');
  }
  return errors;
}
