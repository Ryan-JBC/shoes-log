import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getShoe, updateShoe } from '../../../src/db/shoes';
import { savePhoto, deletePhoto } from '../../../src/services/photoStorage';
import { ShoeForm } from '../../../src/components/ShoeForm';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { NewShoe, Shoe } from '../../../src/types';

export default function EditShoeScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shoeId = Number(id);
  const [shoe, setShoe] = useState<Shoe | null>(null);

  useEffect(() => {
    getShoe(shoeId)
      .then((s) => { if (!s) { Alert.alert('오류', '신발을 찾을 수 없습니다.'); router.back(); } else setShoe(s); })
      .catch((e) => { Alert.alert('불러오기 실패', String(e)); router.back(); });
  }, [shoeId]);

  if (!shoe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: '신발 수정' }} />
        <Text style={{ color: colors.textSecondary }}>불러오는 중...</Text>
      </View>
    );
  }

  async function onSubmit(input: NewShoe, pickedPhotoUri: string | null) {
    const oldPhoto = shoe!.photo_uri;
    try {
      if (pickedPhotoUri) {
        input.photo_uri = await savePhoto(pickedPhotoUri);
      } else {
        input.photo_uri = shoe!.photo_uri;
      }
      await updateShoe(shoe!.id, input);
      if (pickedPhotoUri && oldPhoto) {
        try { await deletePhoto(oldPhoto); } catch { /* cleanup-only: ignore */ }
      }
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '신발 수정' }} />
      <ShoeForm initial={shoe} submitLabel="수정 저장" onSubmit={onSubmit} />
    </>
  );
}
