import { Stack } from "expo-router";
import React from "react";

const SkillsLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="skills" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
};

export default SkillsLayout;
