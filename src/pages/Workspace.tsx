import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");

const UPDATE_TYPES = [
  { label: "Progress Update", value: "Progress", icon: "trending-up", color: "#2563EB" },
  { label: "Milestone", value: "Milestone", icon: "flag", color: "#059669" },
  { label: "Question", value: "Question", icon: "help-circle", color: "#CA8A04" },
  { label: "Deliverable", value: "Deliverable", icon: "checkmark-circle", color: "#DC2626" },
  { label: "General Update", value: "Update", icon: "document-text", color: "#64748B" },
];

export default function Workspace() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { jobId, jobData } = route.params || {};

  const [job, setJob] = useState<any>(jobData || null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Create Update State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [selectedType, setSelectedType] = useState("Update");
  const [posting, setPosting] = useState(false);

  // Tools State
  const [showTools, setShowTools] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchUpdates();
      checkUserRole();
    }
  }, [jobId, user]);

  const checkUserRole = async () => {
    if (!user || !jobId) return;
    
    try {
      // Get fresh job data if not available
      let currentJob = job;
      if (!currentJob) {
        const jobRes = await api.get(`/Jobs/${jobId}`);
        currentJob = jobRes.data;
        setJob(currentJob);
      }

      // Check if user is the client
      const clientId = currentJob?.clientId || currentJob?.client?.userId;
      if (clientId === user.userId) {
        setIsClient(true);
        setIsFreelancer(false);
        return;
      }

      // Check if user is the hired freelancer
      if (user.userType === 0) {
        const bidsRes = await api.get(`/Bids/job/${jobId}`);
        const myBid = bidsRes.data.find((b: any) => b.freelancerId === user.userId);
        if (myBid && myBid.status === 1) {
          setIsFreelancer(true);
          setIsClient(false);
        } else {
          setIsFreelancer(false);
          setIsClient(false);
        }
      }
    } catch (e) {
      console.log("Error checking user role:", e);
    }
  };

  const fetchJobDetails = async () => {
    try {
      if (!job && jobId) {
        const res = await api.get(`/Jobs/${jobId}`);
        setJob(res.data);
      }
    } catch (e) {
      console.log("Error fetching job:", e);
    }
  };

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/Workspace/job/${jobId}`);
      if (res.data && Array.isArray(res.data)) {
        setUpdates(res.data);
      }
    } catch (e: any) {
      console.log("Error fetching updates:", e);
      Alert.alert("Error", "Failed to load workspace updates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUpdates();
  };

  const handleCreateUpdate = async () => {
    if (!updateContent.trim() || !user?.userId) {
      Alert.alert("Error", "Please enter update content");
      return;
    }

    setPosting(true);
    try {
      await api.post("/Workspace/update", {
        jobId: jobId,
        freelancerId: user.userId,
        title: updateTitle.trim() || null,
        content: updateContent.trim(),
        updateType: selectedType,
      });

      setCreateModalVisible(false);
      setUpdateTitle("");
      setUpdateContent("");
      setSelectedType("Update");
      fetchUpdates();
      Alert.alert("Success", "Update posted successfully!");
    } catch (e: any) {
      console.log("Create update error:", e);
      Alert.alert("Error", e.response?.data?.error || "Failed to create update");
    } finally {
      setPosting(false);
    }
  };

  const insertTool = (tool: string) => {
    const now = new Date();
    let insertText = "";

    switch (tool) {
      case "date":
        insertText = now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        break;
      case "time":
        insertText = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
      case "datetime":
        insertText = now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
      case "table":
        insertText = `\n\n📊 Progress Table:\n┌─────────────┬──────────────┬─────────────┐\n│ Task        │ Status       │ Progress    │\n├─────────────┼──────────────┼─────────────┤\n│ Task 1      │ In Progress  │ 75%         │\n│ Task 2      │ Completed    │ 100%        │\n│ Task 3      │ Pending      │ 0%          │\n└─────────────┴──────────────┴─────────────┘\n`;
        break;
      case "bullet":
        insertText = "\n• ";
        break;
      case "number":
        insertText = "\n1. ";
        break;
      case "divider":
        insertText = "\n\n─────────────────────────────\n\n";
        break;
    }

    setUpdateContent((prev) => prev + insertText);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderUpdate = ({ item }: { item: any }) => {
    const updateType = UPDATE_TYPES.find((t) => t.value === item.updateType) || UPDATE_TYPES[4];
    const formattedDate = formatDateTime(item.createdAt);

    return (
      <View style={styles.updateCard}>
        <View style={styles.updateHeader}>
          <View style={styles.updateHeaderLeft}>
            <View style={[styles.typeBadge, { backgroundColor: `${updateType.color}15` }]}>
              <Ionicons name={updateType.icon as any} size={16} color={updateType.color} />
              <Text style={[styles.typeText, { color: updateType.color }]}>
                {updateType.label}
              </Text>
            </View>
            {item.title && (
              <Text style={styles.updateTitle}>{item.title}</Text>
            )}
          </View>
          <Text style={styles.updateTime}>{formattedDate}</Text>
        </View>

        <Text style={styles.updateContent}>{item.content}</Text>

        <View style={styles.updateFooter}>
          <View style={styles.updateAuthor}>
            {item.freelancer?.profileImageUrl ? (
              <Image
                source={{ uri: item.freelancer.profileImageUrl }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={[styles.authorAvatar, styles.authorPlaceholder]}>
                <Text style={styles.authorInitials}>
                  {item.freelancer?.fullName?.[0] || "F"}
                </Text>
              </View>
            )}
            <Text style={styles.authorName}>
              {item.freelancer?.fullName || "Freelancer"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && updates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Workspace</Text>
              {job && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {job.title}
                </Text>
              )}
            </View>
            {isFreelancer && (
              <TouchableOpacity
                onPress={() => setCreateModalVisible(true)}
                style={styles.createBtn}
              >
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  style={styles.createBtnGradient}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Job Info Card */}
      {job && (
        <View style={styles.jobInfoCard}>
          <View style={styles.jobInfoRow}>
            <View style={styles.jobInfoItem}>
              <Ionicons name="briefcase-outline" size={18} color="#64748B" />
              <Text style={styles.jobInfoText}>{job.category}</Text>
            </View>
            <View style={styles.jobInfoItem}>
              <Ionicons name="cash-outline" size={18} color="#64748B" />
              <Text style={styles.jobInfoText}>${job.budget}</Text>
            </View>
            <View style={styles.jobInfoItem}>
              <Ionicons name="time-outline" size={18} color="#64748B" />
              <Text style={styles.jobInfoText}>
                {new Date(job.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Updates List */}
      <FlatList
        data={updates}
        keyExtractor={(item) => item.updateId.toString()}
        renderItem={renderUpdate}
        contentContainerStyle={styles.list}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptySubtitle}>
              Share your progress and keep the client informed
            </Text>
            {isFreelancer && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Create First Update</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {isClient && (
              <Text style={styles.emptySubtitle}>
                Waiting for freelancer updates...
              </Text>
            )}
          </View>
        }
      />

      {/* Create Update Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Update</Text>
            <TouchableOpacity
              onPress={handleCreateUpdate}
              disabled={posting || !updateContent.trim()}
            >
              <Text
                style={[
                  styles.modalPost,
                  (!updateContent.trim() || posting) && styles.modalPostDisabled,
                ]}
              >
                {posting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Update Type Selector */}
            <Text style={styles.modalLabel}>Update Type</Text>
            <View style={styles.typeSelector}>
              {UPDATE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    selectedType === type.value && {
                      backgroundColor: `${type.color}15`,
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => setSelectedType(type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={18}
                    color={selectedType === type.value ? type.color : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      selectedType === type.value && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title Input */}
            <Text style={styles.modalLabel}>Title (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Completed Phase 1"
              placeholderTextColor="#94A3B8"
              value={updateTitle}
              onChangeText={setUpdateTitle}
              maxLength={100}
            />

            {/* Content Input */}
            <View style={styles.contentHeader}>
              <Text style={styles.modalLabel}>Update Content</Text>
              <TouchableOpacity
                onPress={() => setShowTools(!showTools)}
                style={styles.toolsToggle}
              >
                <Ionicons
                  name={showTools ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#2563EB"
                />
                <Text style={styles.toolsToggleText}>Tools</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Tools */}
            {showTools && (
              <View style={styles.toolsContainer}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("date")}
                >
                  <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("time")}
                >
                  <Ionicons name="time-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("datetime")}
                >
                  <Ionicons name="calendar-number-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Date & Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("table")}
                >
                  <Ionicons name="grid-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Table</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("bullet")}
                >
                  <Ionicons name="ellipse-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Bullet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("number")}
                >
                  <Ionicons name="list-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Numbered</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => insertTool("divider")}
                >
                  <Ionicons name="remove-outline" size={18} color="#2563EB" />
                  <Text style={styles.toolBtnText}>Divider</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.modalTextArea}
              placeholder="Share your progress, milestones, questions, or deliverables..."
              placeholderTextColor="#94A3B8"
              value={updateContent}
              onChangeText={setUpdateContent}
              multiline
              autoFocus
              maxLength={5000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {updateContent.length}/5000
            </Text>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Ionicons name="bulb-outline" size={20} color="#CA8A04" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.tipsTitle}>Tips for effective updates:</Text>
                <Text style={styles.tipsText}>
                  • Be specific about progress and milestones{"\n"}
                  • Include dates and timelines{"\n"}
                  • Use tables for structured information{"\n"}
                  • Ask questions clearly when needed
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },
  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  iconBtn: { padding: 4, width: 40 },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  createBtnGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  jobInfoCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 120,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  jobInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  jobInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jobInfoText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  list: { padding: 16, paddingBottom: 100 },
  updateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  updateHeaderLeft: {
    flex: 1,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  updateTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  updateContent: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 24,
    marginBottom: 16,
  },
  updateFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  updateAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorPlaceholder: {
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  authorInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  modalCancel: { fontSize: 16, color: "#64748B" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalPost: { fontSize: 16, fontWeight: "600", color: "#2563EB" },
  modalPostDisabled: { color: "#94A3B8" },
  modalBody: { flex: 1, padding: 16 },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    gap: 6,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toolsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  toolsToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  toolsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  modalTextArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 200,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginBottom: 16,
  },
  tipsContainer: {
    flexDirection: "row",
    backgroundColor: "#FEF9C3",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE047",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#854D0E",
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: "#854D0E",
    lineHeight: 20,
  },
});

