import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: '내 신발', tabBarIcon: () => <Text>👟</Text> }}
      />
      <Tabs.Screen
        name="logs"
        options={{ title: '일지', tabBarIcon: () => <Text>📖</Text> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: '통계', tabBarIcon: () => <Text>📊</Text> }}
      />
    </Tabs>
  );
}
