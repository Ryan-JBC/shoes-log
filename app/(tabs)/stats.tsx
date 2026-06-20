import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogs } from '../../src/db/wearLogs';

interface ShoeStat {
  name: string;
  total: number;
  count: number;
}

export default function StatsTab() {
  const [monthDistance, setMonthDistance] = useState(0);
  const [stats, setStats] = useState<ShoeStat[]>([]);
  const [mostWorn, setMostWorn] = useState<string | null>(null);

  const load = useCallback(() => {
    (async () => {
      try {
        const shoes = await getShoes(true);
        const logs = await getWearLogs();
        const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

        let md = 0;
        const byShoe = new Map<number, ShoeStat>();
        for (const s of shoes) byShoe.set(s.id, { name: s.name, total: 0, count: 0 });

        for (const log of logs) {
          if (log.date.startsWith(month)) md += log.distance ?? 0;
          const stat = byShoe.get(log.shoe_id);
          if (stat) {
            stat.total += log.distance ?? 0;
            stat.count += 1;
          }
        }

        const arr = [...byShoe.values()].sort((a, b) => b.total - a.total);
        setMonthDistance(md);
        setStats(arr);
        const top = [...arr].sort((a, b) => b.count - a.count)[0];
        setMostWorn(top && top.count > 0 ? top.name : null);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  useFocusEffect(load);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: '통계' }} />

      <View style={{ padding: 16, backgroundColor: '#f0f7ff', borderRadius: 12 }}>
        <Text style={{ color: '#666' }}>이번 달 총 거리</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{monthDistance.toFixed(1)} km</Text>
      </View>

      <View style={{ padding: 16, backgroundColor: '#fff7f0', borderRadius: 12 }}>
        <Text style={{ color: '#666' }}>가장 많이 신은 신발</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{mostWorn ?? '기록 없음'}</Text>
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>신발별 누적 거리</Text>
      {stats.length === 0 ? (
        <Text style={{ color: '#999' }}>아직 데이터가 없어요.</Text>
      ) : (
        stats.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text>{i + 1}. {s.name}</Text>
            <Text style={{ color: '#666' }}>{s.total.toFixed(1)} km · {s.count}회</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
