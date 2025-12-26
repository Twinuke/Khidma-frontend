import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

export default function ClientWorkUpdates() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [responseText, setResponseText] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (user?.userId) {
        fetchJobs();
      }
    }, [user?.userId])
  );

  const fetchJobs = async () => {
    try {
      const res = await api.get(`/Jobs/client/${user?.userId}`);
      setJobs(res.data);
    } catch (e) {
      console.log("Error fetching jobs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUpdates = async (jobId: number) => {
    try {
      const res = await api.get(`/Workspace/job/${jobId}`);
      setUpdates(res.data);
    } catch (e) {
      console.log("Error fetching updates:", e);
      Alert.alert("Error", "Failed to load updates");
    }
  };

  const handleJobPress = (job: any) => {
    setSelectedJob(job);
    fetchUpdates(job.jobId);
  };

  const handleUpdatePress = (update: any) => {
    setSelectedUpdate(update);
    setResponseText("");
    setShowUpdateModal(true);
  };

  const handleApprove = async () => {
    if (!selectedUpdate) return;
    try {
      await api.post(`/Workspace/update/${selectedUpdate.updateId}/approve`, {
        clientId: user?.userId,
        response: responseText || "Approved",
      });
      Alert.alert("Success", "Update approved");
      setShowUpdateModal(false);
      fetchUpdates(selectedJob.jobId);
    } catch (e: any) {
      console.log("Approve error:", e);
      Alert.alert("Error", e.response?.data?.error || "Failed to approve");
    }
  };

  const handleDismiss = async () => {
    if (!selectedUpdate) return;
    try {
      await api.post(`/Workspace/update/${selectedUpdate.updateId}/dismiss`, {
        clientId: user?.userId,
        response: responseText || "Dismissed",
      });
      Alert.alert("Success", "Update dismissed");
      setShowUpdateModal(false);
      fetchUpdates(selectedJob.jobId);
    } catch (e: any) {
      console.log("Dismiss error:", e);
      Alert.alert("Error", e.response?.data?.error || "Failed to dismiss");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case "Progress": return "#3B82F6";
      case "Milestone": return "#10B981";
      case "Question": return "#F59E0B";
      case "Deliverable": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const renderJobCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => handleJobPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.jobCardHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </View>
      <View style={styles.jobCardFooter}>
        <View style={styles.jobStat}>
          <Ionicons name="cash-outline" size={14} color="#64748B" />
          <Text style={styles.jobStatText}>${item.budget}</Text>
        </View>
        <View style={styles.jobStat}>
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text style={styles.jobStatText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUpdateCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.updateCard}
      onPress={() => handleUpdatePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.updateHeader}>
        <View style={styles.updateAuthor}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.freelancer?.fullName?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.updateAuthorName}>{item.freelancer?.fullName || "Unknown"}</Text>
            <Text style={styles.updateDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.updateTypeBadge, { backgroundColor: getUpdateTypeColor(item.updateType) + "20" }]}>
          <Text style={[styles.updateTypeText, { color: getUpdateTypeColor(item.updateType) }]}>
            {item.updateType}
          </Text>
        </View>
      </View>
      {item.title && <Text style={styles.updateTitle}>{item.title}</Text>}
      <Text style={styles.updateContent} numberOfLines={3}>{item.content}</Text>

      {item.status === 0 ? (
        <View style={styles.updateActions}>
          <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleUpdatePress(item)}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleUpdatePress(item)}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 1 ? "#DCFCE7" : "#FEE2E2" }]}>
            <Ionicons
              name={item.status === 1 ? "checkmark-circle" : "close-circle"}
              size={14}
              color={item.status === 1 ? "#10B981" : "#EF4444"}
            />
            <Text style={[styles.statusBadgeText, { color: item.status === 1 ? "#10B981" : "#EF4444" }]}>
              {item.status === 1 ? "Approved" : "Dismissed"}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (selectedJob) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{selectedJob.title}</Text>
              <Text style={styles.headerSubtitle}>Work Updates</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
        ) : (
          <FlatList
            data={updates}
            renderItem={renderUpdateCard}
            keyExtractor={(item) => item.updateId.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchUpdates(selectedJob.jobId); }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No updates yet</Text>
                <Text style={styles.emptySubtext}>Updates from your freelancer will appear here</Text>
              </View>
            }
          />
        )}

        <Modal visible={showUpdateModal} transparent animationType="fade" onRequestClose={() => setShowUpdateModal(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                <View style={styles.popupContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedUpdate?.status === 0 ? "Respond to Update" : "Update Details"}
                    </Text>
                    <TouchableOpacity onPress={() => setShowUpdateModal(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {selectedUpdate && (
                    <>
                      <View style={styles.modalUpdatePreview}>
                        <Text style={styles.modalUpdateTitle}>{selectedUpdate.title || selectedUpdate.updateType}</Text>
                        <Text style={styles.modalUpdateContent}>{selectedUpdate.content}</Text>
                      </View>

                      {selectedUpdate.status === 0 ? (
                        <>
                          <Text style={styles.modalLabel}>Your Response (Optional)</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="Add a comment or feedback..."
                            value={responseText}
                            onChangeText={setResponseText}
                            multiline
                            numberOfLines={4}
                          />
                          <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalApproveBtn]} onPress={handleApprove}>
                              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                              <Text style={styles.modalApproveText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalDismissBtn]} onPress={handleDismiss}>
                              <Ionicons name="close-circle" size={20} color="#FFF" />
                              <Text style={styles.modalDismissText}>Dismiss</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <View style={styles.processedState}>
                          <Ionicons
                            name={selectedUpdate.status === 1 ? "checkmark-done-circle" : "alert-circle"}
                            size={32}
                            color={selectedUpdate.status === 1 ? "#10B981" : "#EF4444"}
                          />
                          <Text style={[styles.processedText, { color: selectedUpdate.status === 1 ? "#10B981" : "#EF4444" }]}>
                            This update was {selectedUpdate.status === 1 ? "Approved" : "Dismissed"}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Work Updates</Text>
            <Text style={styles.headerSubtitle}>Review job progress</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.jobId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJobs(); }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Create a job to start receiving updates</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 8, marginRight: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#94A3B8" },
  listContent: { padding: 20, paddingBottom: 40 },
  jobCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  jobCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  jobTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 12 },
  jobCardFooter: { flexDirection: "row", gap: 20 },
  jobStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  jobStatText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  updateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  updateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  updateAuthor: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  updateAuthorName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  updateDate: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  updateTypeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  updateTypeText: { fontSize: 11, fontWeight: "700" },
  updateTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  updateContent: { fontSize: 14, color: "#475569", lineHeight: 20, marginBottom: 16 },
  updateActions: { flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12 },
  statusRow: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12, flexDirection: "row" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  statusBadgeText: { fontSize: 13, fontWeight: "700" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 6 },
  approveBtn: { backgroundColor: "#DCFCE7" },
  approveBtnText: { color: "#10B981", fontWeight: "700", fontSize: 14 },
  dismissBtn: { backgroundColor: "#FEE2E2" },
  dismissBtnText: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#94A3B8", marginTop: 8, textAlign: "center" },
  
  // POPUP MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  closeBtn: { padding: 4 },
  modalUpdatePreview: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 20 },
  modalUpdateTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  modalUpdateContent: { fontSize: 14, color: "#475569", lineHeight: 20 },
  modalLabel: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 8 },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 8 },
  modalApproveBtn: { backgroundColor: "#10B981" },
  modalApproveText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  modalDismissBtn: { backgroundColor: "#EF4444" },
  modalDismissText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  processedState: { alignItems: "center", padding: 20, backgroundColor: "#F8FAFC", borderRadius: 16 },
  processedText: { fontSize: 16, fontWeight: "700", marginTop: 8 },
});