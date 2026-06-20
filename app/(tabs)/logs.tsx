import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Image, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getWearLogs, getPhotosForLog } from '../../src/db/wearLogs';
import { getShoes } from '../../src/db/shoes';
import { EmptyState } from '../../src/components/EmptyState';
import { PhotoPlaceholder } from '../../src/components/PhotoPlaceholder';
import { WearLog } from '../../src/types';

interface Row {
  log: WearLog;
  shoeName: string;
  thumb: string | null;
}

export default function LogsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [hasShoes, setHasShoes] = useState(true);

  const load = useCallback(() => {
    (async () => {
      try {
        const shoes = await getShoes(true);
        setHasShoes(shoes.length > 0);
        const nameById = new Map(shoes.map((s) => [s.id, s.name]));
        const logs = await getWearLogs();
        const built: Row[] = [];
        for (const log of logs) {
          const photos = await getPhotosForLog(log.id);
          built.push({
            log,
            shoeName: nameById.get(log.shoe_id) ?? '(삭제된 신발)',
            thumb: photos[0]?.photo_uri ?? null,
          });
        }
        setRows(built);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  useFocusEffect(load);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: '일지',
          headerRight: () => (
            <Pressable
              onPress={() => {
                if (!hasShoes) {
                  Alert.alert('신발 필요', '먼저 신발을 등록하세요.');
                  return;
                }
                router.push('/log/new');
              }}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontSize: 26 }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      {rows.length === 0 ? (
        <EmptyState message={'아직 일지가 없어요.\n오른쪽 위 ＋ 로 오늘 신은 신발을 기록하세요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={rows}
          keyExtractor={(r) => String(r.log.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/log/${item.log.id}`)}
              style={{ flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#fafafa', borderRadius: 12, marginBottom: 10 }}
            >
              {item.thumb ? (
                <Image source={{ uri: item.thumb }} style={{ width: 56, height: 56, borderRadius: 8 }} />
              ) : (
                <PhotoPlaceholder size={56} />
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>{item.shoeName}</Text>
                <Text style={{ color: '#666' }}>
                  {item.log.date}{item.log.distance != null ? ` · ${item.log.distance} km` : ''}
                </Text>
                {item.log.memo ? <Text style={{ color: '#888' }} numberOfLines={1}>{item.log.memo}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
