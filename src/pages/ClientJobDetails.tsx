import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const Tabs = ({ activeTab, onTabChange }: any) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tab, activeTab === "overview" && styles.activeTab]}
      onPress={() => onTabChange("overview")}
    >
      <Text
        style={[
          styles.tabText,
          activeTab === "overview" && styles.activeTabText,
        ]}
      >
        Overview
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, activeTab === "proposals" && styles.activeTab]}
      onPress={() => onTabChange("proposals")}
    >
      <Text
        style={[
          styles.tabText,
          activeTab === "proposals" && styles.activeTabText,
        ]}
      >
        Proposals
      </Text>
    </TouchableOpacity>
  </View>
);

export default function ClientJobDetails() {
  const { user } = useUser();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("proposals");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ✅ Store IDs of people I am already connected with
  const [connectedUserIds, setConnectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    fetchJobData();
    if (user?.userId) {
      fetchConnections();
    }
  }, [user?.userId]);

  const fetchJobData = async () => {
    try {
      const res = await api.get(`/Jobs/${jobId}/bids-full`);
      setJob(res.data);
    } catch (e) {
      console.log("Error fetching job:", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch my friends to check status
  const fetchConnections = async () => {
    try {
      const res = await api.get(`/Social/connections/${user?.userId}`);
      // res.data is generic; assumes structure like [{ friend: { userId: 1 } }, ...]
      const ids = res.data.map((c: any) => c.friend?.userId);
      setConnectedUserIds(ids);
    } catch (e) {
      console.log("Error fetching connections:", e);
    }
  };

  const handleAcceptBid = async (bidId: number, freelancerName: string) => {
    Alert.alert(
      "Confirm Hiring",
      `Are you sure you want to hire ${freelancerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hire Now",
          onPress: async () => {
            setProcessingId(bidId);
            try {
              await api.put(`/Bids/${bidId}/accept`);
              Alert.alert("Success", "Contract started successfully!");
              fetchJobData();
            } catch (e) {
              Alert.alert("Error", "Failed to accept bid.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleChat = async (freelancer: any) => {
    try {
      const res = await api.post("/Chat/open", {
        user1Id: job.clientId,
        user2Id: freelancer.userId,
        jobId: job.jobId,
      });
      navigation.navigate("ChatScreen", {
        conversationId: res.data.conversationId,
        otherUser: freelancer,
      });
    } catch (e) {
      console.log("Chat Error:", e);
    }
  };

  const handleConnect = async (freelancerId: number) => {
    try {
      await api.post("/Social/connect", {
        requesterId: user?.userId,
        targetId: freelancerId,
      });
      Alert.alert("Success", "Connection request sent!");
    } catch (e: any) {
      const msg = e.response?.data || "Failed to send request";
      Alert.alert("Info", typeof msg === "string" ? msg : "Request failed");
    }
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  if (!job)
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Job not found.</Text>
      </View>
    );

  const bids = job.bids || [];
  const bidCount = bids.length;
  const totalAmount = bids.reduce(
    (sum: number, b: any) => sum + (Number(b.bidAmount) || 0),
    0
  );
  const avgBid = bidCount > 0 ? (totalAmount / bidCount).toFixed(0) : "0";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header with increased Top Padding */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Job Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Summary Card */}
        <View style={styles.summarySection}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.tagsRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: job.status === 0 ? "#DCFCE7" : "#F1F5F9" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: job.status === 0 ? "#16A34A" : "#64748B" },
                ]}
              >
                {job.status === 0 ? "ACTIVE" : "CLOSED"}
              </Text>
            </View>
            <Text style={styles.dateText}>
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>${job.budget}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Proposals</Text>
              <Text style={styles.statValue}>{bidCount}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg Bid</Text>
              <Text style={styles.statValue}>${avgBid}</Text>
            </View>
          </View>
        </View>

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "overview" ? (
          <View style={styles.contentPadding}>
            <Text style={styles.sectionTitle}>About the Job</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Ionicons name="pricetags-outline" size={20} color="#64748B" />
                <Text style={styles.detailText}>
                  {job.category || "General"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="earth-outline" size={20} color="#64748B" />
                <Text style={styles.detailText}>
                  {job.isRemote ? "Remote Work" : "On-Site"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="school-outline" size={20} color="#64748B" />
                <Text style={styles.detailText}>
                  {job.experienceLevel} Level
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.contentPadding}>
            {bids.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyText}>No proposals received yet.</Text>
              </View>
            ) : (
              bids.map((item: any) => {
                const isFriend = connectedUserIds.includes(
                  item.freelancer?.userId
                );

                return (
                  <View key={item.bidId} style={styles.freelancerCard}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarContainer}>
                        {item.freelancer?.profileImageUrl ? (
                          <Image
                            source={{ uri: item.freelancer.profileImageUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {item.freelancer?.fullName?.[0] || "U"}
                          </Text>
                        )}
                      </View>
                      <View style={styles.headerInfo}>
                        <Text style={styles.freelancerName}>
                          {item.freelancer?.fullName || "Unknown"}
                        </Text>
                        <Text style={styles.freelancerRole}>Freelancer</Text>
                      </View>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>${item.bidAmount}</Text>
                      </View>
                    </View>

                    {/* Delivery & Proposal */}
                    <View style={styles.cardBody}>
                      <View style={styles.metaRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#64748B"
                        />
                        <Text style={styles.metaText}>
                          Delivers in {item.deliveryTimeDays} days
                        </Text>
                      </View>
                      <View style={styles.proposalBox}>
                        <Text style={styles.proposalText} numberOfLines={4}>
                          "{item.proposalText}"
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => handleChat(item.freelancer)}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={20}
                          color="#334155"
                        />
                      </TouchableOpacity>

                      {/* ✅ Logic: If friend -> Show "Connected". Else -> Show "Connect" button */}
                      {isFriend ? (
                        <View style={styles.connectedBadge}>
                          <Ionicons name="people" size={18} color="#059669" />
                          <Text style={styles.connectedText}>Connected</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.connectButton}
                          onPress={() => handleConnect(item.freelancer?.userId)}
                        >
                          <Ionicons
                            name="person-add-outline"
                            size={18}
                            color="#0F172A"
                          />
                          <Text style={styles.connectText}>Connect</Text>
                        </TouchableOpacity>
                      )}

                      {item.status === 1 ? (
                        <View style={styles.hiredBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#16A34A"
                          />
                          <Text style={styles.hiredText}>Hired</Text>
                        </View>
                      ) : job.status === 0 ? (
                        <TouchableOpacity
                          style={styles.hireButton}
                          onPress={() =>
                            handleAcceptBid(
                              item.bidId,
                              item.freelancer?.fullName
                            )
                          }
                          disabled={processingId === item.bidId}
                        >
                          {processingId === item.bidId ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <Text style={styles.hireButtonText}>Hire</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.closedText}>Job Closed</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#EF4444", fontSize: 16 },

  // ✅ Updated Header Style (Added paddingTop for status bar)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 50, // More space at the top
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    zIndex: 10,
  },
  backBtn: { padding: 8, borderRadius: 8, backgroundColor: "#F1F5F9" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  summarySection: { backgroundColor: "#FFF", padding: 20, paddingBottom: 24 },
  jobTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
    marginBottom: 12,
  },
  tagsRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  dateText: { color: "#64748B", fontSize: 13 },

  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
  },
  statBox: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  statSeparator: { width: 1, backgroundColor: "#E2E8F0", height: "80%" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tab: {
    marginRight: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: { borderColor: "#2563EB" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#2563EB" },

  contentPadding: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#334155",
    marginBottom: 24,
  },

  detailsBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailText: { fontSize: 15, color: "#475569", fontWeight: "500" },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#94A3B8", marginTop: 12, fontSize: 15 },

  // FREELANCER CARD STYLES
  freelancerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: { width: 48, height: 48 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  headerInfo: { flex: 1 },
  freelancerName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  freelancerRole: { fontSize: 13, color: "#64748B" },
  priceTag: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: { color: "#0284C7", fontWeight: "700", fontSize: 16 },

  cardBody: { marginBottom: 16 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  metaText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  proposalBox: { backgroundColor: "#F8FAFC", padding: 12, borderRadius: 8 },
  proposalText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },

  cardActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 16,
    alignItems: "center",
  },
  chatButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  connectText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#0F172A",
    fontSize: 13,
  },

  // ✅ New "Connected" Badge Style
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  connectedText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#059669",
    fontSize: 13,
  },

  hireButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  hireButtonText: { color: "#FFF", fontWeight: "600", fontSize: 14 },

  hiredBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    gap: 6,
  },
  hiredText: { color: "#16A34A", fontWeight: "700" },
  closedText: {
    flex: 1,
    textAlign: "center",
    color: "#94A3B8",
    fontStyle: "italic",
    paddingVertical: 10,
  },
});
