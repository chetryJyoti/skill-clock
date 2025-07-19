import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Skill = {
  id: string;
  name: string;
  progress: number; // value between 0 and 1
  day: number;
  timeToday: string;
};

const skillsData: Skill[] = [
  {
    id: "1",
    name: "Data Structures",
    progress: 0.3,
    day: 3,
    timeToday: "12 min",
  },
  {
    id: "2",
    name: "System Design",
    progress: 0.2,
    day: 2,
    timeToday: "7 min",
  },
];

export default function SkillsScreen() {
  const hasSkills = skillsData.length > 0;

  const renderSkill = ({ item }: { item: Skill }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.skillName}>{item.name}</Text>
        <Text style={styles.day}>Day {item.day}</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View
          style={[styles.progressBarFill, { width: `${item.progress * 100}%` }]}
        />
      </View>
      <Text style={styles.timeToday}>Today: {item.timeToday}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Skills</Text>

      {hasSkills ? (
        <FlatList
          data={skillsData}
          renderItem={renderSkill}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No skills added yet.</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Skill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  skillName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  day: {
    fontSize: 14,
    color: "#555",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#000",
  },
  timeToday: {
    marginTop: 6,
    fontSize: 12,
    color: "#444",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
});
