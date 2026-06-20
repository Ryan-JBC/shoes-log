import { View, Text } from 'react-native';

export function PhotoPlaceholder({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.4 }}>👟</Text>
    </View>
  );
}
