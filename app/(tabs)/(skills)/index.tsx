import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from '@react-native-community/slider';
type Skill = {
  id: string;
  name: string;
  totalHours: number;
  totalMinutes: number;
  currentStreak: number;
  timeToday: number; // minutes today
  lastPracticed?: string;
  createdAt: string;
  // New fields
  dailyGoalMinutes: number; // daily practice goal in minutes
  totalGoalHours: number; // total hours goal (100, 500, 1000, etc.)
};

const STORAGE_KEY = "skillclock_skills";

// Predefined goal options
const GOAL_OPTIONS = [100, 200, 500, 1000, 2000, 5000, 10000];

export default function SkillsScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [loading, setLoading] = useState(true);

  // New modal state
  const [dailyMinutes, setDailyMinutes] = useState(30); // Default 30 minutes
  const [selectedGoal, setSelectedGoal] = useState(1000); // Default 1000 hours

  // Load skills on component mount
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSkills(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSkills = async (updatedSkills: Skill[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSkills));
      setSkills(updatedSkills);
    } catch (error) {
      console.error("Failed to save skills:", error);
    }
  };

  const calculateEstimatedDays = (
    totalHours: number,
    dailyMinutes: number
  ): number => {
    const totalMinutesNeeded = totalHours * 60;
    return Math.ceil(totalMinutesNeeded / dailyMinutes);
  };

  const formatEstimatedTime = (days: number): string => {
    if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return remainingDays > 0
        ? `${months}m ${remainingDays}d`
        : `${months} months`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      if (remainingMonths > 0) {
        return `${years}y ${remainingMonths}m`;
      }
      return `${years} ${years === 1 ? "year" : "years"}`;
    }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) {
      Alert.alert("Error", "Please enter a skill name");
      return;
    }

    if (
      skills.some(
        (skill) =>
          skill.name.toLowerCase() === newSkillName.trim().toLowerCase()
      )
    ) {
      Alert.alert("Error", "This skill already exists");
      return;
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: newSkillName.trim(),
      totalHours: 0,
      totalMinutes: 0,
      currentStreak: 0,
      timeToday: 0,
      createdAt: new Date().toISOString(),
      dailyGoalMinutes: dailyMinutes,
      totalGoalHours: selectedGoal,
    };

    const updatedSkills = [...skills, newSkill];
    saveSkills(updatedSkills);
    setNewSkillName("");
    setShowAddModal(false);
    // Reset modal state
    setDailyMinutes(30);
    setSelectedGoal(1000);
  };

  const deleteSkill = (skillId: string) => {
    Alert.alert(
      "Delete Skill",
      "Are you sure you want to delete this skill? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedSkills = skills.filter(
              (skill) => skill.id !== skillId
            );
            saveSkills(updatedSkills);
          },
        },
      ]
    );
  };

  const formatTime = (hours: number, minutes: number): string => {
    if (hours === 0 && minutes === 0) return "0h 0m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getProgress = (
    hours: number,
    minutes: number,
    goalHours: number
  ): number => {
    const totalMinutes = hours * 60 + minutes;
    const targetMinutes = goalHours * 60;
    return Math.min(totalMinutes / targetMinutes, 1);
  };

  const getDaysWorking = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderSkill = ({ item }: { item: Skill }) => {
    // Use default values for legacy skills without these fields
    const skillGoalHours = item.totalGoalHours || 10000;
    const skillDailyGoal = item.dailyGoalMinutes || 60;

    const progress = getProgress(
      item.totalHours,
      item.totalMinutes,
      skillGoalHours
    );
    const daysWorking = getDaysWorking(item.createdAt);
    const todayTime = item.timeToday;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/${item.id}`)}
        onLongPress={() => deleteSkill(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.skillName}>{item.name}</Text>
          <Text style={styles.daysWorking}>Day {daysWorking}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {formatTime(item.totalHours, item.totalMinutes)} /{" "}
            {skillGoalHours.toLocaleString()}h
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.todayTime}>
            Today: {todayTime > 0 ? `${todayTime}m` : "No practice yet"}
          </Text>
          <Text style={styles.dailyGoal}>Goal: {skillDailyGoal}m/day</Text>
          {item.currentStreak > 0 && (
            <Text style={styles.streak}>
              🔥 {item.currentStreak} day streak
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const estimatedDays = calculateEstimatedDays(selectedGoal, dailyMinutes);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>Your Skills</Text>
        <Text style={styles.subtitle}>
          {skills.length} skill{skills.length !== 1 ? "s" : ""} in progress
        </Text>
      </View>

      {skills.length > 0 ? (
        <FlatList
          data={skills}
          renderItem={renderSkill}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Ready to master a skill?</Text>
          <Text style={styles.emptySubtitle}>
            Add your first skill and start your personalized learning journey
          </Text>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Enhanced Add Skill Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Skill</Text>

            {/* Skill Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Skill Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Guitar, Coding, Drawing"
                value={newSkillName}
                onChangeText={setNewSkillName}
                maxLength={50}
              />
            </View>

            {/* Daily Practice Goal */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>
                Daily Practice Goal: {dailyMinutes} minutes
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={15}
                maximumValue={240}
                step={15}
                value={dailyMinutes}
                onValueChange={setDailyMinutes}
                minimumTrackTintColor="#000"
                maximumTrackTintColor="#e5e5e5"
                thumbStyle={styles.sliderThumb}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>15m</Text>
                <Text style={styles.sliderLabel}>4h</Text>
              </View>
            </View>

            {/* Total Hours Goal */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Total Hours Goal</Text>
              <View style={styles.goalOptions}>
                {GOAL_OPTIONS.map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.goalOption,
                      selectedGoal === hours && styles.goalOptionSelected,
                    ]}
                    onPress={() => setSelectedGoal(hours)}
                  >
                    <Text
                      style={[
                        styles.goalOptionText,
                        selectedGoal === hours && styles.goalOptionTextSelected,
                      ]}
                    >
                      {hours.toLocaleString()}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Estimation */}
            <View style={styles.estimationSection}>
              <Text style={styles.estimationTitle}>📊 Your Journey</Text>
              <Text style={styles.estimationText}>
                Practicing {dailyMinutes} minutes daily, you'll reach your{" "}
                {selectedGoal.toLocaleString()} hour goal in approximately:
              </Text>
              <Text style={styles.estimationTime}>
                {formatEstimatedTime(estimatedDays)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewSkillName("");
                  setDailyMinutes(30);
                  setSelectedGoal(1000);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={addSkill}
              >
                <Text style={styles.addButtonTextModal}>Add Skill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  skillName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    flex: 1,
    marginRight: 12,
  },
  daysWorking: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e5e5e5",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#000",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  todayTime: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  dailyGoal: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  streak: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ff6b35",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowRadius: 0,
    elevation: 8,
  },
  fabText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 380,
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#000",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#000",
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
  },
  goalOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  goalOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  goalOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  goalOptionTextSelected: {
    color: "#fff",
  },
  estimationSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  estimationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  estimationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  estimationTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  addButtonModal: {
    backgroundColor: "#000",
  },
  addButtonTextModal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
