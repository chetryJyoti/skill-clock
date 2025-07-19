import AsyncStorage from "@react-native-async-storage/async-storage";
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

type Skill = {
  id: string;
  name: string;
  totalHours: number;
  totalMinutes: number;
  currentStreak: number;
  timeToday: number; // minutes today
  lastPracticed?: string;
  createdAt: string;
};

const STORAGE_KEY = "skillclock_skills";

export default function SkillsScreen() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [loading, setLoading] = useState(true);

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
    };

    const updatedSkills = [...skills, newSkill];
    saveSkills(updatedSkills);
    setNewSkillName("");
    setShowAddModal(false);
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

  const getProgress = (hours: number, minutes: number): number => {
    const totalMinutes = hours * 60 + minutes;
    const targetMinutes = 10000 * 60; // 10,000 hours in minutes
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
    const progress = getProgress(item.totalHours, item.totalMinutes);
    const daysWorking = getDaysWorking(item.createdAt);
    const todayTime = item.timeToday;

    return (
      <TouchableOpacity
        style={styles.card}
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
            {formatTime(item.totalHours, item.totalMinutes)} / 10,000h
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.todayTime}>
            Today: {todayTime > 0 ? `${todayTime}m` : "No practice yet"}
          </Text>
          {item.currentStreak > 0 && (
            <Text style={styles.streak}>
              🔥 {item.currentStreak} day streak
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
            Add your first skill and start your journey to 10,000 hours
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

      {/* Add Skill Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Skill</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter skill name (e.g., Guitar, Coding, Drawing)"
              value={newSkillName}
              onChangeText={setNewSkillName}
              autoFocus
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewSkillName("");
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
  },
  todayTime: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
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
    width: "80%",
    maxWidth: 320,
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
  input: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
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
