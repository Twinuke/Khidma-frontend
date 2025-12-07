import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import api from "../config/api";
import { useUser } from "../context/UserContext";

// Matches your backend model exactly
interface Notification {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: number; // 0=General, 1=BidPlaced, 2=BidAccepted, etc.
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [user?.userId])
  );

  const fetchNotifications = async () => {
    if (!user?.userId) return;

    try {
      // Calls your existing endpoint: GET /api/Notifications/user/{userId}
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

  const getIcon = (type: number) => {
    switch (type) {
      case 1: // BidPlaced
        return <Ionicons name="pricetag" size={24} color="#3B82F6" />;
      case 2: // BidAccepted
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 3: // Payment
        return <Ionicons name="cash" size={24} color="#F59E0B" />;
      default:
        return <Ionicons name="notifications" size={24} color="#6B7280" />;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <View style={styles.iconContainer}>{getIcon(item.type)}</View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
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
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#0F172A" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
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
  unreadCard: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
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
