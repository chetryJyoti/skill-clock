import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#B0B0B0",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 4,
          paddingVertical: 6,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF", // White background
          borderTopWidth: 0.5,
          borderTopColor: "#E0E0E0",
          height: Platform.OS === "ios" ? 80 : 70,
          paddingBottom: Platform.OS === "ios" ? 12 : 10,
          ...Platform.select({
            android: {
              marginHorizontal: 8,
              marginBottom: 30,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          }),
        },
      }}
    >
      <Tabs.Screen
        name="(skills)"
        options={{
          title: "Skills",
          tabBarIcon: ({ color, focused }) => (
            <Entypo name={focused ? "list" : "list"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: "Timer",
          tabBarIcon: ({ color, focused }) => (
            <Entypo
              name={focused ? "stopwatch" : "stopwatch"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
