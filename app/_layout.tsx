import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { initDatabase } from '../src/db/database';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { darkColors } from '../src/theme/colors';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase().then(() => setReady(true)).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: darkColors.background }}>
        <Text style={{ color: darkColors.textPrimary }}>데이터베이스 초기화 실패: {error}</Text>
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkColors.background }}>
        <Text style={{ color: darkColors.textPrimary }}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: darkColors.surface },
          headerTintColor: darkColors.textPrimary,
          contentStyle: { backgroundColor: darkColors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
