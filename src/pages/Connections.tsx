import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// ✅ THEME COLORS (Matches Jobs Page)
const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  primary: "#2563EB",
  success: "#10B981",
  danger: "#EF4444",
  accent: "#8B5CF6", 
  backdrop: "rgba(15, 23, 42, 0.6)",
};

const TABS = ["Requests", "Connections"];

export default function Network() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("Requests");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Preview Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchNetworkData();
    }, [activeTab])
  );

  const fetchNetworkData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = activeTab === "Requests" 
        ? `/UserConnections/pending/${user.userId}` 
        : `/UserConnections/connected/${user.userId}`;
      
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (error) {
      console.log("Network Error:", error);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (connectionId: number, action: "accept" | "reject") => {
    try {
      // Optimistic Update: Remove item immediately for speed
      setData((prev) => prev.filter((item) => item.connectionId !== connectionId));
      
      const endpoint = action === "accept" 
        ? `/UserConnections/accept/${connectionId}`
        : `/UserConnections/reject/${connectionId}`;
      
      await api.post(endpoint);
    } catch (error) {
      console.error("Action Failed", error);
      fetchNetworkData(); // Revert on fail
    }
  };

  const openProfilePreview = (targetUser: any) => {
    setSelectedUser(targetUser);
    setModalVisible(true);
    
    // Slide Up Animation
    Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 12 }),
    ]).start();
  };

  const closeProfilePreview = () => {
    Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => {
        setModalVisible(false);
        setSelectedUser(null);
    });
  };

  const navigateToFullProfile = () => {
      closeProfilePreview();
      // Wait for modal to close before pushing screen
      setTimeout(() => {
          navigation.navigate("UserProfile", { userId: selectedUser?.userId });
      }, 300);
  };

  // Pan Responder for Drag-to-Dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) closeProfilePreview();
        else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // --- Render Items ---
  const renderItem = ({ item }: { item: any }) => {
    // Determine which user object to show (Requester vs Connected User)
    // The API might return different structures based on "pending" vs "connected"
    // Adjust logic: usually `item.requester` is the person who added you in pending list
    const displayUser = activeTab === "Requests" ? item.requester : (item.requesterId === user?.userId ? item.receiver : item.requester);
    
    if (!displayUser) return null;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => openProfilePreview(displayUser)}
      >
        <View style={styles.cardRow}>
            {/* Avatar */}
            {displayUser.profileImageUrl ? (
                <Image source={{ uri: displayUser.profileImageUrl }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{displayUser.fullName?.[0] || "?"}</Text>
                </View>
            )}

            {/* Info */}
            <View style={styles.infoCol}>
                <Text style={styles.name}>{displayUser.fullName}</Text>
                <Text style={styles.role}>{displayUser.jobTitle || displayUser.userType}</Text>
                {displayUser.city && (
                    <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={12} color={COLORS.subtext} />
                        <Text style={styles.locText}>{displayUser.city}</Text>
                    </View>
                )}
            </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
            {activeTab === "Requests" ? (
                <>
                    <TouchableOpacity 
                        style={[styles.btn, styles.btnReject]} 
                        onPress={() => handleAction(item.connectionId, "reject")}
                    >
                        <Text style={[styles.btnText, { color: COLORS.danger }]}>Ignore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.btn, styles.btnAccept]}
                        onPress={() => handleAction(item.connectionId, "accept")}
                    >
                        <Text style={[styles.btnText, { color: "#FFF" }]}>Accept</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <TouchableOpacity 
                    style={[styles.btn, styles.btnMessage]}
                    onPress={() => navigation.navigate("ChatScreen", { 
                        conversationId: null, // New chat
                        receiverId: displayUser.userId,
                        receiverName: displayUser.fullName,
                        receiverAvatar: displayUser.profileImageUrl 
                    })}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.btnText, { color: COLORS.primary }]}>Message</Text>
                </TouchableOpacity>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
            colors={["#0F172A", "#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientHeader, { paddingTop: insets.top + 20 }]}
        >
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.headerTitle}>Network</Text>
                    <Text style={styles.headerSub}>Grow your professional circle.</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
                    <Ionicons name="person-add-outline" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </LinearGradient>
      </View>

      {/* List */}
      {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.connectionId.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNetworkData(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name={activeTab === "Requests" ? "mail-unread-outline" : "people-outline"} size={64} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>
                        {activeTab === "Requests" ? "No Pending Requests" : "No Connections Yet"}
                    </Text>
                    <Text style={styles.emptySub}>
                        {activeTab === "Requests" ? "Connect with people to see them here." : "Start networking to grow your list."}
                    </Text>
                </View>
            }
          />
      )}

      {/* ✅ PROFILE PREVIEW BOTTOM SHEET */}
      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeProfilePreview}>
        <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={closeProfilePreview}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>
            
            <Animated.View 
                style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
                {...panResponder.panHandlers}
            >
                {/* Handle Bar */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {selectedUser && (
                    <View style={styles.sheetContent}>
                        {/* Profile Header */}
                        <View style={styles.sheetHeader}>
                            {selectedUser.profileImageUrl ? (
                                <Image source={{ uri: selectedUser.profileImageUrl }} style={styles.sheetAvatar} />
                            ) : (
                                <View style={[styles.sheetAvatar, styles.sheetAvatarPlaceholder]}>
                                    <Text style={styles.sheetAvatarText}>{selectedUser.fullName?.[0]}</Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sheetName}>{selectedUser.fullName}</Text>
                                <Text style={styles.sheetRole}>{selectedUser.jobTitle || selectedUser.userType}</Text>
                                <Text style={styles.sheetLoc}>{selectedUser.city || "Remote"}</Text>
                            </View>
                        </View>

                        {/* Bio */}
                        {selectedUser.bio && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>About</Text>
                                <Text style={styles.bioText} numberOfLines={3}>{selectedUser.bio}</Text>
                            </View>
                        )}

                        {/* Skills */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Skills</Text>
                            <View style={styles.skillsRow}>
                                {/* Mock skills if none exist */}
                                {["Communication", "Teamwork"].map((s, i) => (
                                    <View key={i} style={styles.skillPill}>
                                        <Text style={styles.skillText}>{s}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Full Profile Button */}
                        <TouchableOpacity style={styles.fullProfileBtn} onPress={navigateToFullProfile}>
                            <Text style={styles.fullProfileText}>View Full Profile</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header
  headerContainer: {
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 10
  },
  gradientHeader: { paddingBottom: 20, paddingHorizontal: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#FFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  activeTabText: { color: COLORS.text, fontWeight: '700' },

  // List
  listContent: { padding: 24, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#64748B", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.subtext },
  infoCol: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  role: { fontSize: 13, color: COLORS.subtext, marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: 12, color: COLORS.subtext },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnReject: { borderColor: COLORS.danger, backgroundColor: '#FFF' },
  btnAccept: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnMessage: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderColor: '#EFF6FF' },
  btnText: { fontSize: 13, fontWeight: '700' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.subtext, marginTop: 6 },

  // Modal / Bottom Sheet
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.backdrop },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, paddingHorizontal: 24, maxHeight: '80%' },
  handleContainer: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  
  sheetContent: { marginTop: 10 },
  sheetHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  sheetAvatar: { width: 70, height: 70, borderRadius: 35 },
  sheetAvatarPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText: { fontSize: 28, fontWeight: '700', color: COLORS.subtext },
  sheetName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  sheetRole: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  sheetLoc: { fontSize: 14, color: COLORS.subtext, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  bioText: { fontSize: 15, color: COLORS.subtext, lineHeight: 22 },
  
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  skillText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },

  fullProfileBtn: { backgroundColor: COLORS.text, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fullProfileText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});