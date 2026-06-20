import { View, Text, Image, Pressable } from 'react-native';
import { Shoe, ReplacementStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { PhotoPlaceholder } from './PhotoPlaceholder';

const STATUS_COLOR: Record<ReplacementStatus, string> = {
  none: '#4caf50',
  imminent: '#ff9800',
  reached: '#f44336',
};

export function ShoeCard({
  shoe, total, status, onPress,
}: {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: '#fafafa', marginBottom: 10 }}
    >
      {shoe.photo_uri ? (
        <Image source={{ uri: shoe.photo_uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
      ) : (
        <PhotoPlaceholder size={64} />
      )}
      <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{shoe.name}</Text>
          {status === 'imminent' && <Text>🟠</Text>}
          {status === 'reached' && <Text>🔴</Text>}
        </View>
        <Text style={{ color: '#666', fontSize: 12 }}>
          {shoe.target_distance != null
            ? `${total.toFixed(1)} / ${shoe.target_distance} km${status === 'reached' ? '  · 교체 권장' : ''}`
            : `${total.toFixed(1)} km`}
        </Text>
        {shoe.target_distance != null && (
          <ProgressBar ratio={total / shoe.target_distance} color={STATUS_COLOR[status]} />
        )}
      </View>
    </Pressable>
  );
}
