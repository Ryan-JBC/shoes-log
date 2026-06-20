import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getShoes } from '../../src/db/shoes';
import { addWearLog } from '../../src/db/wearLogs';
import { validateWearLogInput } from '../../src/domain/validation';
import { savePhotos, deletePhoto } from '../../src/services/photoStorage';
import { DateField } from '../../src/components/DateField';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ON_ACCENT } from '../../src/theme/colors';
import { Shoe, NewWearLog } from '../../src/types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewLogScreen() {
  const { colors, accent } = useTheme();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [shoeId, setShoeId] = useState<number>(0);
  const [date, setDate] = useState(today());
  const [distance, setDistance] = useState('');
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShoes('active')
      .then(setShoes)
      .catch((e) => Alert.alert('불러오기 실패', String(e)));
  }, []);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function onSave() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const errors = validateWearLogInput({ shoe_id: shoeId, date, distance: distance ? Number(distance) : null }, todayStr);
    if (errors.length > 0) {
      Alert.alert('입력 오류', errors.join('\n'));
      return;
    }
    setSaving(true);
    let savedUris: string[] = [];
    try {
      savedUris = await savePhotos(photos);
      const input: NewWearLog = {
        shoe_id: shoeId,
        date,
        distance: distance ? Number(distance) : null,
        memo: memo || null,
        photo_uris: savedUris,
      };
      await addWearLog(input);
      router.back();
    } catch (e) {
      for (const uri of savedUris) {
        await deletePhoto(uri);
      }
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: '일지 작성' }} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>신발 선택 *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shoes.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setShoeId(s.id)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
              backgroundColor: shoeId === s.id ? accent : colors.card,
            }}
          >
            <Text style={{ color: shoeId === s.id ? ON_ACCENT : colors.textPrimary }}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <DateField label="날짜" value={date} onChange={setDate} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>거리(km)</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="선택" placeholderTextColor={colors.textMuted} style={[inputStyle, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>메모</Text>
      <TextInput value={memo} onChangeText={setMemo} placeholder="코디/날씨/느낌" placeholderTextColor={colors.textMuted} multiline style={[inputStyle, { height: 80, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>사진</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
        ))}
        <Pressable onPress={addPhoto} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, color: colors.textPrimary }}>＋</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSave} disabled={saving} style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = { borderWidth: 1, borderRadius: 8, padding: 10 } as const;
