import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const [deadline, setDeadline] = useState("");
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
          // ✅ FIX: Redirect Client to ClientJobDetails, not JobDetails
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
      {/* ✅ Standardized Header */}
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
      >
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
          placeholder="e.g. Development, Design"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Budget (USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="100"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
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
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // ✅ Standard Header
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
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#475569" },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: { height: 120, textAlignVertical: "top" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#EFF6FF",
  },
  levelChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  levelChipText: { fontSize: 13, color: "#1E293B" },
  levelChipTextActive: { color: "#FFF", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
