import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getWearLog, getPhotosForLog, updateWearLog } from '../../../src/db/wearLogs';
import { savePhotos, deletePhoto } from '../../../src/services/photoStorage';
import { WearLogForm } from '../../../src/components/WearLogForm';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { WearLog, WearLogPhoto } from '../../../src/types';

export default function EditLogScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const logId = Number(id);
  const [data, setData] = useState<{ log: WearLog; photos: WearLogPhoto[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const log = await getWearLog(logId);
        if (!log) { Alert.alert('오류', '일지를 찾을 수 없습니다.'); router.back(); return; }
        const photos = await getPhotosForLog(logId);
        setData({ log, photos });
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
        router.back();
      }
    })();
  }, [logId]);

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: '일지 수정' }} />
        <Text style={{ color: colors.textSecondary }}>불러오는 중...</Text>
      </View>
    );
  }

  async function onSubmit(
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    keepPhotoIds: number[],
    newPhotoUris: string[],
  ) {
    let saved: string[] = [];
    try {
      saved = await savePhotos(newPhotoUris);
      await updateWearLog(logId, fields, keepPhotoIds, saved);
      // 제거된 기존 사진 파일 정리 (cleanup-only: ignore failures)
      const removed = data!.photos.filter((p) => !keepPhotoIds.includes(p.id));
      try { for (const p of removed) await deletePhoto(p.photo_uri); } catch { /* cleanup-only: ignore */ }
      router.back();
    } catch (e) {
      for (const u of saved) await deletePhoto(u);
      Alert.alert('저장 실패', String(e));
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '일지 수정' }} />
      <WearLogForm initial={data} submitLabel="수정 저장" onSubmit={onSubmit} />
    </>
  );
}
