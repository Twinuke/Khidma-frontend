import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

type MyJobsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyJobs"
>;

interface MyJobItem {
  jobId: number;
  title: string;
  description: string;
  category?: string;
  budget: number;
  status: number;
  createdAt: string;
  bidsCount: number;
}

const statusLabel = (status: number) => {
  switch (status) {
    case 0:
      return "Open";
    case 1:
      return "Assigned";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export default function MyJobs() {
  const navigation = useNavigation<MyJobsScreenNavigationProp>();
  const { user } = useUser();

  const [jobs, setJobs] = useState<MyJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!user || user.userType !== 1) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/Jobs/client/${user.userId}`);
      setJobs(response.data);
    } catch (error) {
      console.log("MyJobs error", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const openJobDetails = (job: MyJobItem) => {
    navigation.navigate("JobDetails", { jobId: job.jobId });
  };

  const renderItem = ({ item }: { item: MyJobItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => openJobDetails(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.meta}>Budget: ${item.budget.toFixed(2)}</Text>
      <Text style={styles.meta}>Bids: {item.bidsCount}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Jobs</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.jobId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                You have not posted any jobs yet.
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
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#1D4ED8" },
  meta: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { marginTop: 60, alignItems: "center" },
  emptyText: { color: "#6B7280", fontSize: 15 },
});
