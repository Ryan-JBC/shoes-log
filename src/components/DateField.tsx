import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateField({
  label, value, onChange, placeholder = '날짜 선택', maximumDate = new Date(),
}: {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  maximumDate?: Date;
}) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const current = value ? new Date(value + 'T00:00:00') : new Date();

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.card }}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textMuted }}>
          {value ?? placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          themeVariant="dark"
          onChange={(event, selected) => {
            setShow(false);
            if (event.type !== 'dismissed' && selected) {
              onChange(toISO(selected));
            }
          }}
        />
      )}
    </View>
  );
}
