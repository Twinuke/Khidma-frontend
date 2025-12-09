import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../../App";
import api from "../config/api";
import { useUser } from "../context/UserContext";

type JobBidsNav = NativeStackNavigationProp<RootStackParamList, "JobBids">;

interface BidItem {
  bidId: number;
  jobId: number;
  freelancerId: number;
  bidAmount: number;
  deliveryTimeDays: number;
  proposalText: string;
  createdAt: string;
  status: number;
  freelancer?: {
    userId: number;
    fullName: string;
  };
}

const statusMeta = (status: number) => {
  switch (status) {
    case 0:
      return { label: "Pending", color: "#D97706", bg: "#FEF3C7" };
    case 1:
      return { label: "Accepted", color: "#16A34A", bg: "#DCFCE7" };
    case 2:
      return { label: "Rejected", color: "#DC2626", bg: "#FEE2E2" };
    default:
      return { label: "Unknown", color: "#4B5563", bg: "#E5E7EB" };
  }
};

export default function JobBids() {
  const route = useRoute<any>();
  const navigation = useNavigation<JobBidsNav>();
  const { user } = useUser();

  const { jobId, jobTitle } = route.params || {};

  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBids = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await api.get(`/Bids/job/${jobId}`);
      setBids(response.data);
    } catch (error) {
      console.log("Load job bids error", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBids();
  };

  const handleAccept = async (bid: BidItem) => {
    if (!user || user.userType !== 1) {
      Alert.alert("Error", "Only clients can accept bids.");
      return;
    }
    Alert.alert("Accept bid", `Accept bid of $${bid.bidAmount.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          try {
            await api.put(`/Bids/${bid.bidId}/accept`);
            Alert.alert("Success", "Bid accepted.");
            loadBids();
          } catch (error) {
            Alert.alert("Error", "Failed to accept bid.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BidItem }) => {
    const meta = statusMeta(item.status);
    const isPending = item.status === 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.freelancerName}>
            {item.freelancer?.fullName || "Freelancer"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.amount}>${item.bidAmount.toFixed(2)}</Text>
        <Text style={styles.meta}>Delivery: {item.deliveryTimeDays} days</Text>
        <Text style={styles.meta}>
          Placed: {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <Text style={styles.proposalLabel}>Proposal</Text>
        <Text style={styles.proposalText}>{item.proposalText}</Text>

        {isPending && (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept(item)}
          >
            <Text style={styles.acceptText}>Accept bid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ✅ Standardized Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Job Bids</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => item.bidId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No bids received yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // ✅ Standard Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerTitle: {
    flex: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerRight: { flex: 1, alignItems: "flex-end" },
  iconBtn: { padding: 4 },

  list: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  freelancerName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  amount: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  meta: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  proposalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 10,
  },
  proposalText: { fontSize: 13, color: "#374151", marginTop: 4 },
  acceptBtn: {
    marginTop: 14,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#6B7280", fontSize: 15 },
});
