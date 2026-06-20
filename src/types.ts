export type ReplacementStatus = 'none' | 'imminent' | 'reached';

export interface Shoe {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  photo_uri: string | null;
  purchase_date: string | null; // ISO 'YYYY-MM-DD'
  price: number | null;
  target_distance: number | null; // km
  retired: 0 | 1;
  created_at: string; // ISO datetime
}

// 신발 등록 시 입력값 (id/created_at 제외, retired 기본 0)
export interface NewShoe {
  name: string;
  brand: string | null;
  category: string | null;
  photo_uri: string | null;
  purchase_date: string | null;
  price: number | null;
  target_distance: number | null;
}

export interface WearLog {
  id: number;
  shoe_id: number;
  date: string; // 'YYYY-MM-DD'
  distance: number | null; // km
  memo: string | null;
  created_at: string;
}

export interface NewWearLog {
  shoe_id: number;
  date: string;
  distance: number | null;
  memo: string | null;
  photo_uris: string[]; // 저장 전 임시 경로들 (앱 폴더로 복사됨)
}

export interface WearLogPhoto {
  id: number;
  wear_log_id: number;
  photo_uri: string;
}
