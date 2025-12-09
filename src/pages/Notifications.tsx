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
import { ScreenWrapper } from "../../components/ScreenWrapper";
import api from "../config/api";
import { useUser } from "../context/UserContext";

interface Notification {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: number;
  relatedEntityId?: number;
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
    if (!user?.userId) return;
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
    // 1. Optimistic Update
    const updated = notifications.map((n) =>
      n.notificationId === item.notificationId ? { ...n, isRead: true } : n
    );
    setNotifications(updated);

    // 2. Mark as read
    try {
      await api.put(`/Notifications/${item.notificationId}/read`);
      refreshCounts();
    } catch (e) {
      console.log(e);
    }

    // 3. Navigation Logic
    switch (item.type) {
      case 1: // Bid Placed
        if (item.relatedEntityId) {
          if (user?.userType === 1) {
            navigation.navigate("ClientJobDetails", {
              jobId: item.relatedEntityId,
            });
          } else {
            navigation.navigate("JobDetails", { jobId: item.relatedEntityId });
          }
        }
        break;

      case 2: // Bid Accepted
        if (item.relatedEntityId) {
          navigation.navigate("JobDetails", { jobId: item.relatedEntityId });
        }
        break;

      // ✅ UPDATED: Chat Message is now Type 9
      case 9:
        if (item.relatedEntityId) {
          navigation.navigate("ChatScreen", {
            conversationId: item.relatedEntityId,
          });
        }
        break;

      case 5: // Connection Request
        navigation.navigate("Connections");
        break;

      // ✅ UPDATED: Connection Accepted is Type 10
      case 10:
        navigation.navigate("Connections", {
          highlightUserId: item.relatedEntityId,
        });
        break;

      case 6: // Like
      case 7: // Comment
      case 8: // Reaction
        if (item.relatedEntityId) {
          navigation.navigate("SocialPage", {
            targetPostId: item.relatedEntityId,
          });
        } else {
          navigation.navigate("SocialPage");
        }
        break;

      default:
        // Handle generic system messages (Type 4 or 0)
        if (item.relatedEntityId && (item.type === 0 || item.type === 4)) {
          if (user?.userType === 1) {
            navigation.navigate("ClientJobDetails", {
              jobId: item.relatedEntityId,
            });
          } else {
            navigation.navigate("JobDetails", { jobId: item.relatedEntityId });
          }
        }
    }
  };

  const getIcon = (type: number) => {
    switch (type) {
      case 1:
        return <Ionicons name="pricetag" size={24} color="#3B82F6" />;
      case 2:
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 9:
        return <Ionicons name="chatbubbles" size={24} color="#2563EB" />; // ✅ Chat (Type 9)
      case 5:
        return <Ionicons name="person-add" size={24} color="#8B5CF6" />;
      case 10:
        return <Ionicons name="people" size={24} color="#059669" />; // ✅ Connected (Type 10)
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
    <ScreenWrapper style={styles.container} scrollable={false}>
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
          keyExtractor={(item) => item.notificationId.toString()}
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
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
