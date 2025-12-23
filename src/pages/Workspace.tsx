import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Keyboard,
  KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View, TouchableWithoutFeedback
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width, height } = Dimensions.get("window");
const COLORS = { bg: "#F8FAFC", card: "#FFFFFF", text: "#0F172A", subtext: "#64748B", primary: "#2563EB", border: "#E2E8F0", success: "#059669", danger: "#DC2626" };

const UPDATE_TYPES = [
  { label: "Progress", value: "Progress", icon: "trending-up", color: COLORS.primary },
  { label: "Milestone", value: "Milestone", icon: "flag", color: COLORS.success },
  { label: "Question", value: "Question", icon: "help-circle", color: "#CA8A04" },
  { label: "Deliverable", value: "Deliverable", icon: "checkmark-circle", color: COLORS.danger },
  { label: "General", value: "Update", icon: "document-text", color: COLORS.subtext },
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
  const [isClient, setIsClient] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);

  // Client Decision Modal
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [activeUpdateId, setActiveUpdateId] = useState<number | null>(null);
  const [responseAction, setResponseAction] = useState<'approve' | 'dismiss'>('approve');
  const [responseText, setResponseText] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetchUpdates();
  }, [jobId]);

  const fetchJobDetails = async () => {
    const res = await api.get(`/Jobs/${jobId}`);
    setJob(res.data);
    setIsClient(res.data.clientId === user?.userId);
    setIsFreelancer(res.data.clientId !== user?.userId);
  };

  const fetchUpdates = async () => {
    try {
      const res = await api.get(`/Workspace/job/${jobId}`);
      setUpdates(res.data);
    } finally { setLoading(false); }
  };

  const handleConfirmResponse = async () => {
    if (!activeUpdateId || processing) return;
    setProcessing(true);
    try {
      await api.post(`/Workspace/update/${activeUpdateId}/${responseAction}`, { 
        clientId: user?.userId,
        response: responseText.trim() 
      });

      // ✅ INSTANT UI LOCK: Update state locally so buttons vanish and color changes
      setUpdates(prev => prev.map(u => 
        u.updateId === activeUpdateId ? { ...u, status: responseAction === 'approve' ? 1 : 2 } : u
      ));

      setResponseModalVisible(false);
      Alert.alert("Success", `Update has been ${responseAction}d.`);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error || "Failed.");
      fetchUpdates();
    } finally {
      setProcessing(false);
      setActiveUpdateId(null);
    }
  };

  const renderUpdate = ({ item }: { item: any }) => {
    const type = UPDATE_TYPES.find(t => t.value === item.updateType) || UPDATE_TYPES[4];
    const isApproved = item.status === 1; // 1 = Approved
    const isDismissed = item.status === 2; // 2 = Dismissed
    const isPending = item.status === 0;   // 0 = Pending

    return (
      <View style={[styles.updateCard, isApproved && styles.approvedCard, isDismissed && styles.dismissedCard]}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: isApproved ? "#DCFCE7" : isDismissed ? "#FEE2E2" : `${type.color}15` }]}>
            <Ionicons name={isApproved ? "checkmark-circle" : isDismissed ? "close-circle" : type.icon as any} size={14} color={isApproved ? COLORS.success : isDismissed ? COLORS.danger : type.color} />
            <Text style={[styles.typeText, { color: isApproved ? COLORS.success : isDismissed ? COLORS.danger : type.color }]}>{isApproved ? "APPROVED" : isDismissed ? "DISMISSED" : type.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        {item.title && <Text style={styles.cardTitle}>{item.title}</Text>}
        <Text style={styles.cardContent}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.authorRow}>
            <Image source={{ uri: item.freelancer?.profileImageUrl || "https://via.placeholder.com/32" }} style={styles.authorAvatar} />
            <Text style={styles.authorName}>{item.freelancer?.fullName || "Member"}</Text>
          </View>
          
          {/* ✅ Buttons ONLY show for client if update is Pending */}
          {isClient && isPending && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setActiveUpdateId(item.updateId); setResponseAction('approve'); setResponseText(""); setResponseModalVisible(true); }}>
                <Ionicons name="checkmark-circle" size={30} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setActiveUpdateId(item.updateId); setResponseAction('dismiss'); setResponseText(""); setResponseModalVisible(true); }}>
                <Ionicons name="close-circle" size={30} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerWrapper}>
        <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.headerTitle} numberOfLines={1}>{job?.title || "Workspace"}</Text><Text style={styles.headerSub}>{job?.category} • Timeline</Text></View>
        </LinearGradient>
      </View>

      <FlatList
        data={updates}
        keyExtractor={(item) => item.updateId.toString()}
        renderItem={renderUpdate}
        // ✅ FIXED: Padding adjusted so first card isn't stuck to header
        contentContainerStyle={{ padding: 16, paddingTop: 130, paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={fetchUpdates}
      />

      {/* ✅ FIXED MODAL: Centered approach with forced Keyboard View */}
      <Modal visible={responseModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.centeredCard}>
              <Text style={styles.modalHeading}>{responseAction === 'approve' ? 'Approve Update' : 'Dismiss Update'}</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Write your feedback..." 
                multiline 
                value={responseText} 
                onChangeText={setResponseText} 
                autoFocus 
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setResponseModalVisible(false)} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleConfirmResponse} 
                  disabled={processing} 
                  style={[styles.confirmBtn, { backgroundColor: responseAction === 'approve' ? COLORS.success : COLORS.danger }]}
                >
                  <Text style={styles.confirmText}>{processing ? "..." : "Confirm"}</Text>
                </TouchableOpacity>
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
  headerWrapper: { position: 'absolute', top: 0, width: '100%', zIndex: 10, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', elevation: 10 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  updateCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, marginBottom: 16, borderLeftWidth: 6, borderLeftColor: COLORS.primary, elevation: 4 },
  approvedCard: { backgroundColor: "#F0FDF4", borderLeftColor: COLORS.success, borderColor: "#DCFCE7", borderWidth: 1 },
  dismissedCard: { backgroundColor: "#FEF2F2", borderLeftColor: COLORS.danger, borderColor: "#FEE2E2", borderWidth: 1 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '900' },
  cardTime: { fontSize: 12, color: COLORS.subtext },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardContent: { fontSize: 15, color: "#334155", lineHeight: 22, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  authorName: { fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  centeredCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, elevation: 10 },
  modalHeading: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  modalInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, minHeight: 100, textAlignVertical: 'top', fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelBtn: { padding: 12 },
  cancelText: { fontWeight: '700', color: COLORS.subtext },
  confirmBtn: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  confirmText: { color: '#FFF', fontWeight: '800' }
});