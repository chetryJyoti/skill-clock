import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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

  const startTimer = () => {
    if (!selectedSkill) {
      Alert.alert(
        "Select a Skill",
        "Please select a skill to start practicing"
      );
      return;
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
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

    // Reset timer
    setSeconds(0);
    setIsRunning(false);

    // Show success message
    Alert.alert(
      "Session Saved! 🎉",
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

  const renderSkillOption = ({ item }: { item: Skill }) => (
    <TouchableOpacity
      style={[
        styles.skillOption,
        selectedSkill?.id === item.id && styles.skillOptionSelected,
      ]}
      onPress={() => selectSkill(item)}
    >
      <Text
        style={[
          styles.skillOptionText,
          selectedSkill?.id === item.id && styles.skillOptionTextSelected,
        ]}
      >
        {item.name}
      </Text>
      <Text style={styles.skillOptionTime}>
        {Math.floor((item.totalHours * 60 + item.totalMinutes) / 60)}h{" "}
        {(item.totalHours * 60 + item.totalMinutes) % 60}m
      </Text>
    </TouchableOpacity>
  );

  const timeDisplay = getTimeDisplay();

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
          style={styles.skillSelector}
          onPress={() => setShowSkillSelector(true)}
          disabled={isRunning}
        >
          <Text style={styles.skillSelectorLabel}>Current Skill</Text>
          <Text style={styles.skillSelectorText}>
            {selectedSkill ? selectedSkill.name : "Tap to select a skill"}
          </Text>
          <Text style={styles.skillSelectorArrow}>▼</Text>
        </TouchableOpacity>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeDisplay.main}</Text>
            <Text style={styles.timerUnit}>{timeDisplay.unit}</Text>
          </View>
        </View>

        {/* Session Info */}
        {selectedSkill && (
          <View style={styles.sessionInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Today's Total</Text>
              <Text style={styles.infoValue}>{selectedSkill.timeToday}m</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Overall Progress</Text>
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
              <Text style={styles.infoLabel}>Current Streak</Text>
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
                onPress={() => {
                  setSeconds(5 * 60);
                  startTimer();
                }}
              >
                <Text style={styles.quickTimeButtonText}>5m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => {
                  setSeconds(15 * 60);
                  startTimer();
                }}
              >
                <Text style={styles.quickTimeButtonText}>15m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => {
                  setSeconds(25 * 60);
                  startTimer();
                }}
              >
                <Text style={styles.quickTimeButtonText}>25m</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => {
                  setSeconds(60 * 60);
                  startTimer();
                }}
              >
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
            style={[styles.controlButton, styles.startButton]}
            onPress={startTimer}
            disabled={!selectedSkill}
          >
            <Text style={styles.startButtonText}>
              {seconds > 0 ? "▶ Resume" : "▶ Start"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={pauseTimer}
          >
            <Text style={styles.pauseButtonText}>⏸ Pause</Text>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryControls}>
          {seconds > 0 && (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetTimer}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, styles.finishButton]}
                onPress={finishSession}
              >
                <Text style={styles.finishButtonText}>Finish Session</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.noSkillsText}>No skills found</Text>
                <Text style={styles.noSkillsSubtext}>
                  Add a skill in the Skills tab first
                </Text>
                <TouchableOpacity
                  style={styles.addSkillButton}
                  onPress={() => {
                    setShowSkillSelector(false);
                    router.push("/(tabs)/skills");
                  }}
                >
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
  skillSelectorArrow: {
    position: "absolute",
    right: 20,
    top: "50%",
    fontSize: 16,
    color: "#666",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#000",
    fontFamily: "monospace",
  },
  timerUnit: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
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
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  quickTimeButtonText: {
    fontSize: 16,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
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
  secondaryControls: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
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
    justifyContent: "between",
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
  modalCloseText: {
    fontSize: 18,
    color: "#666",
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
  noSkillsContainer: {
    alignItems: "center",
    padding: 40,
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
    borderRadius: 8,
  },
  addSkillButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
