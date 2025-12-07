import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
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
      hasPlacedBid: !isClient, // true for freelancer list
    });
  };

  const getStatusMeta = (status: number) => {
    switch (status) {
      case 0:
        return { bg: "#FEF3C7", text: "#D97706", label: "Pending" };
      case 1:
        return { bg: "#DCFCE7", text: "#16A34A", label: "Accepted" };
      case 2:
        return { bg: "#FEE2E2", text: "#DC2626", label: "Rejected" };
      default:
        return { bg: "#F3F4F6", text: "#4B5563", label: "Unknown" };
    }
  };

  // Unique jobs for filter chips (client view only)
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

    // Card header texts differ slightly per role
    const mainTitle = item.job?.title || `Job #${item.jobId}`;
    const secondary = isClient
      ? item.freelancer?.fullName || "Freelancer"
      : item.job?.client?.fullName || "Client";

    const secondaryLabel = isClient ? "Freelancer" : "Client";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleBidPress(item)}
      >
        <View style={styles.header}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {mainTitle}
          </Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.badgeText, { color: meta.text }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.clientName}>
          {secondaryLabel}: {secondary}
        </Text>

        <Text style={styles.proposal} numberOfLines={2}>
          {item.proposalText}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.amount}>${item.bidAmount.toFixed(2)}</Text>
          <Text style={styles.footerText}>
            {item.deliveryTimeDays} days •{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <TouchableOpacity style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <Text style={styles.title}>
            {isClient ? "Bids on my jobs" : "My bids"}
          </Text>
        </View>

        {isClient && jobsForFilter.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedJobId && styles.filterChipActive,
              ]}
              onPress={() => setSelectedJobId(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedJobId && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {jobsForFilter.map((job) => (
              <TouchableOpacity
                key={job.jobId}
                style={[
                  styles.filterChip,
                  selectedJobId === job.jobId && styles.filterChipActive,
                ]}
                onPress={() => setSelectedJobId(job.jobId)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedJobId === job.jobId && styles.filterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {job.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredBids}
            keyExtractor={(item) => item.bidId.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isClient
                    ? "No bids on your jobs yet."
                    : "You haven't placed any bids yet."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },
  filterBar: {
    backgroundColor: "#F8FAFC",
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    backgroundColor: "#EFF6FF",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 13,
    color: "#1E293B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  clientName: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  proposal: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
  },
  arrowBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 12,
    fontSize: 16,
  },
});
