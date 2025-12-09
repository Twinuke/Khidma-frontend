import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

export default function JobDetails() {
  const { user } = useUser();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // JobId passed from Navigation (Notifications, Explore, etc.)
  const { jobId } = route.params;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false); // ✅ Track application status

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      // ✅ Pass userId to backend to check if we already bid
      const endpoint = user?.userId
        ? `/Jobs/${jobId}/${user.userId}`
        : `/Jobs/${jobId}`;

      const res = await api.get(endpoint);
      setJob(res.data);
      setHasApplied(res.data.hasBid); // ✅ Set status from backend
    } catch (e) {
      console.log("Error fetching job:", e);
      Alert.alert("Error", "Could not load job details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to apply for jobs.");
      return;
    }

    // ✅ REVERTED: Using standard navigation.
    // Ensure "BidForm" is registered in your navigation stack (e.g., in app/(tabs)/_layout.tsx or app/_layout.tsx)
    navigation.navigate("BidForm", { jobId: job.jobId, jobTitle: job.title });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!job) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.location || "Remote"}</Text>
          </View>
          <Text style={styles.date}>
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.price}>${job.budget}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillRow}>
              {job.skills.map((skill: any) => (
                <View key={skill.skillId} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Client Info */}
        <View style={styles.clientCard}>
          <Ionicons name="person-circle-outline" size={40} color="#64748B" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.clientName}>
              {job.client?.fullName || "Client"}
            </Text>
            <Text style={styles.clientLabel}>Job Poster</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Action Button */}
      <View style={styles.footer}>
        {hasApplied ? (
          // ✅ ALREADY APPLIED STATE
          <TouchableOpacity
            style={[styles.applyBtn, styles.disabledBtn]}
            disabled
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.applyBtnText}>Already Applied</Text>
          </TouchableOpacity>
        ) : (
          // ✅ APPLY NOW STATE
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  badgeText: { color: "#2563EB", fontSize: 12, fontWeight: "600" },
  date: { color: "#64748B", fontSize: 14 },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 8,
  },
  description: { fontSize: 15, lineHeight: 24, color: "#334155" },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skillText: { color: "#475569", fontSize: 13 },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  clientName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  clientLabel: { fontSize: 14, color: "#64748B" },
  footer: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  applyBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabledBtn: {
    backgroundColor: "#94A3B8", // Gray for disabled
  },
  applyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
