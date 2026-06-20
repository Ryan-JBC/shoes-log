import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, accent } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '내 신발', tabBarIcon: () => <Text>👟</Text> }} />
      <Tabs.Screen name="logs" options={{ title: '일지', tabBarIcon: () => <Text>📖</Text> }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: () => <Text>📊</Text> }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tabs>
  );
}
