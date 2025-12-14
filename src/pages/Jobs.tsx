import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { JobCard } from "../../components/JobCard";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { Job } from "../types/job";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ✅ PROFESSIONAL COLORS
const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  inputBg: "#F1F5F9",
  primary: "#2563EB",
  accent: "#8B5CF6", // AI Purple
  backdrop: "rgba(15, 23, 42, 0.6)",
  chipBg: "#EEF2FF",
  danger: "#EF4444",
  white: "#FFFFFF",
  dark: "#0F172A",
};

const FILTERS = ["All", "Development", "Design", "Marketing", "Writing", "Video", "Finance"] as const;
const AI_FILTER = "✨ AI Match";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function Jobs() {
  const navigation = useNavigation<any>();
  const { user } = useUser();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ AI Thinking State
  const [aiThinking, setAiThinking] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 350);

  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isFilterVisible, setFilterVisible] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isAiMode = activeFilter === AI_FILTER;

  useFocusEffect(
    useCallback(() => {
      fetchJobs(true);
    }, [user?.userId, activeFilter, debouncedQuery])
  );

  const fetchJobs = async (isRefresh = false) => {
    if (!user?.userId) return;
    if (loading && !isRefresh && !aiThinking) return;

    // ✅ FORCE "THINKING" MODE FOR AI FILTER
    if (activeFilter === AI_FILTER) {
        setJobs([]); // Clear list instantly
        setAiThinking(true); 
        startAiAnimation();
        // ⏳ 2.5s Deliberate Delay for "Magic" Effect
        await new Promise((r) => setTimeout(r, 2500)); 
    } else {
        setLoading(true);
    }

    try {
      let data: any[] = [];

      if (activeFilter === AI_FILTER) {
        try {
          const response = await api.get(`/AiJobs/recommended/${user.userId}`);
          data = response.data || [];
        } catch (error: any) {
          if (error.response?.status === 404) data = [];
          else console.error(error);
        }
      } else {
        const response = await api.get("/Jobs/search", {
          params: {
            query: debouncedQuery?.trim() || "",
            category: FILTERS.includes(activeFilter as any) && activeFilter !== "All" ? activeFilter : undefined,
            page: 1,
            pageSize: 20,
            currentUserId: user.userId,
          },
        });
        data = response.data?.data ?? response.data ?? [];
      }

      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
      setAiThinking(false);
      setRefreshing(false);
    }
  };

  const startAiAnimation = () => {
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);

    // Pulse Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    // Slow Rotation for Background Ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const openModal = () => {
    Keyboard.dismiss();
    setFilterVisible(true);
    slideAnim.setValue(SCREEN_HEIGHT);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 12 }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => setFilterVisible(false));
  };

  const selectFilter = (filter: string) => {
    setActiveFilter(filter);
    closeModal();
  };

  const clearFilter = () => setActiveFilter("All");

  // ✅ IMPROVED PAN RESPONDER (Easier Drag)
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, // Capture touches immediately on the sheet background
    onMoveShouldSetPanResponder: (_, g) => g.dy > 5, // Start dragging if moved down by 5px
    onPanResponderMove: (_, g) => { 
        if (g.dy > 0) slideAnim.setValue(g.dy); // Follow finger
    },
    onPanResponderRelease: (_, g) => {
      // If dragged down significantly or flicked fast
      if (g.dy > 120 || g.vy > 0.5) closeModal();
      else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }).start();
    },
  }), [slideAnim]);

  // --- Components ---
  const Header = () => (
    <View style={styles.headerWrap}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.kicker}>Discover</Text>
          {/* ✅ Professional Title */}
          <Text style={styles.title}>Find Work</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={(t) => { if (isAiMode) setActiveFilter("All"); setSearchQuery(t); }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={12} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </Pressable>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterBtn, activeFilter !== "All" && styles.filterBtnActive]} 
          activeOpacity={0.85} 
          onPress={openModal}
        >
          <Ionicons name={activeFilter !== "All" ? "options" : "options-outline"} size={20} color={activeFilter !== "All" ? "#fff" : COLORS.text} />
        </TouchableOpacity>
      </View>

      {activeFilter !== "All" && !isAiMode && (
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Filter: {activeFilter}</Text>
            <Pressable onPress={clearFilter} hitSlop={10}><Ionicons name="close" size={16} color={COLORS.primary} /></Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const AiHeader = () => (
    <View style={styles.aiHeaderContainer}>
        <View style={styles.aiBanner}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Ionicons name="sparkles" size={16} color={COLORS.accent} />
                <Text style={styles.aiBannerText}>Curated based on your profile</Text>
            </View>
            <TouchableOpacity 
                style={styles.retakeBtn} 
                onPress={() => navigation.navigate("OnboardingScreen")}
            >
                <Text style={styles.retakeText}>Edit</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.jobId.toString()}
          renderItem={({ item }) => (
            <JobCard 
              job={item} 
              onPress={(job) => navigation.navigate("JobDetails", { jobData: job, jobId: job.jobId })} 
            />
          )}
          ListHeaderComponent={
            <>
                <Header />
                {!aiThinking && isAiMode && jobs.length > 0 && <AiHeader />}
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onRefresh={() => { setRefreshing(true); fetchJobs(true); }}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            // 🧠 BEAUTIFUL AI LOADING SCREEN
            aiThinking ? (
              <View style={styles.aiLoadingContainer}>
                <View style={styles.aiOrbContainer}>
                    {/* Rotating Ring */}
                    <Animated.View style={[
                        styles.aiRing, 
                        { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] } 
                    ]} />
                    {/* Pulsing Core */}
                    <Animated.View style={[styles.aiCore, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="sparkles" size={32} color="white" />
                    </Animated.View>
                </View>
                <Text style={styles.aiTitle}>AI is finding matches...</Text>
                <Text style={styles.aiSub}>Scanning thousands of jobs for you.</Text>
              </View>
            ) : loading ? (
              <View style={styles.loaderBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
              // Empty State
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><Ionicons name="briefcase-outline" size={32} color={COLORS.muted} /></View>
                <Text style={styles.emptyTitle}>{isAiMode ? "No matches found" : "No jobs found"}</Text>
                <Text style={styles.emptyText}>
                  {isAiMode ? "Try updating your skills to get better results." : "Try adjusting your search filters."}
                </Text>
                {isAiMode && (
                  <TouchableOpacity style={styles.primaryCta} activeOpacity={0.9} onPress={() => navigation.navigate("OnboardingScreen")}>
                    <Text style={styles.primaryCtaText}>Update Preferences</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </KeyboardAvoidingView>

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeModal}><Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]} {...panResponder.panHandlers}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            <Text style={styles.sheetTitle}>Filter Jobs</Text>
            
            <Text style={styles.sectionLabel}>Recommended</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => selectFilter(AI_FILTER)} style={[styles.smartRow, isAiMode && styles.smartRowActive]}>
              <View style={styles.smartIcon}><Ionicons name="sparkles" size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smartTitle}>AI Smart Match</Text>
                <Text style={styles.smartSub}>Personalized for your skills</Text>
              </View>
              {isAiMode && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.chipGrid}>
              {FILTERS.map((cat) => (
                <Pressable key={cat} onPress={() => selectFilter(cat)} style={[styles.chip, activeFilter === cat && styles.chipActive]}>
                  <Text style={[styles.chipText, activeFilter === cat && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.9} onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerWrap: { paddingTop: Platform.OS === "android" ? 50 : 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  kicker: { fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: COLORS.subtext, fontWeight: "700" },
  title: { fontSize: 28, color: COLORS.text, fontWeight: "800" },
  notifBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  
  searchRow: { flexDirection: "row", gap: 12 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, height: 54, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: "500" },
  clearBtn: { padding: 4 },
  filterBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },

  pillRow: { marginTop: 12 },
  pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.chipBg },
  pillText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },

  aiHeaderContainer: { paddingHorizontal: 24, marginBottom: 16 },
  aiBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3E8FF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D8B4FE' },
  aiBannerText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  retakeBtn: { backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  retakeText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },

  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  
  // --- AI LOADER STYLES ---
  aiLoadingContainer: { alignItems: "center", marginTop: 60 },
  aiOrbContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  aiRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#E9D5FF', borderTopColor: COLORS.accent, opacity: 0.8 },
  aiCore: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  aiTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  aiSub: { fontSize: 14, color: COLORS.subtext, marginTop: 6 },

  loaderBox: { alignItems: "center", paddingTop: 60 },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 30 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  emptyText: { fontSize: 15, color: COLORS.subtext, textAlign: "center", marginTop: 8, lineHeight: 22 },
  primaryCta: { marginTop: 24, backgroundColor: COLORS.text, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30 },
  primaryCtaText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.backdrop },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, maxHeight: "85%" },
  sheetHandleWrap: { alignItems: "center", paddingVertical: 10, marginBottom: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1" },
  sheetTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase", marginBottom: 12, marginTop: 10 },
  
  smartRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  smartRowActive: { backgroundColor: "#F3E8FF", borderColor: COLORS.accent },
  smartIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent },
  smartTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  smartSub: { fontSize: 13, color: COLORS.subtext },
  
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipText: { fontWeight: "700", color: COLORS.subtext, fontSize: 14 },
  chipTextActive: { color: "#fff" },
  cancelBtn: { marginTop: 30, height: 54, borderRadius: 18, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center" },
  cancelText: { fontWeight: "800", color: COLORS.text, fontSize: 16 },
});