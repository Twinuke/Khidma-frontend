import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BidForm } from "../components/BidForm";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { Job } from "../types/job";

export default function JobDetails() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, refreshCounts } = useUser();
  const insets = useSafeAreaInsets();

  const { jobId, hasPlacedBid: paramHasBid } = route.params || {};
  const initialJobData = route.params?.jobData as Job;

  const [job, setJob] = useState<Job | null>(initialJobData || null);
  const [loading, setLoading] = useState(!initialJobData);
  const [modalVisible, setModalVisible] = useState(false);

  const hasPlacedBid = paramHasBid || job?.hasPlacedBid || false;

  useEffect(() => {
    if (!job && jobId) {
      fetchJobDetails();
    }
    // ✅ Mark related notifications as read when viewing this job
    markNotificationsAsRead();
  }, [jobId]);

  const markNotificationsAsRead = async () => {
    if (!user || !jobId) return;
    try {
      // If Client -> Mark "BidPlaced" (Type 1) as read for this JobId
      // If Freelancer -> Mark "BidAccepted" (Type 2) as read for this JobId
      const type = user.userType === 1 ? 1 : 2;
      await api.post(
        `/Notifications/mark-related?userId=${user.userId}&type=${type}&entityId=${jobId}`
      );
      refreshCounts();
    } catch (e) {
      console.log(e);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/Jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.log("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !job) return;
    try {
      const response = await api.post("/Chat/open", {
        user1Id: user.userId,
        user2Id: job.client?.userId,
        jobId: job.jobId,
      });
      navigation.navigate("ChatScreen", {
        conversationId: response.data.conversationId,
        otherUser: job.client,
      });
    } catch (e) {
      console.log("Chat Error:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Job not found or deleted.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = user?.userId === job.client?.userId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
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
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.posted}>
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </Text>

          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget:</Text>
            <Text style={styles.budgetAmount}>${job.budget}</Text>
          </View>
        </View>

        {hasPlacedBid && (
          <View style={styles.bidPlacedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#15803D" />
            <Text style={styles.bidPlacedText}>
              You have already placed a bid on this job.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailItem}>
            <Ionicons name="folder-outline" size={18} color="#64748B" />
            <Text style={styles.detailText}>
              Category: {job.category || "N/A"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="globe-outline" size={18} color="#64748B" />
            <Text style={styles.detailText}>
              {job.isRemote ? "Remote" : "On-Site"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="ribbon-outline" size={18} color="#64748B" />
            <Text style={styles.detailText}>
              {job.experienceLevel || "Intermediate"}
            </Text>
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>About the Client</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={{ color: "#2563EB", fontWeight: "bold" }}>
                {job.client?.fullName?.[0] || "C"}
              </Text>
            </View>
            <View>
              <Text style={styles.clientName}>
                {job.client?.fullName || "Client"}
              </Text>
              <Text style={styles.clientMeta}>Verified Client</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {!isOwner ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.bidBtn,
                {
                  flex: 1,
                  backgroundColor: "#FFF",
                  borderWidth: 1,
                  borderColor: "#2563EB",
                },
              ]}
              onPress={handleStartChat}
            >
              <Text style={[styles.bidBtnText, { color: "#2563EB" }]}>
                Chat
              </Text>
            </TouchableOpacity>

            {!hasPlacedBid ? (
              <TouchableOpacity
                style={[styles.bidBtn, { flex: 2 }]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.bidBtnText}>Apply Now</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.bidBtn, styles.bidBtnDisabled, { flex: 2 }]}
                disabled={true}
              >
                <Text style={[styles.bidBtnText, styles.bidBtnTextDisabled]}>
                  Bid Placed
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.ownJobText}>You posted this job</Text>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {user ? (
            <BidForm
              jobId={job.jobId}
              freelancerId={user.userId}
              onCancel={() => setModalVisible(false)}
              onSuccess={() => {
                setModalVisible(false);
                navigation.goBack();
              }}
            />
          ) : (
            <ActivityIndicator size="large" color="#FFF" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { padding: 20 },
  mainInfo: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  posted: { color: "#64748B", marginBottom: 16 },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  budgetLabel: { marginRight: 8, color: "#64748B" },
  budgetAmount: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  bidPlacedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  bidPlacedText: { color: "#15803D", fontWeight: "600", marginLeft: 8 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  descText: { fontSize: 15, lineHeight: 24, color: "#334155" },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  detailText: { fontSize: 15, color: "#475569" },
  clientSection: { backgroundColor: "#F8FAFC", padding: 16, borderRadius: 16 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  clientMeta: { color: "#64748B", fontSize: 13 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
  },
  bidBtn: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  bidBtnDisabled: { backgroundColor: "#E2E8F0" },
  bidBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  bidBtnTextDisabled: { color: "#94A3B8" },
  ownJobText: { textAlign: "center", color: "#64748B", fontStyle: "italic" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: { color: "#FFF", fontWeight: "600" },
});
