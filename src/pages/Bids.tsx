import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

type BidItem = {
  bidId: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
  deliveryTimeDays: number;
  proposalText: string;
  createdAt: string;
  status: number;
  job?: {
    jobId: number;
    title: string;
    client?: {
      userId: number;
      fullName: string;
    };
  };
  freelancer?: {
    userId: number;
    fullName: string;
  };
};

export default function Bids() {
  const { user } = useUser();
  const navigation = useNavigation<any>();

  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const isClient = user?.userType === 1;

  const fetchBids = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = isClient
        ? `/Bids/client/${user.userId}`
        : `/Bids/freelancer/${user.userId}`;

      const response = await api.get(endpoint);
      setBids(response.data || []);
    } catch (error) {
      console.log("Error fetching bids", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBids();
    }, [user?.userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBids();
  };

  const handleBidPress = (bid: BidItem) => {
    navigation.navigate("JobDetails", {
      jobId: bid.jobId,
      jobData: bid.job,
      hasPlacedBid: !isClient,
    });
  };

  const getStatusMeta = (status: number) => {
    switch (status) {
      case 0: return { bg: "#FEF3C7", text: "#D97706", label: "Pending" };
      case 1: return { bg: "#DCFCE7", text: "#16A34A", label: "Accepted" };
      case 2: return { bg: "#FEE2E2", text: "#DC2626", label: "Rejected" };
      default: return { bg: "#F1F5F9", text: "#64748B", label: "Unknown" };
    }
  };

  const jobsForFilter = useMemo(() => {
    if (!isClient) return [];
    const map = new Map<number, { jobId: number; title: string }>();
    bids.forEach((b) => {
      if (b.jobId && b.job?.title) {
        map.set(b.jobId, { jobId: b.jobId, title: b.job.title });
      }
    });
    return Array.from(map.values());
  }, [bids, isClient]);

  const filteredBids = useMemo(() => {
    if (!isClient || !selectedJobId) return bids;
    return bids.filter((b) => b.jobId === selectedJobId);
  }, [bids, isClient, selectedJobId]);

  const renderItem = ({ item }: { item: BidItem }) => {
    const meta = getStatusMeta(item.status);
    const mainTitle = item.job?.title || `Job #${item.jobId}`;
    const secondary = isClient
      ? item.freelancer?.fullName || "Freelancer"
      : item.job?.client?.fullName || "Client";
    const secondaryLabel = isClient ? "Freelancer" : "Client";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleBidPress(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>{mainTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.personRow}>
          <Ionicons name={isClient ? "person" : "business"} size={14} color="#64748B" />
          <Text style={styles.personText}>{secondaryLabel}: {secondary}</Text>
        </View>

        <Text style={styles.proposalText} numberOfLines={2}>
          {item.proposalText}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Bid Amount</Text>
            <Text style={styles.amountValue}>${item.bidAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.timeInfo}>
            <View style={styles.infoTag}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.infoTagText}>{item.deliveryTimeDays} days</Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Gradient Header */}
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{isClient ? "Client Dashboard" : "My Bids"}</Text>
            <Text style={styles.headerSubtitle}>
              {isClient ? "Manage offers on your jobs" : "Track your active proposals"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {isClient && jobsForFilter.length > 0 && (
        <View style={styles.filterBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedJobId && styles.filterChipActive]}
              onPress={() => setSelectedJobId(null)}
            >
              <Text style={[styles.filterChipText, !selectedJobId && styles.filterChipTextActive]}>All Jobs</Text>
            </TouchableOpacity>

            {jobsForFilter.map((job) => (
              <TouchableOpacity
                key={job.jobId}
                style={[styles.filterChip, selectedJobId === job.jobId && styles.filterChipActive]}
                onPress={() => setSelectedJobId(job.jobId)}
              >
                <Text
                  style={[styles.filterChipText, selectedJobId === job.jobId && styles.filterChipTextActive]}
                  numberOfLines={1}
                >
                  {job.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredBids}
          keyExtractor={(item) => item.bidId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyText}>
                {isClient
                  ? "No bids received yet."
                  : "You haven't placed any bids yet."}
              </Text>
              <Text style={styles.emptySubtext}>
                {isClient ? "Your job posts will appear here once freelancers bid." : "Go to the Jobs tab to find opportunities!"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Header Styles (Matching Profile/Updates)
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerNav: { flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 },

  // Filter Bar Styles
  filterBarContainer: { marginTop: 10 },
  filterScroll: { paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterChipTextActive: { color: "#FFF" },

  // List & Card Styles (Matching Profile Section Aesthetic)
  listContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  
  personRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  personText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  
  proposalText: { fontSize: 14, color: "#475569", lineHeight: 20, marginBottom: 16 },
  
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  amountLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", textTransform: "uppercase", marginBottom: 2 },
  amountValue: { fontSize: 20, fontWeight: "800", color: "#2563EB" },
  
  timeInfo: { alignItems: "flex-end" },
  infoTag: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    backgroundColor: "#F8FAFC", 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    marginBottom: 4 
  },
  infoTagText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  dateText: { fontSize: 11, color: "#94A3B8" },

  // Empty State Styles
  emptyContainer: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: "#F1F5F9", 
    justifyContent: "center", 
    alignItems: "center",
    marginBottom: 20 
  },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#334155", textAlign: "center" },
  emptySubtext: { fontSize: 14, color: "#94A3B8", textAlign: "center", marginTop: 8, lineHeight: 20 },
});