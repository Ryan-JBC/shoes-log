import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { getWearLog, getPhotosForLog, deleteWearLog } from '../../src/db/wearLogs';
import { getShoe } from '../../src/db/shoes';
import { deletePhoto } from '../../src/services/photoStorage';
import { useTheme } from '../../src/theme/ThemeProvider';
import { WearLog, WearLogPhoto } from '../../src/types';

export default function LogDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const logId = Number(id);
  const { width } = useWindowDimensions();
  const [log, setLog] = useState<WearLog | null>(null);
  const [shoeName, setShoeName] = useState('');
  const [photos, setPhotos] = useState<WearLogPhoto[]>([]);

  const load = useCallback(() => {
    (async () => {
      try {
        const l = await getWearLog(logId);
        setLog(l);
        if (l) {
          const shoe = await getShoe(l.shoe_id);
          setShoeName(shoe?.name ?? '(삭제된 신발)');
        }
        setPhotos(await getPhotosForLog(logId));
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, [logId]);

  useFocusEffect(load);

  if (!log) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>불러오는 중...</Text>
      </View>
    );
  }

  function onDelete() {
    Alert.alert('일지 삭제', '이 일지와 사진이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            for (const p of photos) {
              await deletePhoto(p.photo_uri);
            }
            await deleteWearLog(logId);
            router.back();
          } catch (e) {
            Alert.alert('삭제 실패', String(e));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: log.date }} />
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary }}>{shoeName}</Text>
      <Text style={{ color: colors.textSecondary }}>
        {log.date}{log.distance != null ? ` · ${log.distance} km` : ''}
      </Text>
      {log.memo ? <Text style={{ fontSize: 16, color: colors.textPrimary }}>{log.memo}</Text> : null}
      {photos.map((p) => (
        <Image
          key={p.id}
          source={{ uri: p.photo_uri }}
          style={{ width: width - 32, height: width - 32, borderRadius: 12 }}
        />
      ))}
      <Pressable onPress={onDelete} style={{ padding: 14, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: colors.danger }}>일지 삭제</Text>
      </Pressable>
    </ScrollView>
  );
}
