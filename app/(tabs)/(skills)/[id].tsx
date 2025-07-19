import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

export default function SkillDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkill();
  }, [id]);

  const loadSkill = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const skills: Skill[] = JSON.parse(stored);
        const foundSkill = skills.find((s) => s.id === id);
        setSkill(foundSkill || null);
      }
    } catch (error) {
      console.error("Failed to load skill:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTotalTime = (hours: number, minutes: number): string => {
    const totalMinutes = hours * 60 + minutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0 && m === 0) return "0 minutes";
    if (h === 0) return `${m} minute${m !== 1 ? "s" : ""}`;
    if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
    return `${h}h ${m}m`;
  };

  const getProgress = (hours: number, minutes: number): number => {
    const totalMinutes = hours * 60 + minutes;
    const targetMinutes = 10000 * 60; // 10,000 hours in minutes
    return Math.min(totalMinutes / targetMinutes, 1);
  };

  const getProgressPercentage = (hours: number, minutes: number): string => {
    const progress = getProgress(hours, minutes);
    return (progress * 100).toFixed(1);
  };

  const getDaysWorking = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRecentSessions = (): Session[] => {
    if (!skill?.sessions) return [];
    return skill.sessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7); // Last 7 sessions
  };

  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const startTimer = () => {
    // Navigate to timer with this skill pre-selected
    router.push(
      `/(tabs)/timer?skillId=${skill?.id}&skillName=${encodeURIComponent(
        skill?.name || ""
      )}`
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Skill not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getProgress(skill.totalHours, skill.totalMinutes);
  const daysWorking = getDaysWorking(skill.createdAt);
  const recentSessions = getRecentSessions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.skillName}>{skill.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress Overview</Text>

          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>
                {getProgressPercentage(skill.totalHours, skill.totalMinutes)}%
              </Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatTotalTime(skill.totalHours, skill.totalMinutes)}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysWorking}</Text>
              <Text style={styles.statLabel}>Days Working</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{skill.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {formatTotalTime(skill.totalHours, skill.totalMinutes)} / 10,000
              hours
            </Text>
          </View>
        </View>

        {/* Today's Practice */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Practice</Text>
          <View style={styles.todayContainer}>
            <Text style={styles.todayTime}>
              {skill.timeToday > 0
                ? `${skill.timeToday} minutes`
                : "No practice yet today"}
            </Text>
            {skill.timeToday > 0 && (
              <Text style={styles.todayEncouragement}>Great work! 🎉</Text>
            )}
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>

          {recentSessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {recentSessions.map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>
                      {formatSessionDate(session.date)}
                    </Text>
                    <Text style={styles.sessionDuration}>
                      {session.duration} min
                    </Text>
                  </View>
                  <View style={styles.sessionBar}>
                    <View
                      style={[
                        styles.sessionBarFill,
                        {
                          width: `${Math.min(
                            (session.duration / 120) * 100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noSessionsContainer}>
              <Text style={styles.noSessionsText}>
                No practice sessions yet
              </Text>
              <Text style={styles.noSessionsSubtext}>
                Start your first session below!
              </Text>
            </View>
          )}
        </View>

        {/* Streak Visualization */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-Day Streak</Text>
          <View style={styles.streakContainer}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const hasSession = recentSessions.some(
                (session) =>
                  new Date(session.date).toDateString() === date.toDateString()
              );

              return (
                <View key={i} style={styles.streakDay}>
                  <View
                    style={[
                      styles.streakDot,
                      hasSession && styles.streakDotActive,
                    ]}
                  />
                  <Text style={styles.streakDayLabel}>
                    {date.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Start Timer Button */}
      <View style={styles.timerButtonContainer}>
        <TouchableOpacity
          style={styles.timerButton}
          onPress={startTimer}
          activeOpacity={0.8}
        >
          <Text style={styles.timerButtonText}>▶ Start Practice Session</Text>
        </TouchableOpacity>
      </View>
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
  errorText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
  },
  skillName: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  progressCircleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  progressBarContainer: {
    marginTop: 8,
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
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  todayContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  todayTime: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  todayEncouragement: {
    fontSize: 14,
    color: "#666",
  },
  sessionsList: {
    gap: 12,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionInfo: {
    minWidth: 80,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
    color: "#666",
  },
  sessionBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
  },
  sessionBarFill: {
    height: "100%",
    backgroundColor: "#000",
  },
  noSessionsContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noSessionsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  noSessionsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  streakContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  streakDay: {
    alignItems: "center",
    gap: 8,
  },
  streakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  streakDotActive: {
    backgroundColor: "#000",
  },
  streakDayLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  timerButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  timerButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
