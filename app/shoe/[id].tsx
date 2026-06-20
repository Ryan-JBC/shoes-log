import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { getShoe, setShoeRetired, deleteShoe } from '../../src/db/shoes';
import { getWearLogsForShoe, getPhotosForLog } from '../../src/db/wearLogs';
import { deletePhoto } from '../../src/services/photoStorage';
import { totalDistance, replacementStatus, remainingDistance } from '../../src/domain/mileage';
import { daysSince } from '../../src/domain/dates';
import { useTheme } from '../../src/theme/ThemeProvider';
import { PhotoPlaceholder } from '../../src/components/PhotoPlaceholder';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Shoe, WearLog } from '../../src/types';

export default function ShoeDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shoeId = Number(id);
  const [shoe, setShoe] = useState<Shoe | null>(null);
  const [logs, setLogs] = useState<WearLog[]>([]);

  const load = useCallback(() => {
    (async () => {
      try {
        setShoe(await getShoe(shoeId));
        setLogs(await getWearLogsForShoe(shoeId));
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, [shoeId]);

  useFocusEffect(load);

  if (!shoe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  const total = totalDistance(logs);
  const status = replacementStatus(total, shoe.target_distance);
  const remaining = remainingDistance(total, shoe.target_distance);

  async function onRetire() {
    try {
      await setShoeRetired(shoeId, shoe!.retired === 0);
      load();
    } catch (e) {
      Alert.alert('오류', String(e));
    }
  }

  function onDelete() {
    Alert.alert('삭제', '이 신발과 관련 일지·사진이 모두 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            // remove this shoe's representative photo file
            if (shoe?.photo_uri) {
              await deletePhoto(shoe.photo_uri);
            }
            // remove all photo files belonging to this shoe's wear logs
            for (const log of logs) {
              const photos = await getPhotosForLog(log.id);
              for (const p of photos) {
                await deletePhoto(p.photo_uri);
              }
            }
            await deleteShoe(shoeId);
            router.back();
          } catch (e) {
            Alert.alert('삭제 실패', String(e));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: shoe.name }} />
      <View style={{ alignItems: 'center' }}>
        {shoe.photo_uri ? (
          <Image source={{ uri: shoe.photo_uri }} style={{ width: 160, height: 160, borderRadius: 16 }} />
        ) : (
          <PhotoPlaceholder size={160} />
        )}
      </View>
      <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: colors.textPrimary }}>{shoe.name}</Text>
      {shoe.brand ? <Text style={{ textAlign: 'center', color: colors.textSecondary }}>{shoe.brand} · {shoe.category ?? ''}</Text> : null}

      <View style={{ gap: 6, padding: 12, backgroundColor: colors.card, borderRadius: 12 }}>
        <Text style={{ fontWeight: '600', color: colors.textPrimary }}>누적 거리: {total.toFixed(1)} km</Text>
        {shoe.target_distance != null ? (
          <>
            <ProgressBar
              ratio={total / shoe.target_distance}
              color={status === 'reached' ? colors.danger : status === 'imminent' ? colors.warning : colors.success}
            />
            <Text style={{ color: colors.textSecondary }}>
              목표 {shoe.target_distance} km · 남은 {remaining?.toFixed(1)} km
              {status === 'reached' ? ' · 🔴 교체 권장' : status === 'imminent' ? ' · 🟠 교체 임박' : ''}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textMuted }}>마일리지 미추적 (목표 거리 미설정)</Text>
        )}
        {shoe.purchase_date && daysSince(shoe.purchase_date, new Date().toISOString().slice(0,10)) != null && (
          <Text style={{ color: colors.textMuted }}>
            구매일 {shoe.purchase_date} · 구매 후 {daysSince(shoe.purchase_date, new Date().toISOString().slice(0,10))}일
          </Text>
        )}
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8, color: colors.textPrimary }}>착화 일지 ({logs.length})</Text>
      {logs.map((log) => (
        <Pressable
          key={log.id}
          onPress={() => router.push(`/log/${log.id}`)}
          style={{ padding: 12, backgroundColor: colors.card, borderRadius: 8 }}
        >
          <Text style={{ color: colors.textPrimary }}>{log.date}{log.distance != null ? ` · ${log.distance} km` : ''}</Text>
          {log.memo ? <Text style={{ color: colors.textSecondary }} numberOfLines={1}>{log.memo}</Text> : null}
        </Pressable>
      ))}

      <Pressable onPress={onRetire} style={{ padding: 14, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: colors.textPrimary }}>{shoe.retired ? '은퇴 해제' : '은퇴 처리'}</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={{ padding: 14, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center' }}>
        <Text style={{ color: colors.danger }}>삭제</Text>
      </Pressable>
    </ScrollView>
  );
}
