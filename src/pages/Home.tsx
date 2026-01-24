import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  Keyboard,
} from "react-native";
import { RootStackParamList } from "../../App";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_MIN_HEIGHT = Platform.OS === "ios" ? 100 : 90;
const HEADER_MAX_HEIGHT = 280;

const COLORS = {
  bg: "#F1F5F9",
  primary: "#2563EB",
  primaryDark: "#1E4ED8",
  dark: "#0F172A", 
  darkLight: "#1E293B",
  white: "#FFFFFF",
  secondaryText: "#94A3B8",
  success: "#10B981",
  border: "rgba(255,255,255,0.08)",
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout, refreshUser } = useUser();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedProjects: 0,
    totalEarnings: 0,
    activeBids: 0,
    connections: 0,
  });

  // --- SHEET & KEYBOARD ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"Add" | "Withdraw">("Add");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const headerHeight = useRef(new Animated.Value(HEADER_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const isNew = await AsyncStorage.getItem("isNewFreelancer");
    if (isNew === "true") {
      await AsyncStorage.removeItem("isNewFreelancer");
      navigation.navigate("OnboardingScreen"); 
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      fetchActivity();
      fetchStats();
    }, [user?.userId])
  );

  const fetchActivity = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/Notifications/user/${user.userId}`);
      const unread = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
      setRecentActivity(response.data.slice(0, 3));
    } catch (e) {
      console.log(e);
    }
  };

  const fetchStats = async () => {
    if (!user?.userId) return;
    try {
      if (user.userType === 1) {
        // Client stats
        const [jobsRes, contractsRes, connectionsRes] = await Promise.all([
          api.get(`/Jobs/client/${user.userId}`).catch((e) => {
            console.log("Error fetching jobs:", e);
            return { data: [] };
          }),
          api.get(`/Contracts/client/${user.userId}`).catch((e) => {
            console.log("Error fetching contracts:", e);
            return { data: [] };
          }),
          api.get(`/UserConnections/connected/${user.userId}`).catch((e) => {
            console.log("Error fetching connections:", e);
            return { data: [] };
          }),
        ]);

        const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
        const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : [];
        const connections = Array.isArray(connectionsRes.data) ? connectionsRes.data : [];

        const activeJobs = jobs.filter((j: any) => {
          const status = j.status ?? j.Status ?? -1;
          return status === 0 || status === 1 || status === 2; // Open, Assigned, InProgress
        }).length;

        const completedProjects = contracts.filter((c: any) => {
          const status = c.status ?? c.Status ?? -1;
          return status === 1; // Completed
        }).length;

        const totalSpent = contracts
          .filter((c: any) => {
            const status = c.status ?? c.Status ?? -1;
            return status === 1; // Completed
          })
          .reduce((sum: number, c: any) => {
            const amount = c.escrowAmount ?? c.EscrowAmount ?? 0;
            return sum + (parseFloat(amount.toString()) || 0);
          }, 0);

        // The endpoint already returns only accepted connections, so just count them
        const acceptedConnections = connections.length;

        setStats({
          activeJobs,
          completedProjects,
          totalEarnings: totalSpent,
          activeBids: 0,
          connections: acceptedConnections,
        });
      } else {
        // Freelancer stats
        const [bidsRes, contractsRes, connectionsRes] = await Promise.all([
          api.get(`/Bids/freelancer/${user.userId}`).catch((e) => {
            console.log("Error fetching bids:", e);
            return { data: [] };
          }),
          api.get(`/Contracts/freelancer/${user.userId}`).catch((e) => {
            console.log("Error fetching contracts:", e);
            return { data: [] };
          }),
          api.get(`/UserConnections/connected/${user.userId}`).catch((e) => {
            console.log("Error fetching connections:", e);
            return { data: [] };
          }),
        ]);

        const bids = Array.isArray(bidsRes.data) ? bidsRes.data : [];
        const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : [];
        const connections = Array.isArray(connectionsRes.data) ? connectionsRes.data : [];

        // Active bids = Pending (0) or Accepted (1) - not Rejected (2)
        const activeBids = bids.filter((b: any) => {
          const status = b.status ?? b.Status ?? -1;
          return status === 0 || status === 1; // Pending or Accepted
        }).length;

        const completedProjects = contracts.filter((c: any) => {
          const status = c.status ?? c.Status ?? -1;
          return status === 1; // Completed
        }).length;

        const totalEarned = contracts
          .filter((c: any) => {
            const status = c.status ?? c.Status ?? -1;
            return status === 1; // Completed
          })
          .reduce((sum: number, c: any) => {
            const amount = c.escrowAmount ?? c.EscrowAmount ?? 0;
            return sum + (parseFloat(amount.toString()) || 0);
          }, 0);

        // The endpoint already returns only accepted connections, so just count them
        const acceptedConnections = connections.length;

        setStats({
          activeJobs: 0,
          completedProjects,
          totalEarnings: totalEarned,
          activeBids,
          connections: acceptedConnections,
        });
      }
    } catch (e) {
      console.log("Error fetching stats:", e);
    }
  };

  // --- SHEET ANIMATIONS ---
  const openSheet = (type: "Add" | "Withdraw") => {
    setModalType(type);
    setAmount("");
    setModalVisible(true);
    Animated.spring(sheetY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10
    }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    });
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    Animated.timing(sheetY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true
    }).start(() => setModalVisible(false));
  };

  // FIXED: Robust PanResponder for 1:1 finger tracking
  const panResponderSheet = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        // Only allow dragging downwards (positive dy)
        if (gs.dy > 0) {
          sheetY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        // If dragged down more than 120px or swiped fast, close it
        if (gs.dy > 120 || gs.vy > 0.5) {
          closeSheet();
        } else {
          // Otherwise, snap back to the top
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 10
          }).start();
        }
      },
    })
  ).current;

  const handleTransaction = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      if (modalType === "Add") {
        const response = await api.post("/Payments/create-checkout-session", { amount: numAmount });
        if (response.data.url) await Linking.openURL(response.data.url);
      } else {
        Alert.alert("Request Sent", `Your withdrawal of $${numAmount.toFixed(2)} is being processed.`);
      }
      closeSheet();
    } catch (error) {
      Alert.alert("Transaction Failed", "Could not connect to service.");
    } finally {
      setLoading(false);
    }
  };

  const panResponderHeader = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        let newH = (isExpanded ? HEADER_MAX_HEIGHT : HEADER_MIN_HEIGHT) + gs.dy;
        if (newH < HEADER_MIN_HEIGHT) newH = HEADER_MIN_HEIGHT;
        if (newH > HEADER_MAX_HEIGHT + 30) newH = HEADER_MAX_HEIGHT + 30;
        headerHeight.setValue(newH);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50 || (isExpanded && gs.dy > -50)) {
          Animated.spring(headerHeight, { toValue: HEADER_MAX_HEIGHT, useNativeDriver: false }).start();
          setIsExpanded(true);
        } else {
          Animated.spring(headerHeight, { toValue: HEADER_MIN_HEIGHT, useNativeDriver: false }).start();
          setIsExpanded(false);
        }
      },
    })
  ).current;

  const detailsOpacity = headerHeight.interpolate({
    inputRange: [HEADER_MIN_HEIGHT, HEADER_MAX_HEIGHT - 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- PREMIUM DRAGGABLE KHIDMA SHEET --- */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.sheetOverlay}
        >
          {/* Backdrop Touch to Close */}
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={closeSheet} 
          />
          
          <Animated.View 
            style={[styles.sheetContent, { transform: [{ translateY: sheetY }] }]}
            {...panResponderSheet.panHandlers}
          >
            <LinearGradient colors={[COLORS.dark, "#1E293B"]} style={styles.sheetGradient}>
              {/* Draggable Handle */}
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>{modalType === "Add" ? "Add Funds" : "Withdraw"}</Text>
                  <Text style={styles.sheetBalance}>Wallet: ${user?.balance?.toFixed(2)}</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                  <Text style={styles.secureText}>Secure</Text>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.currency}>$</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.sheetInput}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* QUICK PICK CHIPS */}
              <View style={styles.chipContainer}>
                {["20", "50", "100", "250"].map((val) => (
                  <TouchableOpacity 
                    key={val} 
                    style={styles.amountChip} 
                    onPress={() => setAmount(val)}
                  >
                    <Text style={styles.chipText}>+${val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SUMMARY SECTION TO FILL SPACE */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Transaction Fee</Text>
                  <Text style={styles.summaryValue}>$0.00</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 8 }]}>
                  <Text style={[styles.summaryLabel, { color: "#FFF" }]}>Total amount</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: "bold" }]}>
                    ${amount ? parseFloat(amount).toFixed(2) : "0.00"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.sheetActionBtn} 
                onPress={handleTransaction}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>
                    {loading ? "Authenticating..." : `Confirm ${modalType}`}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={{ height: 30 }} />
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* HEADER */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]} {...panResponderHeader.panHandlers}>
        <LinearGradient colors={[COLORS.dark, COLORS.darkLight]} style={styles.headerGradient}>
          <View style={styles.compactRow}>
            <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate("Profile")}>
              <View style={styles.avatarContainer}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.headerAvatarImage} />
                ) : (
                  <Ionicons name="person" size={20} color="#FFF" />
                )}
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={styles.greetingText}>Hello, {user?.fullName?.split(" ")[0]}</Text>
                <Text style={styles.statusText}><Ionicons name="location-outline" size={10} /> {user?.city || "No Location"}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <Animated.View style={[styles.expandedContent, { opacity: detailsOpacity }]} pointerEvents={isExpanded ? "auto" : "none"}>
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              {user?.userType === 1 ? (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.statLabel}>Active Jobs</Text>
                    <Text style={styles.statValue}>{stats.activeJobs}</Text>
                  </View>
                  <View style={styles.verticalLine} />
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
                    <Text style={styles.statLabel}>Completed</Text>
                    <Text style={styles.statValue}>{stats.completedProjects}</Text>
                  </View>
                  <View style={styles.verticalLine} />
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.statLabel}>Connections</Text>
                    <Text style={styles.statValue}>{stats.connections}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.statLabel}>Active Bids</Text>
                    <Text style={styles.statValue}>{stats.activeBids}</Text>
                  </View>
                  <View style={styles.verticalLine} />
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
                    <Text style={styles.statLabel}>Completed</Text>
                    <Text style={styles.statValue}>{stats.completedProjects}</Text>
                  </View>
                  <View style={styles.verticalLine} />
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#8B5CF6" />
                    <Text style={styles.statLabel}>Connections</Text>
                    <Text style={styles.statValue}>{stats.connections}</Text>
                  </View>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.expButton} onPress={() => navigation.navigate("Profile")}>
              <Ionicons name="person-circle-outline" size={20} color="#FFF" />
              <Text style={styles.expButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.expButton, styles.logoutBtn]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.dragHandle}><Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.3)" /></View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MIN_HEIGHT + 20 }]}
      >
        <LinearGradient 
          colors={[COLORS.primary, COLORS.primaryDark]} 
          style={styles.balanceCard} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>${user?.balance?.toFixed(2) || "0.00"}</Text>
          </View>
          <View style={styles.balanceActions}>
            {user?.userType === 1 && (
              <TouchableOpacity style={styles.miniActionBtn} onPress={() => openSheet("Add")}>
                <Ionicons name="add-circle" size={16} color={COLORS.primary} />
                <Text style={styles.miniActionText}>Add</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.miniActionBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} 
              onPress={() => openSheet("Withdraw")}
            >
              <Ionicons name="arrow-up-circle" size={16} color="#FFF" />
              <Text style={[styles.miniActionText, { color: "#FFF" }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate(user?.userType === 1 ? "ClientMyJobs" : "Jobs")}>
            <View style={[styles.gridIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name={user?.userType === 1 ? "briefcase" : "search"} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>{user?.userType === 1 ? "My Jobs" : "Find Jobs"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate("SocialPage")}>
            <View style={[styles.gridIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="people" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.gridLabel}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate("Messages")}>
            <View style={[styles.gridIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="chatbubbles" size={22} color="#D97706" />
            </View>
            <Text style={styles.gridLabel}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate(user?.userType === 1 ? "ClientWorkUpdates" : "Bids" as any)}>
            <View style={[styles.gridIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name={user?.userType === 1 ? "clipboard-outline" : "document-text"} size={22} color="#9333EA" />
            </View>
            <Text style={styles.gridLabel}>{user?.userType === 1 ? "Work" : "Bids"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        {recentActivity.length > 0 ? (
          recentActivity.map((item) => (
            <View key={item.notificationId} style={styles.activityItem}>
              <Ionicons name="notifications" size={18} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actTitle}>{item.title}</Text>
                <Text style={styles.actDate}>{item.message}</Text>
              </View>
            </View>
          ))
        ) : (
          user?.userType === 0 && (
            <View style={styles.emptyActivityContainer}>
              <Ionicons name="person-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyActivityText}>Go to profile to start editing your account</Text>
            </View>
          )
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {user?.userType === 1 && (
        <TouchableOpacity style={styles.floatingFab} onPress={() => navigation.navigate("CreateJob")}>
          <LinearGradient colors={[COLORS.primary, "#3B82F6"]} style={styles.fabGradient}>
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  // KHIDMA SHEET STYLES
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.75)", justifyContent: "flex-end" },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheetContent: { 
    height: 520, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    overflow: "hidden", 
    backgroundColor: COLORS.dark,
    elevation: 20
  },
  sheetGradient: { flex: 1, padding: 24, paddingTop: 14 },
  sheetHandle: { width: 44, height: 5, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 3, alignSelf: "center", marginBottom: 25 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  sheetTitle: { color: "#FFF", fontSize: 26, fontWeight: "800" },
  sheetBalance: { color: COLORS.secondaryText, fontSize: 14, marginTop: 4 },
  secureBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16, 185, 129, 0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  secureText: { color: COLORS.success, fontSize: 11, fontWeight: "700", marginLeft: 4 },
  inputWrapper: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "rgba(255,255,255,0.04)", 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 20, 
    borderWidth: 1.5, 
    borderColor: "rgba(255,255,255,0.06)" 
  },
  currency: { color: COLORS.primary, fontSize: 34, fontWeight: "bold", marginRight: 12 },
  sheetInput: { flex: 1, color: "#FFF", fontSize: 34, fontWeight: "bold" },
  chipContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  amountChip: { backgroundColor: "rgba(255,255,255,0.05)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  chipText: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  summaryBox: { backgroundColor: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 20, marginBottom: 30 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: COLORS.secondaryText, fontSize: 13 },
  summaryValue: { color: "#FFF", fontSize: 14 },
  sheetActionBtn: { borderRadius: 18, overflow: "hidden" },
  btnGradient: { paddingVertical: 20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "bold" },

  // EXISTING UI STYLES
  headerContainer: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
  headerGradient: { flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: Platform.OS === "android" ? 40 : 50, paddingHorizontal: 20 },
  compactRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 50 },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  headerAvatarImage: { width: "100%", height: "100%", borderRadius: 20 },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 1.5, borderColor: "#1E293B" },
  greetingText: { color: "#FFF", fontWeight: "bold" },
  statusText: { color: COLORS.secondaryText, fontSize: 11 },
  iconButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18 },
  notifBadge: { position: "absolute", top: -2, right: -2, backgroundColor: "red", borderRadius: 10, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  notifText: { color: "#FFF", fontSize: 9, fontWeight: "bold" },
  expandedContent: { marginTop: 10 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 10 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15, paddingHorizontal: 8 },
  statItem: { alignItems: "center", flex: 1 },
  statLabel: { color: "#94A3B8", fontSize: 10, marginTop: 4, textAlign: "center" },
  statValue: { color: "#FFF", fontWeight: "bold", fontSize: 16, marginTop: 2 },
  verticalLine: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  expButton: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 5 },
  logoutBtn: { backgroundColor: "rgba(239, 68, 68, 0.2)" },
  expButtonText: { color: "#FFF", marginLeft: 5 },
  logoutText: { color: "#FCA5A5" },
  dragHandle: { alignItems: "center", justifyContent: "flex-end", paddingBottom: 6, height: 24 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  balanceCard: { borderRadius: 24, padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, elevation: 8 },
  balanceLabel: { color: "#BFDBFE", fontSize: 13, fontWeight: "500", marginBottom: 4 },
  balanceAmount: { color: "#FFF", fontSize: 32, fontWeight: "800" },
  balanceActions: { gap: 8 },
  miniActionBtn: { backgroundColor: "#FFF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  miniActionText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.dark, marginBottom: 10 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  gridItem: { width: "23%", alignItems: "center" },
  gridIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  gridLabel: { fontSize: 11, color: "#475569", fontWeight: "500" },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  seeAll: { color: COLORS.primary },
  activityItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 15, borderRadius: 12, marginBottom: 10 },
  actTitle: { fontWeight: "bold", color: COLORS.dark },
  actDate: { color: "#94A3B8", fontSize: 12 },
  emptyActivityContainer: { 
    backgroundColor: "#FFF", 
    padding: 32, 
    borderRadius: 16, 
    alignItems: "center", 
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed"
  },
  emptyActivityText: { 
    color: "#94A3B8", 
    fontSize: 14, 
    marginTop: 12, 
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500"
  },
  floatingFab: { position: "absolute", bottom: 30, right: 20 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
});