import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");
const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  subtext: "#64748B",
  primary: "#2563EB",
  border: "#E2E8F0",
  success: "#059669",
  danger: "#DC2626",
};

const UPDATE_TYPES = [
  { label: "Progress", value: "Progress", icon: "trending-up", color: COLORS.primary },
  { label: "Milestone", value: "Milestone", icon: "flag", color: COLORS.success },
  { label: "Question", value: "Question", icon: "help-circle", color: "#CA8A04" },
  { label: "Deliverable", value: "Deliverable", icon: "checkmark-circle", color: COLORS.danger },
  { label: "General", value: "Update", icon: "document-text", color: COLORS.subtext },
];

// ✅ Normalize backend casing + types ONCE so UI is consistent everywhere
function normalizeUpdate(u: any) {
  const idRaw = u.updateId ?? u.UpdateId ?? u.id ?? u.Id;
  const statusRaw = u.status ?? u.Status ?? 0;

  return {
    id: Number(idRaw),
    status: Number(statusRaw), // 0=Pending, 1=Approved, 2=Dismissed
    type: u.updateType ?? u.UpdateType ?? "Update",
    title: u.title ?? u.Title ?? "Work Update",
    content: u.content ?? u.Content ?? "",
    createdAt: u.createdAt ?? u.CreatedAt ?? new Date().toISOString(),
    raw: u, // keep original if you need it later
  };
}

export default function Workspace() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const passedJobId = route.params?.jobId || route.params?.jobData?.jobId || route.params?.jobData?.JobId;

  const [job, setJob] = useState<any>(route.params?.jobData || null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Freelancer "Post Update"
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "", type: "Progress" });

  // Client Decision Modal
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [activeUpdateId, setActiveUpdateId] = useState<number | null>(null);
  const [responseAction, setResponseAction] = useState<"approve" | "dismiss">("approve");
  const [responseText, setResponseText] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedJobId]);

  const initWorkspace = async () => {
    setLoading(true);
    try {
      const [jobRes, updateRes] = await Promise.all([
        api.get(`/Jobs/${passedJobId}`),
        api.get(`/Workspace/job/${passedJobId}`),
      ]);

      setJob(jobRes.data);

      const normalized = Array.isArray(updateRes.data) ? updateRes.data.map(normalizeUpdate) : [];
      setUpdates(normalized);

      const clientId = jobRes.data.clientId ?? jobRes.data.ClientId;
      setIsClient(Number(clientId) === Number(user?.userId));
    } catch (e) {
      console.error("Workspace init error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await api.get(`/Workspace/job/${passedJobId}`);
      const normalized = Array.isArray(res.data) ? res.data.map(normalizeUpdate) : [];
      setUpdates(normalized);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostUpdate = async () => {
    if (!newUpdate.content.trim() || processing) return;
    setProcessing(true);

    try {
      const payload = {
        jobId: passedJobId,
        freelancerId: user?.userId,
        title: newUpdate.title.trim() || "Work Update",
        content: newUpdate.content.trim(),
        updateType: newUpdate.type,
      };

      const res = await api.post("/Workspace/update", payload);
      const created = normalizeUpdate(res.data);

      setUpdates((prev) => [created, ...prev]);
      setCreateModalVisible(false);
      setNewUpdate({ title: "", content: "", type: "Progress" });
    } catch (e) {
      Alert.alert("Error", "Failed to post update.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmResponse = async () => {
    if (!activeUpdateId || processing) return;
    setProcessing(true);

    try {
      await api.post(`/Workspace/update/${activeUpdateId}/${responseAction}`, {
        clientId: user?.userId,
        response: responseText.trim(),
      });

      const newStatus = responseAction === "approve" ? 1 : 2;

      // ✅ Instant local update (works for client/freelancer because we normalized ids)
      setUpdates((prev) =>
        prev.map((u) => (Number(u.id) === Number(activeUpdateId) ? { ...u, status: newStatus } : u))
      );

      setResponseModalVisible(false);
      setResponseText("");
      setActiveUpdateId(null);

      // background sync (optional)
      fetchUpdates();
    } catch (e) {
      Alert.alert("Error", "Action failed.");
    } finally {
      setProcessing(false);
    }
  };

  const renderUpdate = useCallback(
    ({ item }: { item: any }) => {
      const uType = item.type;
      const uStatus = item.status; // ✅ always 0/1/2 now
      const type = UPDATE_TYPES.find((t) => t.value === uType) || UPDATE_TYPES[4];

      return (
        <View
          style={[
            styles.updateCard,
            uStatus === 1 && styles.approvedCard,
            uStatus === 2 && styles.dismissedCard,
          ]}
        >
          <View style={styles.cardTop}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    uStatus === 1
                      ? "#DCFCE7"
                      : uStatus === 2
                      ? "#FEE2E2"
                      : `${type.color}15`,
                },
              ]}
            >
              <Ionicons
                name={
                  uStatus === 1
                    ? "checkmark-circle"
                    : uStatus === 2
                    ? "close-circle"
                    : (type.icon as any)
                }
                size={14}
                color={uStatus === 1 ? COLORS.success : uStatus === 2 ? COLORS.danger : type.color}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: uStatus === 1 ? COLORS.success : uStatus === 2 ? COLORS.danger : type.color },
                ]}
              >
                {uStatus === 1
                  ? "APPROVED"
                  : uStatus === 2
                  ? "DISMISSED"
                  : (uType ?? "Update").toUpperCase()}
              </Text>
            </View>

            <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardContent}>{item.content}</Text>

          {/* ✅ Buttons ONLY if Pending and user is Client */}
          {isClient && uStatus === 0 && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={processing}
                onPress={() => {
                  setActiveUpdateId(item.id);
                  setResponseAction("approve");
                  setResponseModalVisible(true);
                }}
              >
                <Ionicons name="checkmark-circle" size={34} color={COLORS.success} />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={processing}
                onPress={() => {
                  setActiveUpdateId(item.id);
                  setResponseAction("dismiss");
                  setResponseModalVisible(true);
                }}
              >
                <Ionicons name="close-circle" size={34} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [isClient, processing]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {job?.title || "Workspace"}
            </Text>
            <Text style={styles.headerSub}>Active Workspace</Text>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={updates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUpdate}
        contentContainerStyle={{ padding: 16, paddingTop: 125, paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={initWorkspace}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ paddingTop: 30, alignItems: "center" }}>
              <Text style={{ color: COLORS.subtext }}>No updates yet.</Text>
            </View>
          )
        }
      />

      {!isClient && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <LinearGradient colors={[COLORS.primary, "#1D4ED8"]} style={styles.fabGradient}>
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* FREELANCER POST MODAL */}
      <Modal visible={createModalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Ionicons name="close" size={28} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Update</Text>
            <TouchableOpacity onPress={handlePostUpdate} disabled={processing}>
              <Text style={[styles.postBtnText, processing && { opacity: 0.5 }]}>Post</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What did you complete?"
              value={newUpdate.title}
              onChangeText={(t) => setNewUpdate({ ...newUpdate, title: t })}
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeRow}>
              {UPDATE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setNewUpdate({ ...newUpdate, type: t.value })}
                  style={[styles.typeOption, newUpdate.type === t.value && { backgroundColor: COLORS.primary }]}
                >
                  <Text style={[styles.typeOptionText, newUpdate.type === t.value && { color: "#FFF" }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Details</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 150, textAlignVertical: "top" }]}
              multiline
              placeholder="Describe your progress..."
              value={newUpdate.content}
              onChangeText={(t) => setNewUpdate({ ...newUpdate, content: t })}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* CLIENT APPROVE/DISMISS MODAL */}
      <Modal visible={responseModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalFlexContainer}>
              <View style={styles.decisionCard}>
                <View style={styles.modalDragHandle} />

                <Text style={styles.decisionTitle}>
                  {responseAction === "approve" ? "Approve Work" : "Request Changes"}
                </Text>

                <TextInput
                  style={styles.decisionInput}
                  placeholder="Add your feedback (optional)..."
                  multiline
                  value={responseText}
                  onChangeText={setResponseText}
                  autoFocus
                />

                <View style={styles.decisionBtns}>
                  <TouchableOpacity
                    onPress={() => {
                      setResponseModalVisible(false);
                      setResponseText("");
                      setActiveUpdateId(null);
                    }}
                    style={styles.cancelBtn}
                  >
                    <Text style={{ color: COLORS.subtext, fontWeight: "700" }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmResponse}
                    disabled={processing}
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: responseAction === "approve" ? COLORS.success : COLORS.danger },
                    ]}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>{processing ? "..." : "Confirm"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerWrapper: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    elevation: 10,
  },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24, flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600" },

  updateCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 16, elevation: 4 },
  approvedCard: { borderLeftWidth: 8, borderLeftColor: COLORS.success, backgroundColor: "#F0FDF4" },
  dismissedCard: { borderLeftWidth: 8, borderLeftColor: COLORS.danger, backgroundColor: "#FEF2F2" },

  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: "900" },
  cardTime: { fontSize: 11, color: COLORS.subtext },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 5, color: COLORS.text },
  cardContent: { fontSize: 14, color: "#334155", lineHeight: 22 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },

  fab: { position: "absolute", right: 20, width: 64, height: 64, borderRadius: 32, elevation: 10 },
  fabGradient: { flex: 1, borderRadius: 32, justifyContent: "center", alignItems: "center" },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFF",
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  postBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 16 },
  inputLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 18, color: COLORS.text },
  textInput: { backgroundColor: "#F1F5F9", borderRadius: 14, padding: 16, fontSize: 15 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: "#E2E8F0" },
  typeOptionText: { fontSize: 12, fontWeight: "700", color: "#64748B" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalFlexContainer: { flex: 1, justifyContent: "flex-end" },
  decisionCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: "100%",
    paddingBottom: 40,
    elevation: 20,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  decisionTitle: { fontSize: 20, fontWeight: "900", marginBottom: 15, color: COLORS.text },
  decisionInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 18,
    minHeight: 120,
    marginBottom: 24,
    textAlignVertical: "top",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  decisionBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 20, alignItems: "center" },
  cancelBtn: { padding: 12 },
  confirmBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
});
