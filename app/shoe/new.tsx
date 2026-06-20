import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addShoe } from '../../src/db/shoes';
import { validateShoeInput } from '../../src/domain/validation';
import { savePhoto } from '../../src/services/photoStorage';
import { NewShoe } from '../../src/types';

export default function NewShoeScreen() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function onSave() {
    const input: NewShoe = {
      name,
      brand: brand || null,
      category: category || null,
      photo_uri: null,
      purchase_date: purchaseDate || null,
      price: price ? Number(price) : null,
      target_distance: target ? Number(target) : null,
    };
    const errors = validateShoeInput(input);
    if (errors.length > 0) {
      Alert.alert('입력 오류', errors.join('\n'));
      return;
    }
    setSaving(true);
    try {
      if (photoUri) {
        input.photo_uri = await savePhoto(photoUri);
      }
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
            <Text>사진 추가</Text>
          </View>
        )}
      </Pressable>
      <Field label="이름 *" value={name} onChange={setName} placeholder="예: 나이키 페가수스 40" />
      <Field label="브랜드" value={brand} onChange={setBrand} />
      <Field label="종류" value={category} onChange={setCategory} placeholder="러닝화 / 운동화 / 구두 ..." />
      <Field label="구매일" value={purchaseDate} onChange={setPurchaseDate} placeholder="YYYY-MM-DD" />
      <Field label="가격" value={price} onChange={setPrice} keyboardType="numeric" />
      <Field label="교체 목표 거리(km)" value={target} onChange={setTarget} keyboardType="numeric" placeholder="비우면 마일리지 미추적" />
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={{ backgroundColor: '#222', padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />
    </View>
  );
}
