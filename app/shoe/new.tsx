import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addShoe } from '../../src/db/shoes';
import { validateShoeInput } from '../../src/domain/validation';
import { savePhoto } from '../../src/services/photoStorage';
import { DateField } from '../../src/components/DateField';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ON_ACCENT } from '../../src/theme/colors';
import { NewShoe } from '../../src/types';

const CATEGORIES = ['러닝화', '운동화', '구두', '기타'] as const;

export default function NewShoeScreen() {
  const { colors, accent } = useTheme();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryChoice, setCategoryChoice] = useState<string | null>(null);
  const [categoryOther, setCategoryOther] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  function resolveCategory(): string | null {
    if (categoryChoice === '기타') return categoryOther.trim() || null;
    return categoryChoice;
  }

  async function onSave() {
    if (categoryChoice === '기타' && categoryOther.trim() === '') {
      Alert.alert('입력 오류', '기타 종류를 입력하세요.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const input: NewShoe = {
      name,
      brand: brand || null,
      category: resolveCategory(),
      photo_uri: null,
      purchase_date: purchaseDate,
      price: price ? Number(price) : null,
      target_distance: target ? Number(target) : null,
    };
    const errors = validateShoeInput(input, today);
    if (errors.length > 0) { Alert.alert('입력 오류', errors.join('\n')); return; }
    setSaving(true);
    try {
      if (photoUri) input.photo_uri = await savePhoto(photoUri);
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: '신발 등록' }} />
      <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>사진 추가</Text>
          </View>
        )}
      </Pressable>

      <Field label="이름 *" value={name} onChange={setName} placeholder="예: 나이키 페가수스 40" colors={colors} />
      <Field label="브랜드" value={brand} onChange={setBrand} colors={colors} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>종류</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((c) => {
          const sel = categoryChoice === c;
          return (
            <Pressable key={c} onPress={() => setCategoryChoice(c)}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: sel ? accent : colors.card }}>
              <Text style={{ color: sel ? ON_ACCENT : colors.textSecondary, fontWeight: '700' }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      {categoryChoice === '기타' && (
        <TextInput value={categoryOther} onChangeText={setCategoryOther} placeholder="종류 직접 입력"
          placeholderTextColor={colors.textMuted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.textPrimary, backgroundColor: colors.card }} />
      )}

      <DateField label="구매일" value={purchaseDate} onChange={setPurchaseDate} placeholder="구매일 선택 (선택사항)" />
      <Field label="가격" value={price} onChange={setPrice} keyboardType="numeric" colors={colors} />
      <Field label="교체 목표 거리(km)" value={target} onChange={setTarget} keyboardType="numeric" placeholder="비우면 마일리지 미추적" colors={colors} />

      <Pressable onPress={onSave} disabled={saving}
        style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, colors,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'numeric' | 'default';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} keyboardType={keyboardType ?? 'default'}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.textPrimary, backgroundColor: colors.card }} />
    </View>
  );
}
