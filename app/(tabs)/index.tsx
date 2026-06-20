import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus } from '../../src/domain/mileage';
import { ShoeCard } from '../../src/components/ShoeCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Shoe, ReplacementStatus } from '../../src/types';

interface Row {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
}

export default function ShoesTab() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(() => {
    (async () => {
      try {
        const shoes = await getShoes('active');
        const built: Row[] = [];
        for (const shoe of shoes) {
          const logs = await getWearLogsForShoe(shoe.id);
          const total = totalDistance(logs);
          built.push({ shoe, total, status: replacementStatus(total, shoe.target_distance) });
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
          title: '내 신발',
          headerRight: () => (
            <Pressable onPress={() => router.push('/shoe/new')} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 26 }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      {rows.length === 0 ? (
        <EmptyState message={'아직 등록된 신발이 없어요.\n오른쪽 위 ＋ 로 신발을 추가하세요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={rows}
          keyExtractor={(r) => String(r.shoe.id)}
          renderItem={({ item }) => (
            <ShoeCard
              shoe={item.shoe}
              total={item.total}
              status={item.status}
              onPress={() => router.push(`/shoe/${item.shoe.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
