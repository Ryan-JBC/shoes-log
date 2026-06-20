import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ON_ACCENT } from '../theme/colors';

export function SegmentedControl({
  options, value, onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { colors, accent } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surface, borderRadius: 10, padding: 3 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: active ? accent : 'transparent' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? ON_ACCENT : colors.textSecondary }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
