import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function PhotoPlaceholder({ size = 64 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: 8, backgroundColor: colors.cardAlt, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.4 }}>👟</Text>
    </View>
  );
}
