import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus } from '../../src/domain/mileage';
import { ShoeCard } from '../../src/components/ShoeCard';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Shoe, ReplacementStatus } from '../../src/types';

interface Row { shoe: Shoe; total: number; status: ReplacementStatus; }
type Filter = 'active' | 'retired' | 'all';

export default function ShoesTab() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('active');
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback((f: Filter) => {
    (async () => {
      try {
        const shoes = await getShoes(f);
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

  useFocusEffect(useCallback(() => { load(filter); }, [filter, load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: '내 신발',
          headerRight: () => (
            <Pressable onPress={() => router.push('/shoe/new')} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 26, color: colors.textPrimary }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      <View style={{ padding: 12, paddingBottom: 4 }}>
        <SegmentedControl
          options={[{ key: 'active', label: '사용 중' }, { key: 'retired', label: '은퇴' }, { key: 'all', label: '전체' }]}
          value={filter}
          onChange={(k) => { setFilter(k as Filter); load(k as Filter); }}
        />
      </View>
      {rows.length === 0 ? (
        <EmptyState message={filter === 'active' ? '사용 중인 신발이 없어요.\n오른쪽 위 ＋ 로 신발을 추가하세요.' : '해당하는 신발이 없어요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12, paddingTop: 4 }}
          data={rows}
          keyExtractor={(r) => String(r.shoe.id)}
          renderItem={({ item }) => (
            <ShoeCard shoe={item.shoe} total={item.total} status={item.status} onPress={() => router.push(`/shoe/${item.shoe.id}`)} />
          )}
        />
      )}
    </View>
  );
}
