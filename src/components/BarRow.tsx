import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function BarRow({
  label, valueLabel, ratio, color,
}: {
  label: string;
  valueLabel: string;
  ratio: number;
  color: string;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: colors.textPrimary }} numberOfLines={1}>{label}</Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{valueLabel}</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 5, backgroundColor: color }} />
      </View>
    </View>
  );
}
