import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ACCENT_PALETTE } from '../../src/theme/colors';

export default function SettingsTab() {
  const { colors, accent, setAccent } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>포인트 색상</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {ACCENT_PALETTE.map((c) => {
          const selected = c === accent;
          return (
            <Pressable
              key={c}
              onPress={() => setAccent(c)}
              style={{
                width: 40, height: 40, borderRadius: 20, backgroundColor: c,
                borderWidth: selected ? 3 : 0, borderColor: colors.background,
                shadowColor: selected ? c : 'transparent', shadowOpacity: selected ? 1 : 0, shadowRadius: 6,
                outlineWidth: selected ? 2 : 0,
              }}
            />
          );
        })}
      </View>

      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>미리보기</Text>
      <View style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>👟</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>페가수스 40</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>320 / 600 km</Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
            <View style={{ width: '53%', height: '100%', backgroundColor: accent }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
