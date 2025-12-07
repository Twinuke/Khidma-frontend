import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
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

export default function CreateJob() {
  const navigation = useNavigation<CreateJobScreenNavigationProp>();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState(""); // simple text for now (YYYY-MM-DD)
  const [isRemote, setIsRemote] = useState(true);
  const [experienceLevel, setExperienceLevel] =
    useState<(typeof EXPERIENCE_LEVELS)[number]>("Intermediate");
  const [loading, setLoading] = useState(false);

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
      };

      const response = await api.post("/Jobs", payload);
      const createdJob = response.data;

      Alert.alert("Success", "Job posted successfully.", [
        {
          text: "View job",
          onPress: () =>
            navigation.replace("JobDetails", { jobId: createdJob.jobId }),
        },
        {
          text: "OK",
          onPress: () => navigation.goBack(),
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.log("Create Job Error:", error);
      Alert.alert("Error", "Failed to create job. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Post a Job</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Short job title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what you need done"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: Development, Design, Marketing"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>Budget (USD)</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: 100"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Deadline (optional, YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2025-12-31"
        value={deadline}
        onChangeText={setDeadline}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Remote job</Text>
        <Switch value={isRemote} onValueChange={setIsRemote} />
      </View>

      <Text style={styles.label}>Experience level</Text>
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

      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Posting..." : "Post Job"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 50 : 60,
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#0F172A",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#475569",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#EFF6FF",
  },
  levelChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  levelChipText: {
    fontSize: 13,
    color: "#1E293B",
  },
  levelChipTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
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
