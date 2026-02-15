import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'services') {
            iconName = focused ? 'car-sport' : 'car-sport-outline';
          } else if (route.name === 'gallery') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'contact') {
            iconName = focused ? 'call' : 'call-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
        }}
      />
    </Tabs>
  );
}
