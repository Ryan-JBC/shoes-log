import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
