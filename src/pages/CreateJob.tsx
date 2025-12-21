import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { RootStackParamList } from "../../App";
import api from "../config/api";
import { useUser } from "../context/UserContext";

type CreateJobScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateJob"
>;

const EXPERIENCE_LEVELS = ["Entry", "Intermediate", "Expert"] as const;

// Common skills for job posting
const AVAILABLE_SKILLS = [
  "React", "Vue", "Angular", "Node.js", "Python", "Java", "C#", ".NET",
  "PHP", "Go", "Rust", "Swift", "Kotlin", "React Native", "Flutter",
  "iOS", "Android", "Full-Stack", "Frontend", "Backend", "DevOps",
  "UI/UX Design", "Graphic Design", "Figma", "Photoshop", "Illustrator",
  "Video Editing", "3D Animation", "Copywriting", "SEO", "Marketing",
  "Data Science", "Machine Learning", "Cybersecurity", "Blockchain",
  "WordPress", "Shopify", "Webflow", "AWS", "Docker", "Git",
];

// Animated Pill Component
const AnimatedPill = ({ item, isSelected, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.pill,
          isSelected && styles.pillSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {item}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function CreateJob() {
  const navigation = useNavigation<CreateJobScreenNavigationProp>();
  const { user } = useUser();

  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [experienceLevel, setExperienceLevel] =
    useState<(typeof EXPERIENCE_LEVELS)[number]>("Intermediate");

  // Detailed fields
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projectScope, setProjectScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await api.get("/Skills");
      const skillNames = response.data.map((s: any) => s.skillName);
      setAvailableSkills([...AVAILABLE_SKILLS, ...skillNames].filter((v, i, a) => a.indexOf(v) === i));
    } catch (e) {
      console.log("Error fetching skills, using defaults:", e);
      setAvailableSkills(AVAILABLE_SKILLS);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async () => {
    if (!user || user.userType !== 1) {
      Alert.alert("Error", "Only clients can post jobs.");
      return;
    }
    if (!title || !description || !budget) {
      Alert.alert("Error", "Title, description, and budget are required.");
      return;
    }
    const parsedBudget = Number(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget <= 0) {
      Alert.alert("Error", "Budget must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clientId: user.userId,
        title,
        description,
        category: category || null,
        budget: parsedBudget,
        deadline: deadline || null,
        isRemote,
        experienceLevel,
        requiredSkills: selectedSkills.length > 0 ? selectedSkills.join(",") : null,
        projectScope: projectScope || null,
        deliverables: deliverables || null,
        timeline: timeline || null,
        additionalDetails: additionalDetails || null,
      };
      const response = await api.post("/Jobs", payload);
      const createdJob = response.data;

      Alert.alert("Success", "Job posted successfully.", [
        {
          text: "View job",
          onPress: () =>
            navigation.replace("ClientJobDetails", { jobId: createdJob.jobId }),
        },
        { text: "OK", onPress: () => navigation.goBack(), style: "cancel" },
      ]);
    } catch (error) {
      console.log("Create Job Error:", error);
      Alert.alert("Error", "Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior React Developer Needed"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what you need done in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Development, Design, Marketing"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        {/* Budget & Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget & Timeline</Text>

          <Text style={styles.label}>Budget (USD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="1000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Deadline</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD or '2 weeks', '1 month', etc."
            value={deadline}
            onChangeText={setDeadline}
          />

          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.label}>Remote Work</Text>
              <Text style={styles.hint}>Can this job be done remotely?</Text>
            </View>
            <Switch value={isRemote} onValueChange={setIsRemote} />
          </View>

          <Text style={styles.label}>Experience Level</Text>
          <View style={styles.levelRow}>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelChip,
                  experienceLevel === level && styles.levelChipActive,
                ]}
                onPress={() => setExperienceLevel(level)}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    experienceLevel === level && styles.levelChipTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Required Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          <Text style={styles.hint}>
            Select the skills needed for this project
          </Text>
          <View style={styles.pillContainer}>
            {availableSkills.slice(0, 30).map((skill) => (
              <AnimatedPill
                key={skill}
                item={skill}
                isSelected={selectedSkills.includes(skill)}
                onPress={() => toggleSkill(skill)}
              />
            ))}
          </View>
          {selectedSkills.length > 0 && (
            <View style={styles.selectedSkillsContainer}>
              <Text style={styles.selectedSkillsLabel}>Selected:</Text>
              <Text style={styles.selectedSkillsText}>
                {selectedSkills.join(", ")}
              </Text>
            </View>
          )}
        </View>

        {/* Project Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>

          <Text style={styles.label}>Project Scope</Text>
          <Text style={styles.hint}>
            Describe the overall scope and objectives of the project
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is the main goal? What problems are you trying to solve?"
            value={projectScope}
            onChangeText={setProjectScope}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Expected Deliverables</Text>
          <Text style={styles.hint}>
            List what you expect to receive at the end of the project
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Fully functional website, Source code, Documentation, Design files..."
            value={deliverables}
            onChangeText={setDeliverables}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Timeline</Text>
          <Text style={styles.hint}>
            Expected duration or milestones for the project
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Phase 1: 2 weeks, Phase 2: 3 weeks, Final delivery: 1 month"
            value={timeline}
            onChangeText={setTimeline}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Additional Details</Text>
          <Text style={styles.hint}>
            Any other information that would help freelancers understand the project
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Team size, communication preferences, special requirements..."
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Post Job</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerTitle: {
    flex: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerRight: { flex: 1, alignItems: "flex-end" },
  iconBtn: { padding: 4 },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    marginBottom: 32,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#475569",
  },
  hint: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    color: "#0F172A",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5E5",
    backgroundColor: "#EFF6FF",
  },
  levelChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  levelChipTextActive: {
    color: "#FFF",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  pillSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  pillTextSelected: {
    color: "#FFF",
  },
  selectedSkillsContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  selectedSkillsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
  },
  selectedSkillsText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
