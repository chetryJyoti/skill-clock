import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "Are you sure you want to delete all progress and skills?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => console.log("Reset confirmed"),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.heading}>Settings</Text>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.item}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>guest@skillclock.app</Text>
        </View>
        {/* Add a logout button here if needed */}
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor="#fff"
            trackColor={{ true: "#555", false: "#777" }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Daily Reminder</Text>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            thumbColor="#fff"
            trackColor={{ true: "#555", false: "#777" }}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => Linking.openURL("https://skillclock.app")}
        >
          <Text style={styles.label}>About SkillClock</Text>
        </TouchableOpacity>
        <View style={styles.item}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.value}>v1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.item} onPress={handleReset}>
          <Text style={[styles.label, { color: "#f87171" }]}>
            Reset All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <TouchableOpacity
          style={styles.item}
          onPress={() => Linking.openURL("mailto:feedback@skillclock.app")}
        >
          <Text style={styles.label}>Send Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=skillclock"
            )
          }
        >
          <Text style={styles.label}>Rate the App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    // color: "#fff",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    // color: "#888",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  label: {
    fontSize: 16,
    // color: "#fff",
  },
  value: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
});
