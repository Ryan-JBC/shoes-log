import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function savePhoto(tempUri: string): Promise<string> {
  await ensureDir();
  // 가로 최대 1280px로 리사이즈 + JPEG 70% 압축
  const manipulated = await ImageManipulator.manipulateAsync(
    tempUri,
    [{ resize: { width: 1280 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const dest = PHOTO_DIR + filename;
  await FileSystem.moveAsync({ from: manipulated.uri, to: dest });
  return dest;
}

export async function savePhotos(tempUris: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const uri of tempUris) {
    results.push(await savePhoto(uri));
  }
  return results;
}

export async function deletePhoto(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // 파일이 없거나 삭제 실패해도 무시 (정합성 정리용)
  }
}
