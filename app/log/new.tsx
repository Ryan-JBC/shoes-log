import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { addWearLog } from '../../src/db/wearLogs';
import { savePhotos, deletePhoto } from '../../src/services/photoStorage';
import { WearLogForm } from '../../src/components/WearLogForm';

export default function NewLogScreen() {
  async function onSubmit(
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    _keepPhotoIds: number[],
    newPhotoUris: string[],
  ) {
    let saved: string[] = [];
    try {
      saved = await savePhotos(newPhotoUris);
      await addWearLog({ ...fields, photo_uris: saved });
      router.back();
    } catch (e) {
      for (const u of saved) await deletePhoto(u);
      Alert.alert('저장 실패', String(e));
    }
  }
  return (
    <>
      <Stack.Screen options={{ title: '일지 작성' }} />
      <WearLogForm submitLabel="저장" onSubmit={onSubmit} />
    </>
  );
}
