import { View, Text } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
