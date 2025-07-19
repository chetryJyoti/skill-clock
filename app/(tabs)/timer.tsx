import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Skill = {
  id: string;
  name: string;
  totalHours: number;
  totalMinutes: number;
  currentStreak: number;
  timeToday: number;
  lastPracticed?: string;
  createdAt: string;
  sessions?: Session[];
};

type Session = {
  id: string;
  date: string;
  duration: number; // minutes
  notes?: string;
};

const STORAGE_KEY = "skillclock_skills";

export default function TimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Timer states
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  // Load skills and handle pre-selected skill
  useEffect(() => {
    loadSkills();
  }, []);

  // Handle pre-selected skill from navigation params
  useEffect(() => {
    if (params.skillId && skills.length > 0) {
      const skill = skills.find((s) => s.id === params.skillId);
      if (skill) {
        setSelectedSkill(skill);
      }
    }
  }, [params.skillId, skills]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && seconds !== 0) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  // Keyboard shortcuts for web
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" && selectedSkill) {
        event.preventDefault();
        isRunning ? pauseTimer() : startTimer();
      }
    };

    if (Platform.OS === "web") {
      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }
  }, [isRunning, selectedSkill]);

  const loadSkills = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSkills(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load skills:", error);
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

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimeDisplay = (): { main: string; unit: string } => {
    const totalSeconds = seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return {
        main: `${hours}:${minutes.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`,
        unit: "hours",
      };
    } else if (minutes > 0) {
      return {
        main: `${minutes}:${secs.toString().padStart(2, "0")}`,
        unit: "minutes",
      };
    }
    return {
      main: secs.toString(),
      unit: "seconds",
    };
  };

  const timeDisplay = useMemo(() => getTimeDisplay(), [seconds]);

  const startTimer = () => {
    if (!selectedSkill) {
      Alert.alert(
        "Select a Skill",
        "Please select a skill to start practicing"
      );
      return;
    }

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (seconds > 0) {
      Alert.alert(
        "Reset Timer",
        "Are you sure you want to reset? Your progress will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: () => {
              setIsRunning(false);
              setSeconds(0);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            },
          },
        ]
      );
    }
  };

  const finishSession = () => {
    if (seconds < 60) {
      Alert.alert(
        "Short Session",
        "Sessions shorter than 1 minute won't be saved. Continue practicing or reset?",
        [
          { text: "Continue", style: "cancel" },
          {
            text: "Reset",
            onPress: () => {
              setSeconds(0);
              setIsRunning(false);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Finish Session",
      `Great work! You practiced for ${formatTime(
        seconds
      )}. Save this session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save Session",
          onPress: saveSession,
        },
      ]
    );
  };

  const saveSession = async () => {
    if (!selectedSkill) return;

    const sessionMinutes = Math.floor(seconds / 60);
    const newSession: Session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: sessionMinutes,
    };

    // Update skill with new session data
    const updatedSkills = skills.map((skill) => {
      if (skill.id === selectedSkill.id) {
        const updatedSessions = skill.sessions || [];
        updatedSessions.push(newSession);

        // Update totals
        const totalMinutes = skill.totalMinutes + sessionMinutes;
        const newTotalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        // Update today's time (simplified - in real app, check if same day)
        const newTimeToday = skill.timeToday + sessionMinutes;

        // Update streak (simplified logic)
        const today = new Date().toDateString();
        const lastPracticedDate = skill.lastPracticed
          ? new Date(skill.lastPracticed).toDateString()
          : null;
        let newStreak = skill.currentStreak;

        if (lastPracticedDate !== today) {
          newStreak = skill.currentStreak + 1;
        }

        return {
          ...skill,
          totalHours: newTotalHours,
          totalMinutes: remainingMinutes,
          timeToday: newTimeToday,
          currentStreak: newStreak,
          lastPracticed: new Date().toISOString(),
          sessions: updatedSessions,
        };
      }
      return skill;
    });

    await saveSkills(updatedSkills);

    // Update local selected skill
    const updatedSelectedSkill = updatedSkills.find(
      (s) => s.id === selectedSkill.id
    );
    if (updatedSelectedSkill) {
      setSelectedSkill(updatedSelectedSkill);
    }

    // Success haptic
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Reset timer
    setSeconds(0);
    setIsRunning(false);

    // Show success message
    Alert.alert(
      "Session Saved!",
      `${sessionMinutes} minutes added to ${selectedSkill.name}`,
      [{ text: "Great!", onPress: () => {} }]
    );
  };

  const selectSkill = (skill: Skill) => {
    if (isRunning) {
      Alert.alert(
        "Timer Running",
        "Stop the current timer before switching skills",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedSkill(skill);
    setShowSkillSelector(false);
    setSeconds(0); // Reset timer when switching skills
  };

  const quickStart = (minutes: number) => {
    setSeconds(minutes * 60);
    startTimer();
  };

  const renderSkillOption = useCallback(
    ({ item }: { item: Skill }) => (
      <TouchableOpacity
        style={[
          styles.skillOption,
          selectedSkill?.id === item.id && styles.skillOptionSelected,
        ]}
        onPress={() => selectSkill(item)}
      >
        <View style={styles.skillOptionContent}>
          <View style={styles.skillOptionLeft}>
            <Text
              style={[
                styles.skillOptionText,
                selectedSkill?.id === item.id && styles.skillOptionTextSelected,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.skillOptionTime,
                selectedSkill?.id === item.id && styles.skillOptionTimeSelected,
              ]}
            >
              {Math.floor((item.totalHours * 60 + item.totalMinutes) / 60)}h{" "}
              {(item.totalHours * 60 + item.totalMinutes) % 60}m
            </Text>
          </View>
          {selectedSkill?.id === item.id && (
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    ),
    [selectedSkill]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Timer</Text>
          <Text style={styles.subtitle}>
            {selectedSkill
              ? `Practicing ${selectedSkill.name}`
              : "Select a skill to start"}
          </Text>
        </View>

        {/* Skill Selector */}
        <TouchableOpacity
          style={[
            styles.skillSelector,
            !selectedSkill && styles.skillSelectorEmpty,
            isRunning && styles.disabled,
          ]}
          onPress={() => setShowSkillSelector(true)}
          disabled={isRunning}
        >
          <View style={styles.skillSelectorContent}>
            <View style={styles.skillSelectorLeft}>
              <Text style={styles.skillSelectorLabel}>Current Skill</Text>
              <Text style={styles.skillSelectorText}>
                {selectedSkill ? selectedSkill.name : "Select a skill to start"}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={isRunning ? "#ccc" : "#666"}
            />
          </View>
        </TouchableOpacity>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <View style={styles.timerContent}>
              <Text style={styles.timerText}>{timeDisplay.main}</Text>
              <Text style={styles.timerUnit}>{timeDisplay.unit}</Text>
              <View
                style={[styles.statusDot, isRunning && styles.statusDotActive]}
              />
            </View>
          </View>
        </View>

        {/* Session Info */}
        {selectedSkill && (
          <View style={styles.sessionInfo}>
            <View style={styles.infoItem}>
              <Ionicons
                name="today"
                size={20}
                color="#666"
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>Today</Text>
              <Text style={styles.infoValue}>{selectedSkill.timeToday}m</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="trending-up"
                size={20}
                color="#666"
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoValue}>
                {Math.floor(
                  (selectedSkill.totalHours * 60 + selectedSkill.totalMinutes) /
                    60
                )}
                h{" "}
                {(selectedSkill.totalHours * 60 + selectedSkill.totalMinutes) %
                  60}
                m
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="flame"
                size={20}
                color="#666"
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>Streak</Text>
              <Text style={styles.infoValue}>
                {selectedSkill.currentStreak} days
              </Text>
            </View>
          </View>
        )}

        {/* Quick Time Buttons */}
        {!isRunning && seconds === 0 && selectedSkill && (
          <View style={styles.quickTimeContainer}>
            <Text style={styles.quickTimeLabel}>Quick Start</Text>
            <View style={styles.quickTimeButtons}>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => quickStart(5)}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color="#000"
                  style={styles.quickTimeIcon}
                />
                <Text style={styles.quickTimeButtonText}>5m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => quickStart(15)}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color="#000"
                  style={styles.quickTimeIcon}
                />
                <Text style={styles.quickTimeButtonText}>15m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => quickStart(25)}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color="#000"
                  style={styles.quickTimeIcon}
                />
                <Text style={styles.quickTimeButtonText}>25m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => quickStart(60)}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color="#000"
                  style={styles.quickTimeIcon}
                />
                <Text style={styles.quickTimeButtonText}>1h</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.startButton,
              !selectedSkill && styles.disabledButton,
            ]}
            onPress={startTimer}
            disabled={!selectedSkill}
          >
            <Ionicons
              name="play"
              size={24}
              color={!selectedSkill ? "#ccc" : "#fff"}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.startButtonText,
                !selectedSkill && styles.disabledButtonText,
              ]}
            >
              {seconds > 0 ? "Resume" : "Start"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={pauseTimer}
          >
            <Ionicons
              name="pause"
              size={24}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryControls}>
          {seconds > 0 && (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetTimer}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color="#000"
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, styles.finishButton]}
                onPress={finishSession}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.finishButtonText}>Finish</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Skill Selector Modal */}
      <Modal
        visible={showSkillSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSkillSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Skill</Text>
              <TouchableOpacity
                onPress={() => setShowSkillSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {skills.length > 0 ? (
              <FlatList
                data={skills}
                renderItem={renderSkillOption}
                keyExtractor={(item) => item.id}
                style={styles.skillsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noSkillsContainer}>
                <Ionicons
                  name="add-circle-outline"
                  size={64}
                  color="#ccc"
                  style={styles.noSkillsIcon}
                />
                <Text style={styles.noSkillsText}>No skills found</Text>
                <Text style={styles.noSkillsSubtext}>
                  Add a skill in the Skills tab first
                </Text>
                <TouchableOpacity
                  style={styles.addSkillButton}
                  onPress={() => {
                    setShowSkillSelector(false);
                    router.push("/(tabs)/(skills)");
                  }}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.addSkillButtonText}>Go to Skills</Text>
                </TouchableOpacity>
              </View>
            )}
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
  content: {
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
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
  skillSelector: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
  },
  skillSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillSelectorLeft: {
    flex: 1,
  },
  skillSelectorEmpty: {
    borderStyle: "dashed",
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
  },
  skillSelectorLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  skillSelectorText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    // shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  timerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#000",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  timerUnit: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ccc",
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#000",
  },
  statusDotActive: {
    backgroundColor: "#000",
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  infoIcon: {
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  quickTimeContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickTimeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  quickTimeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  quickTimeButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  quickTimeIcon: {
    marginBottom: 4,
  },
  quickTimeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  controlButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  startButton: {
    backgroundColor: "#000",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  pauseButton: {
    backgroundColor: "#666",
  },
  pauseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  disabledButtonText: {
    color: "#ccc",
  },
  secondaryControls: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  finishButton: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  skillsList: {
    paddingHorizontal: 20,
  },
  skillOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "transparent",
  },
  skillOptionSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  skillOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillOptionLeft: {
    flex: 1,
  },
  skillOptionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  skillOptionTextSelected: {
    color: "#fff",
  },
  skillOptionTime: {
    fontSize: 14,
    color: "#666",
  },
  skillOptionTimeSelected: {
    color: "#ccc",
  },
  noSkillsContainer: {
    alignItems: "center",
    padding: 40,
  },
  noSkillsIcon: {
    marginBottom: 16,
  },
  noSkillsText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  noSkillsSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  addSkillButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#000",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  addSkillButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
