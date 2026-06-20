import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { getShoe, setShoeRetired, deleteShoe } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus, remainingDistance } from '../../src/domain/mileage';
import { PhotoPlaceholder } from '../../src/components/PhotoPlaceholder';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Shoe, WearLog } from '../../src/types';

export default function ShoeDetailScreen() {
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: shoe.name }} />
      <View style={{ alignItems: 'center' }}>
        {shoe.photo_uri ? (
          <Image source={{ uri: shoe.photo_uri }} style={{ width: 160, height: 160, borderRadius: 16 }} />
        ) : (
          <PhotoPlaceholder size={160} />
        )}
      </View>
      <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>{shoe.name}</Text>
      {shoe.brand ? <Text style={{ textAlign: 'center', color: '#666' }}>{shoe.brand} · {shoe.category ?? ''}</Text> : null}

      <View style={{ gap: 6, padding: 12, backgroundColor: '#fafafa', borderRadius: 12 }}>
        <Text style={{ fontWeight: '600' }}>누적 거리: {total.toFixed(1)} km</Text>
        {shoe.target_distance != null ? (
          <>
            <ProgressBar
              ratio={total / shoe.target_distance}
              color={status === 'reached' ? '#f44336' : status === 'imminent' ? '#ff9800' : '#4caf50'}
            />
            <Text style={{ color: '#666' }}>
              목표 {shoe.target_distance} km · 남은 {remaining?.toFixed(1)} km
              {status === 'reached' ? ' · 🔴 교체 권장' : status === 'imminent' ? ' · 🟠 교체 임박' : ''}
            </Text>
          </>
        ) : (
          <Text style={{ color: '#999' }}>마일리지 미추적 (목표 거리 미설정)</Text>
        )}
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>착화 일지 ({logs.length})</Text>
      {logs.map((log) => (
        <Pressable
          key={log.id}
          onPress={() => router.push(`/log/${log.id}`)}
          style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Text>{log.date}{log.distance != null ? ` · ${log.distance} km` : ''}</Text>
          {log.memo ? <Text style={{ color: '#666' }} numberOfLines={1}>{log.memo}</Text> : null}
        </Pressable>
      ))}

      <Pressable onPress={onRetire} style={{ padding: 14, borderRadius: 10, backgroundColor: '#eee', alignItems: 'center', marginTop: 12 }}>
        <Text>{shoe.retired ? '은퇴 해제' : '은퇴 처리'}</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={{ padding: 14, borderRadius: 10, backgroundColor: '#ffebee', alignItems: 'center' }}>
        <Text style={{ color: '#c62828' }}>삭제</Text>
      </Pressable>
    </ScrollView>
  );
}
