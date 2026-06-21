import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogs } from '../../src/db/wearLogs';
import { rangeFor, computeStats, RangeKind, StatsResult } from '../../src/domain/stats';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { DateField } from '../../src/components/DateField';
import { BarRow } from '../../src/components/BarRow';
import { useTheme } from '../../src/theme/ThemeProvider';

const EMPTY: StatsResult = { totalDistance: 0, totalWears: 0, mostWorn: null, perShoe: [], monthly: [] };

export default function StatsTab() {
  const { colors, accent } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<RangeKind>('month');
  const [customStart, setCustomStart] = useState<string>(today);
  const [customEnd, setCustomEnd] = useState<string>(today);
  const [stats, setStats] = useState<StatsResult>(EMPTY);

  const load = useCallback((k: RangeKind, cs: string, ce: string) => {
    (async () => {
      try {
        const shoes = await getShoes('all');
        const logs = await getWearLogs();
        const range = rangeFor(k, today, { start: cs, end: ce });
        setStats(computeStats(shoes, logs, range));
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, [today]);

  useFocusEffect(useCallback(() => { load(kind, customStart, customEnd); }, [kind, customStart, customEnd, load]));

  const maxPerShoe = Math.max(1, ...stats.perShoe.map((s) => s.distance));
  const maxMonth = Math.max(1, ...stats.monthly.map((m) => m.distance));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: '통계' }} />

      <SegmentedControl
        options={[
          { key: 'month', label: '이번 달' }, { key: 'year', label: '올해' },
          { key: 'all', label: '전체' }, { key: 'custom', label: '사용자 지정' },
        ]}
        value={kind}
        onChange={(k) => setKind(k as RangeKind)}
      />

      {kind === 'custom' && (
        <View style={{ gap: 8 }}>
          <DateField label="시작일" value={customStart} onChange={setCustomStart} />
          <DateField label="종료일" value={customEnd} onChange={setCustomEnd} />
          {customStart > customEnd && (
            <Text style={{ color: colors.danger, fontSize: 12 }}>시작일이 종료일보다 늦습니다.</Text>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>총 거리</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{stats.totalDistance.toFixed(1)} <Text style={{ fontSize: 12, color: colors.textSecondary }}>km</Text></Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>착용 횟수</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{stats.totalWears} <Text style={{ fontSize: 12, color: colors.textSecondary }}>회</Text></Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 22 }}>🏆</Text>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>가장 많이 신은 신발</Text>
          <Text style={{ color: accent, fontSize: 15, fontWeight: '800' }}>
            {stats.mostWorn ? `${stats.mostWorn.name} · ${stats.mostWorn.count}회` : '기록 없음'}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>신발별 누적 거리</Text>
      {stats.perShoe.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>데이터 없음</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {stats.perShoe.map((s, i) => (
            <BarRow key={i} label={s.name} valueLabel={`${s.distance.toFixed(1)} km`} ratio={s.distance / maxPerShoe} color={accent} />
          ))}
        </View>
      )}

      <Text style={{ color: colors.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>월별 거리 추이</Text>
      {stats.monthly.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>데이터 없음</Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {stats.monthly.map((m, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '70%', height: `${(m.distance / maxMonth) * 100}%`, backgroundColor: accent, borderRadius: 4 }} />
              <Text style={{ color: colors.textMuted, fontSize: 8 }}>{m.month.slice(5)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
