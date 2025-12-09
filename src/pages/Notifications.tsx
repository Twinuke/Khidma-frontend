import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

// ✅ Flexible interface to handle potential casing issues
interface Notification {
  notificationId?: number; // Backend might send NotificationId
  NotificationId?: number;
  userId: number;
  title: string;
  message: string;
  type: number;
  relatedEntityId?: number;
  RelatedEntityId?: number;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { user, refreshCounts } = useUser();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      refreshCounts();
    }, [user?.userId])
  );

  const fetchNotifications = async () => {
    // ✅ FIX: Ensure loading stops even if user is missing
    if (!user?.userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await api.get(`/Notifications/user/${user.userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handlePress = async (item: Notification) => {
    // Helper to get ID safely
    const id = item.notificationId || item.NotificationId;
    const entityId = item.relatedEntityId || item.RelatedEntityId;

    if (!id) return;

    // 1. Optimistic Update
    const updated = notifications.map((n) => {
      const nId = n.notificationId || n.NotificationId;
      return nId === id ? { ...n, isRead: true } : n;
    });
    setNotifications(updated);

    // 2. Mark as read
    try {
      await api.put(`/Notifications/${id}/read`);
      refreshCounts();
    } catch (e) {
      console.log(e);
    }

    // 3. Navigation Logic
    if (entityId) {
      switch (item.type) {
        case 1: // Bid Placed (Freelancer POV)
        case 4: // System (Generic Job Updates)
          if (user?.userType === 1) {
            // Client
            navigation.navigate("ClientJobDetails", { jobId: entityId });
          } else {
            // Freelancer
            // ✅ FIX: Show "Already Applied" state
            navigation.navigate("JobDetails", {
              jobId: entityId,
              hasPlacedBid: true,
            });
          }
          break;

        case 2: // Bid Accepted
          // Go to Job Details (which will show contract/status)
          navigation.navigate("JobDetails", {
            jobId: entityId,
            hasPlacedBid: true,
          });
          break;

        case 9: // Chat Message
          navigation.navigate("ChatScreen", {
            conversationId: entityId,
          });
          break;

        case 5: // Connection Request
          navigation.navigate("Connections");
          break;

        case 10: // Connection Accepted
          navigation.navigate("Connections", {
            highlightUserId: entityId,
          });
          break;

        case 6: // Social Interactions
        case 7:
        case 8:
          navigation.navigate("SocialPage", {
            targetPostId: entityId,
          });
          break;

        default:
          break;
      }
    } else {
      // Fallback for types without entity ID
      if (item.type === 5 || item.type === 10)
        navigation.navigate("Connections");
      if ([6, 7, 8].includes(item.type)) navigation.navigate("SocialPage");
    }
  };

  const getIcon = (type: number) => {
    switch (type) {
      case 1:
        return <Ionicons name="pricetag" size={24} color="#3B82F6" />;
      case 2:
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 9:
        return <Ionicons name="chatbubbles" size={24} color="#2563EB" />;
      case 5:
        return <Ionicons name="person-add" size={24} color="#8B5CF6" />;
      case 10:
        return <Ionicons name="people" size={24} color="#059669" />;
      case 6:
        return <Ionicons name="heart" size={24} color="#EF4444" />;
      case 7:
        return <Ionicons name="chatbubble" size={24} color="#F59E0B" />;
      case 8:
        return <Ionicons name="happy" size={24} color="#F59E0B" />;
      default:
        return <Ionicons name="notifications" size={24} color="#6B7280" />;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{getIcon(item.type)}</View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    // Replaced ScreenWrapper with standard View to ensure basic compatibility if wrapper is missing
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={notifications}
          // ✅ FIX: Safe access to ID
          keyExtractor={(item) =>
            (
              item.notificationId ||
              item.NotificationId ||
              Math.random()
            ).toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color="#CBD5E1"
              />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60, // Adjusted for safe area
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unreadCard: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  iconContainer: { marginRight: 12, justifyContent: "center" },
  textContainer: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 12,
    fontSize: 16,
  },
});
