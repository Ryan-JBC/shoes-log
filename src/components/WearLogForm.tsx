import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getShoes, getShoe } from '../db/shoes';
import { validateWearLogInput } from '../domain/validation';
import { DateField } from './DateField';
import { useTheme } from '../theme/ThemeProvider';
import { ON_ACCENT } from '../theme/colors';
import { Shoe, WearLog, WearLogPhoto } from '../types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WearLogForm({
  initial, submitLabel, onSubmit,
}: {
  initial?: { log: WearLog; photos: WearLogPhoto[] };
  submitLabel: string;
  onSubmit: (
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    keepPhotoIds: number[],
    newPhotoUris: string[],
  ) => Promise<void>;
}) {
  const { colors, accent } = useTheme();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [shoeId, setShoeId] = useState<number>(initial?.log.shoe_id ?? 0);
  const [date, setDate] = useState(initial?.log.date ?? today());
  const [distance, setDistance] = useState(initial?.log.distance != null ? String(initial.log.distance) : '');
  const [memo, setMemo] = useState(initial?.log.memo ?? '');
  const [existing, setExisting] = useState<WearLogPhoto[]>(initial?.photos ?? []);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const active = await getShoes('active');
        let list = active;
        if (initial && !active.some((s) => s.id === initial.log.shoe_id)) {
          const s = await getShoe(initial.log.shoe_id);
          if (s) list = [s, ...active];
        }
        setShoes(list);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setNewPhotos((prev) => [...prev, result.assets[0].uri]);
  }

  async function handleSubmit() {
    const todayStr = today();
    const errors = validateWearLogInput({ shoe_id: shoeId, date, distance: distance ? Number(distance) : null }, todayStr);
    if (errors.length > 0) { Alert.alert('입력 오류', errors.join('\n')); return; }
    setSaving(true);
    try {
      await onSubmit(
        { shoe_id: shoeId, date, distance: distance ? Number(distance) : null, memo: memo || null },
        existing.map((p) => p.id),
        newPhotos,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>신발 선택 *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shoes.map((s) => (
          <Pressable key={s.id} onPress={() => setShoeId(s.id)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: shoeId === s.id ? accent : colors.card }}>
            <Text style={{ color: shoeId === s.id ? ON_ACCENT : colors.textPrimary }}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <DateField label="날짜" value={date} onChange={setDate} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>거리(km)</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="선택" placeholderTextColor={colors.textMuted}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>메모</Text>
      <TextInput value={memo} onChangeText={setMemo} placeholder="코디/날씨/느낌" placeholderTextColor={colors.textMuted} multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, height: 80, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>사진</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {existing.map((p) => (
          <View key={`e-${p.id}`}>
            <Image source={{ uri: p.photo_uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            <Pressable onPress={() => setExisting((prev) => prev.filter((x) => x.id !== p.id))}
              style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
            </Pressable>
          </View>
        ))}
        {newPhotos.map((uri, i) => (
          <View key={`n-${i}`}>
            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            <Pressable onPress={() => setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addPhoto} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, color: colors.textPrimary }}>＋</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleSubmit} disabled={saving} style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}
