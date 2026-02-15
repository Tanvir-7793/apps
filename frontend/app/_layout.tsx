import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="service-detail" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false }} />
      <Stack.Screen name="admin/login" options={{ headerShown: false }} />
      <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}
