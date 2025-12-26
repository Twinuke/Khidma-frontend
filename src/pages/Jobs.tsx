import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
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
  Alert, // Added Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "../../components/JobCard";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { Job } from "../types/job";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  subtext: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  inputBg: "#F1F5F9",
  primary: "#2563EB",
  accent: "#8B5CF6",
  backdrop: "rgba(15, 23, 42, 0.6)",
  chipBg: "#EEF2FF",
  danger: "#EF4444",
  white: "#FFFFFF",
  dark: "#0F172A",
};

const FILTERS = ["All", "Development", "Design", "Marketing", "Writing", "Video", "Finance"] as const;
const AI_FILTER = "✨ AI Match";

export default function Jobs() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [aiThinking, setAiThinking] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isFilterVisible, setFilterVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current; 
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const buttonScale = useRef(new Animated.Value(1)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const iconShimmer = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!isAiActive) {
        fetchJobs();
      }
    }, [activeFilter])
  );

  useEffect(() => {
    Animated.loop(
        Animated.sequence([
            Animated.timing(buttonScale, { toValue: 1.08, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
            Animated.timing(buttonScale, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.quad) })
        ])
    ).start();

    Animated.loop(
        Animated.timing(iconSpin, {
            toValue: 1,
            duration: 12000, 
            easing: Easing.linear,
            useNativeDriver: true,
        })
    ).start();

    Animated.loop(
      Animated.sequence([
          Animated.timing(iconShimmer, { toValue: 0.5, duration: 2500, useNativeDriver: true }), 
          Animated.timing(iconShimmer, { toValue: 1, duration: 2500, useNativeDriver: true })   
      ])
  ).start();
  }, []);

  const spin = iconSpin.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
  });

  const fetchJobs = async (customQuery?: string) => {
    if (!user?.userId) return;
    if (!refreshing && !aiThinking) setLoading(true);

    try {
        const queryToUse = customQuery !== undefined ? customQuery : searchQuery;
        
        const response = await api.get("/Jobs", {
          params: {
            search: queryToUse || "", 
            category: activeFilter !== "All" && activeFilter !== AI_FILTER ? activeFilter : undefined,
          },
        });
        
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setJobs(data);
    } catch (err) {
      console.error("Fetch Jobs Error:", err);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * ✅ FIXED handleAiMatch
   * Now calls the dedicated AiJobs recommendation endpoint.
   * Handles 404 if the user hasn't finished onboarding.
   */
  const handleAiMatch = async () => {
      if (!user) return;
      
      Keyboard.dismiss();
      setJobs([]); 
      setAiThinking(true); 
      setIsAiActive(true); 
      setActiveFilter("All"); 
      setSearchQuery(""); 

      startAiAnimation(); 

      try {
          // Pointing to the correct backend route: /AiJobs/recommended/{userId}
          const response = await api.get(`/AiJobs/recommended/${user.userId}`);
          
          // Added a small artificial delay for the "thinking" animation effect
          await new Promise((r) => setTimeout(r, 2000)); 

          const data = Array.isArray(response.data) ? response.data : [];
          setJobs(data);

      } catch (error: any) {
          console.error("AI Fetch Error", error);
          
          // If profile is not found (404), prompt user to setup their skills
          if (error.response?.status === 404) {
              Alert.alert(
                  "AI Profile Incomplete",
                  "We need to know your skills to find matches. Would you like to set up your AI profile now?",
                  [
                      { text: "Maybe Later", style: "cancel", onPress: () => setIsAiActive(false) },
                      { text: "Let's Go", onPress: () => navigation.navigate("OnboardingScreen") }
                  ]
              );
          } else {
              Alert.alert("Error", "Could not fetch AI recommendations at this time.");
              setIsAiActive(false);
          }
          setJobs([]);
      } finally {
          setAiThinking(false);
      }
  };

  const startAiAnimation = () => {
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
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
    if (filter === AI_FILTER) {
        closeModal();
        handleAiMatch();
    } else {
        setIsAiActive(false); 
        setActiveFilter(filter);
        closeModal();
    }
  };

  const clearFilter = () => {
      setActiveFilter("All");
      setIsAiActive(false);
      setSearchQuery("");
      fetchJobs(""); 
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
    onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120 || g.vy > 0.5) closeModal();
      else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 12 }).start();
    },
  }), [slideAnim]);

  const renderHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#334155"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.8} onPress={scrollToTop}>
                <Text style={styles.greeting}>Job Market</Text>
                <Text style={styles.subGreeting}>Explore premium opportunities</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                <TextInput
                    placeholder="Search jobs..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={(t) => { 
                        if (isAiActive) setIsAiActive(false); 
                        setSearchQuery(t); 
                    }}
                    onSubmitEditing={() => fetchJobs()} 
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(""); setIsAiActive(false); fetchJobs(""); }}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity 
                onPress={handleAiMatch}
                disabled={aiThinking}
                activeOpacity={0.9}
            >
                <Animated.View style={[
                    styles.aiButton, 
                    { transform: [{ scale: buttonScale }] }
                ]}>
                    <LinearGradient
                        colors={isAiActive ? ["#6366F1", "#818CF8"] : ["#4F46E5", "#7C3AED"]}
                        style={styles.aiGradient}
                    >
                        <Animated.View style={{ 
                            transform: [{ rotate: spin }],
                            opacity: iconShimmer 
                        }}>
                            <Ionicons name="sparkles" size={22} color="#FFF" />
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
        </View>

        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeFilter === item && !isAiActive && styles.activeCategoryPill,
              ]}
              onPress={() => selectFilter(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeFilter === item && !isAiActive && styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={{ zIndex: 10 }}>
        {renderHeaderComponent()}
        
        {!aiThinking && isAiActive && jobs.length > 0 && (
            <View style={styles.aiHeaderContainer}>
                <View style={styles.aiBanner}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Ionicons name="sparkles" size={16} color={COLORS.accent} />
                        <Text style={styles.aiBannerText}>Matches based on your profile</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.retakeBtn} 
                        onPress={() => navigation.navigate("OnboardingScreen")}
                    >
                        <Text style={styles.retakeText}>Edit Skills</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={jobs}
          keyExtractor={(item) => item.jobId.toString()}
          renderItem={({ item }) => (
            <JobCard 
              job={item} 
              onPress={(job: Job) => navigation.navigate("JobDetails", { jobData: job, jobId: job.jobId })} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onRefresh={() => { 
              setRefreshing(true); 
              if(isAiActive) handleAiMatch(); 
              else fetchJobs(); 
          }}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            aiThinking ? (
              <View style={styles.aiLoadingContainer}>
                <View style={styles.aiOrbContainer}>
                    <Animated.View style={[
                        styles.aiRing, 
                        { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] } 
                    ]} />
                    <Animated.View style={[styles.aiCore, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="sparkles" size={32} color="white" />
                    </Animated.View>
                </View>
                <Text style={styles.aiTitle}>AI is analyzing your skills...</Text>
                <Text style={styles.aiSub}>Finding the perfect matches for you.</Text>
              </View>
            ) : loading ? (
              <View style={styles.loaderBox}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><Ionicons name="briefcase-outline" size={32} color={COLORS.muted} /></View>
                <Text style={styles.emptyTitle}>{isAiActive ? "No matches found" : "No jobs found"}</Text>
                <Text style={styles.emptyText}>
                  {isAiActive ? "Try adding different skills to your profile." : "Try adjusting your search filters."}
                </Text>
                {isAiActive && (
                    <TouchableOpacity style={styles.primaryCta} onPress={clearFilter}>
                        <Text style={styles.primaryCtaText}>Show All Jobs</Text>
                    </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </KeyboardAvoidingView>

      <Modal visible={isFilterVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeModal}><Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]} {...panResponder.panHandlers}>
            <View style={styles.sheetHandleWrap}><View style={styles.sheetHandle} /></View>
            <Text style={styles.sheetTitle}>Filter Jobs</Text>
            
            <Text style={styles.sectionLabel}>Recommended</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => selectFilter(AI_FILTER)} style={[styles.smartRow, isAiActive && styles.smartRowActive]}>
              <View style={styles.smartIcon}><Ionicons name="sparkles" size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smartTitle}>AI Smart Match</Text>
                <Text style={styles.smartSub}>Personalized for your skills</Text>
              </View>
              {isAiActive && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
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
  headerContainer: { backgroundColor: '#F8FAFC', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 100 },
  gradientHeader: { paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  iconBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  redDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#1E293B' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, color: '#0F172A' },
  aiButton: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden', shadowColor: "#7C3AED", shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  aiGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  categoriesList: { gap: 10, paddingRight: 20 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeCategoryPill: { backgroundColor: '#FFF', borderColor: '#FFF' },
  categoryText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 },
  activeCategoryText: { color: '#0F172A', fontWeight: '700' },
  aiHeaderContainer: { paddingHorizontal: 24, marginBottom: 16, marginTop: 10 },
  aiBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3E8FF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D8B4FE' },
  aiBannerText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  retakeBtn: { backgroundColor: '#FFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  retakeText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
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