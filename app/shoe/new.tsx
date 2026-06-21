import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { addShoe } from '../../src/db/shoes';
import { savePhoto } from '../../src/services/photoStorage';
import { ShoeForm } from '../../src/components/ShoeForm';
import { NewShoe } from '../../src/types';

export default function NewShoeScreen() {
  async function onSubmit(input: NewShoe, pickedPhotoUri: string | null) {
    try {
      if (pickedPhotoUri) input.photo_uri = await savePhoto(pickedPhotoUri);
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    }
  }
  return (
    <>
      <Stack.Screen options={{ title: '신발 등록' }} />
      <ShoeForm submitLabel="저장" onSubmit={onSubmit} />
    </>
  );
}
