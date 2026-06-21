import { View, Text, Image, Pressable } from 'react-native';
import { Shoe, ReplacementStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { useTheme } from '../theme/ThemeProvider';
import { daysSince } from '../domain/dates';

const STATUS_KEY: Record<ReplacementStatus, 'success' | 'warning' | 'danger'> = {
  none: 'success', imminent: 'warning', reached: 'danger',
};

export function ShoeCard({
  shoe, total, status, onPress,
}: {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const days = shoe.purchase_date ? daysSince(shoe.purchase_date, today) : null;
  const barColor = colors[STATUS_KEY[status]];

  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.card, marginBottom: 10, opacity: shoe.retired ? 0.5 : 1 }}
    >
      {shoe.photo_uri ? (
        <Image source={{ uri: shoe.photo_uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
      ) : (
        <PhotoPlaceholder size={64} />
      )}
      <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.textPrimary }}>{shoe.name}</Text>
          {shoe.retired === 1 && <Text style={{ fontSize: 11, color: colors.textMuted }}>은퇴</Text>}
          {shoe.retired === 0 && status === 'imminent' && <Text>🟠</Text>}
          {shoe.retired === 0 && status === 'reached' && <Text>🔴</Text>}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {shoe.target_distance != null
            ? `${total.toFixed(1)} / ${shoe.target_distance} km${status === 'reached' && shoe.retired === 0 ? '  · 교체 권장' : ''}`
            : `${total.toFixed(1)} km`}
        </Text>
        {days != null && (
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>구매 후 {days}일</Text>
        )}
        {shoe.target_distance != null && (
          <ProgressBar ratio={total / shoe.target_distance} color={barColor} />
        )}
      </View>
    </Pressable>
  );
}
