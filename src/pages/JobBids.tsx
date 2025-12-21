import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import api from "../config/api";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { MiniProfileSheet } from "../components/MiniProfileSheet"; // ✅ Make sure this exists

export default function JobBids() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { jobId, jobTitle } = route.params;

  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Mini Profile State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [miniProfileVisible, setMiniProfileVisible] = useState(false);

  const fetchBids = async () => {
    try {
      const response = await api.get(`/Bids/job/${jobId}`);
      setBids(response.data);
    } catch (error) {
      console.log("Error fetching bids", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [jobId]);

  // ✅ Handler to open profile
  const handleOpenProfile = (userId: number) => {
    setSelectedUserId(userId);
    setMiniProfileVisible(true);
  };

  const handleChat = (freelancerId: number, freelancerName: string) => {
      // Navigate to chat (assuming you have this logic)
      navigation.navigate('ChatScreen', { 
          chatId: null, // New chat
          receiverId: freelancerId, 
          receiverName: freelancerName 
      });
  };

  const renderBid = ({ item }: { item: any }) => (
    <View style={styles.bidCard}>
      <View style={styles.bidHeader}>
        {/* ✅ Clickable User Info */}
        <TouchableOpacity 
            style={styles.userInfo} 
            onPress={() => handleOpenProfile(item.freelancerId)}
        >
          <Image
            source={{
              uri: item.freelancerAvatar || `https://ui-avatars.com/api/?name=${item.freelancerName}&background=random`,
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{item.freelancerName}</Text>
            <Text style={styles.timeAgo}>
                {new Date(item.bidDate).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>${item.amount}</Text>
        </View>
      </View>

      <Text style={styles.proposalText}>{item.proposal}</Text>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.chatBtn} 
            onPress={() => handleChat(item.freelancerId, item.freelancerName)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.acceptBtn} onPress={() => Alert.alert("Accept", "Accept logic here")}>
          <Text style={styles.acceptText}>Accept Bid</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{flex: 1}}>
            <Text style={styles.title}>Bids for Job</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{jobTitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={bids}
          renderItem={renderBid}
          keyExtractor={(item) => item.bidId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBids(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No bids yet.</Text>
            </View>
          }
        />
      )}

      {/* ✅ Mini Profile Sheet Component */}
      <MiniProfileSheet
        visible={miniProfileVisible}
        userId={selectedUserId}
        onClose={() => setMiniProfileVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B" },
  listContent: { padding: 20 },
  
  // Bid Card Styles
  bidCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  timeAgo: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  amountBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amountText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 14,
  },
  proposalText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  chatText: {
    marginLeft: 6,
    color: "#64748B",
    fontWeight: "600",
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#94A3B8",
  },
});