import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
  Share // ✅ Added Share import
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BidForm } from "../components/BidForm";
import { MiniProfileSheet } from "../components/MiniProfileSheet";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { Job } from "../types/job";

const { width } = Dimensions.get("window");

export default function JobDetails() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, refreshCounts } = useUser();
  const insets = useSafeAreaInsets();

  const { jobId } = route.params || {};
  const initialJobData = route.params?.jobData as Job;

  const [job, setJob] = useState<any>(initialJobData || null);
  const [loading, setLoading] = useState(!initialJobData);
  const [modalVisible, setModalVisible] = useState(false);
  const [clientSheetVisible, setClientSheetVisible] = useState(false);

  // Status
  const [hasPlacedBid, setHasPlacedBid] = useState(false);
  const [isHired, setIsHired] = useState(false);

  // ✨ Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const trophyScale = useRef(new Animated.Value(0)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchJobDetails();
    markNotificationsAsRead();
  }, [jobId]);

  // Trigger Animation when Hired
  useEffect(() => {
    if (isHired) {
      Animated.sequence([
        Animated.spring(trophyScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
            Animated.sequence([
                Animated.timing(trophyRotate, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(trophyRotate, { toValue: -1, duration: 300, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(trophyRotate, { toValue: 0, duration: 150, useNativeDriver: true, easing: Easing.linear }),
                Animated.delay(2000) 
            ])
        )
      ]).start();
    }
  }, [isHired]);

  const markNotificationsAsRead = async () => {
    if (!user || !jobId) return;
    try {
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
      if (!job) setLoading(true);
      const response = await api.get(`/Jobs/${jobId}`);
      setJob(response.data);

      if (user && user.userType === 0) {
        const bidsRes = await api.get(`/Bids/job/${jobId}`);
        const myBid = bidsRes.data.find((b: any) => b.freelancerId === user.userId);
        if (myBid) {
          setHasPlacedBid(true);
          if (myBid.status === 1) setIsHired(true);
        }
      }
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
        user2Id: job.client?.userId || job.clientId,
        jobId: job.jobId,
      });
      navigation.navigate("ChatScreen", {
        conversationId: response.data.conversationId,
        otherUser: job.client || { userId: job.clientId, fullName: job.clientName },
      });
    } catch (e) {
      console.log("Chat Error:", e);
    }
  };

  // ✅ NEW SHARE FUNCTION
  const handleShare = async () => {
    try {
      const message = isHired 
        ? `Woohoo! 🎉 I just got hired for the job "${job.title}" on Khidma! 🏆`
        : `Check out this job on Khidma: "${job.title}" - Budget: $${job.budget}`;
      
      await Share.share({
        message: message,
        title: isHired ? "I got hired!" : "Job Opportunity",
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (!job) return null;

  const isOwner = user?.userId === (job.client?.userId || job.clientId);
  
  const clientId = job.clientId || job.client?.userId;
  const clientName = job.clientName || job.client?.fullName || "Unknown Client";
  const clientAvatar = job.clientAvatar || job.client?.profileImageUrl;
  const isJobClosed = job.status !== 0 && job.status !== "Open" && !isHired;

  // Animation Interpolation
  const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp'
  });

  const rotate = trophyRotate.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-15deg', '15deg']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ✅ COMPACT GRADIENT HEADER */}
      <View style={styles.headerShadow}>
        <LinearGradient
            colors={["#0F172A", "#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientHeader, { paddingTop: insets.top + 10 }]}
        >
            {/* Navbar */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Job Details</Text>
                
                {/* ✅ Share Button is now Active */}
                <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Title & Stats */}
            <View style={styles.headerContent}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.headerMetaRow}>
                    <View style={styles.budgetBadge}>
                        <Text style={styles.budgetText}>${job.budget}</Text>
                    </View>
                    <Text style={styles.postedDate}>
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{height: 20}} />

        {/* ANIMATED HIRED STATUS */}
        {isHired && (
            <View style={styles.hiredCard}>
                <View style={styles.hiredContent}>
                    <View style={{flex: 1}}>
                        <Text style={styles.hiredTitle}>You are Hired! 🎉</Text>
                        <Text style={styles.hiredSub}>The client accepted your proposal.</Text>
                    </View>
                    <Animated.View style={{ transform: [{ scale: trophyScale }, { rotate: rotate }] }}>
                        <View style={styles.trophyCircle}>
                            <Text style={{fontSize: 32}}>🏆</Text>
                        </View>
                    </Animated.View>
                </View>
            </View>
        )}

        {hasPlacedBid && !isHired && (
            <View style={styles.statusBanner}>
                <Ionicons name="time-outline" size={20} color="#CA8A04" />
                <Text style={styles.statusText}>Application Sent • Awaiting Client</Text>
            </View>
        )}

        {/* INFO GRID */}
        <View style={styles.grid}>
            <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="briefcase" size={20} color="#2563EB" />
                </View>
                <Text style={styles.gridLabel}>Type</Text>
                <Text style={styles.gridValue}>{job.category}</Text>
            </View>
            <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="globe" size={20} color="#059669" />
                </View>
                <Text style={styles.gridLabel}>Location</Text>
                <Text style={styles.gridValue}>{job.isRemote ? "Remote" : "On-Site"}</Text>
            </View>
            <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="star" size={20} color="#EA580C" />
                </View>
                <Text style={styles.gridLabel}>Level</Text>
                <Text style={styles.gridValue}>{job.experienceLevel || "Mid"}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        {/* CONTENT */}
        <Text style={styles.sectionHeader}>Description</Text>
        <Text style={styles.description}>{job.description}</Text>

        <View style={styles.divider} />

        {/* CLIENT ROW */}
        <Text style={styles.sectionHeader}>About the Client</Text>
        <TouchableOpacity
          style={styles.clientRow}
          activeOpacity={0.7}
          onPress={() => setClientSheetVisible(true)}
        >
            {clientAvatar ? (
              <Image source={{ uri: clientAvatar }} style={styles.clientAvatar} />
            ) : (
              <View style={[styles.clientAvatar, styles.clientPlaceholder]}>
                <Text style={styles.clientInitials}>{clientName?.[0] || "C"}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{clientName}</Text>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Ionicons name="shield-checkmark" size={12} color="#059669" />
                    <Text style={styles.verifiedText}> Payment Verified</Text>
                </View>
            </View>
            <View style={styles.viewProfileBtn}>
                <Text style={styles.viewProfileText}>View Profile</Text>
            </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {!isOwner ? (
          <View style={styles.footerRow}>
            {isHired ? (
                <>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleStartChat}>
                        <Ionicons name="chatbubble-outline" size={20} color="#0F172A" />
                        <Text style={styles.secondaryBtnText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.primaryBtn} 
                        onPress={() => navigation.navigate("MyJobs")}
                    >
                        <Text style={styles.primaryBtnText}>Open Workspace</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" style={{marginLeft: 8}}/>
                    </TouchableOpacity>
                </>
            ) : hasPlacedBid ? (
                <TouchableOpacity style={[styles.primaryBtn, styles.btnDisabled]} disabled>
                    <Text style={styles.disabledText}>Proposal Submitted</Text>
                </TouchableOpacity>
            ) : isJobClosed ? (
                <TouchableOpacity style={[styles.primaryBtn, styles.btnDisabled]} disabled>
                    <Text style={styles.disabledText}>Job Closed</Text>
                </TouchableOpacity>
            ) : (
                <>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleStartChat}>
                        <Ionicons name="chatbubble-outline" size={20} color="#0F172A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.primaryBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                </>
            )}
          </View>
        ) : (
          <View style={styles.ownerFooter}>
            <Text style={styles.ownerText}>You posted this job</Text>
            <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate("ClientJobDetails", { jobId: job.jobId })}>
                <Text style={styles.manageBtnText}>Manage Proposals</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modals */}
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
                setHasPlacedBid(true);
                Alert.alert("Success", "Bid placed!");
              }}
            />
          ) : (
            <ActivityIndicator size="large" color="#FFF" />
          )}
        </View>
      </Modal>

      <MiniProfileSheet
        visible={clientSheetVisible}
        userId={clientId}
        onClose={() => setClientSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFF' },
  container: { flex: 1, backgroundColor: "#FFF" },
  
  // Header
  headerShadow: {
      borderBottomLeftRadius: 32, 
      borderBottomRightRadius: 32,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5
  },
  gradientHeader: { 
      paddingHorizontal: 20, 
      paddingBottom: 24,
  },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  navTitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  
  headerContent: { alignItems: 'center' },
  jobTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', lineHeight: 32, marginBottom: 12 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center' },
  budgetBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  budgetText: { color: '#4ADE80', fontWeight: '800', fontSize: 16 },
  postedDate: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },

  scrollContent: { paddingHorizontal: 24 },

  // Hired Card
  hiredCard: {
      backgroundColor: '#F0FDF4',
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#DCFCE7'
  },
  hiredContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hiredTitle: { fontSize: 18, fontWeight: '800', color: '#166534' },
  hiredSub: { fontSize: 13, color: '#15803D', marginTop: 4 },
  trophyCircle: { 
      width: 56, height: 56, borderRadius: 28, 
      backgroundColor: '#FFF', 
      justifyContent: 'center', alignItems: 'center',
      shadowColor: "#166534", shadowOpacity: 0.1, shadowRadius: 10, elevation: 2
  },

  // Status Banner
  statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF9C3',
      padding: 16,
      borderRadius: 16,
      marginBottom: 24,
      gap: 10
  },
  statusText: { color: '#854D0E', fontWeight: '700', fontSize: 14 },

  // Grid
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { flex: 1, alignItems: 'center' },
  gridIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  gridValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },

  // Content
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  description: { fontSize: 16, color: '#334155', lineHeight: 26 },

  // Client
  clientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16 },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  clientPlaceholder: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  clientInitials: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  clientName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  verifiedText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  viewProfileBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  viewProfileText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },

  // Footer
  footer: { 
      position: 'absolute', bottom: 0, left: 0, right: 0, 
      backgroundColor: '#FFF', 
      paddingHorizontal: 24, paddingTop: 20,
      borderTopWidth: 1, borderTopColor: '#F1F5F9'
  },
  footerRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: { 
      flex: 1, height: 56, backgroundColor: '#0F172A', borderRadius: 16, 
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: {width: 0, height: 4}, elevation: 4
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { 
      height: 56, paddingHorizontal: 20, borderRadius: 16, 
      borderWidth: 1, borderColor: '#E2E8F0', 
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  secondaryBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
  
  btnDisabled: { backgroundColor: '#F1F5F9', shadowOpacity: 0 },
  disabledText: { color: '#94A3B8', fontWeight: '700' },

  // Owner Footer
  ownerFooter: { alignItems: 'center', gap: 12 },
  ownerText: { color: '#64748B', fontStyle: 'italic' },
  manageBtn: { width: '100%', height: 50, borderRadius: 16, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  manageBtnText: { color: '#FFF', fontWeight: '700' },

  // Common
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#64748B", marginTop: 12, marginBottom: 20 },
  backButton: { backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: "#FFF", fontWeight: "600" },
});