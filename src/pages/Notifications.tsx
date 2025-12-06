import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useUser } from '../context/UserContext';
import api from '../config/api';

interface Notification {
  notificationId: number;
  title: string;
  message: string;
  type: number;
  createdAt: string;
  isRead: boolean;
}

export default function Notifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/Notifications/user/${user.userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.log('Error fetching notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: number) => {
    switch (type) {
      case 1: return <Ionicons name="document-text" size={24} color="#3B82F6" />; // Bid Placed
      case 2: return <Ionicons name="checkmark-circle" size={24} color="#10B981" />; // Bid Accepted
      case 3: return <Ionicons name="cash" size={24} color="#F59E0B" />; // Payment
      default: return <Ionicons name="notifications" size={24} color="#6B7280" />;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
      <View style={styles.iconContainer}>{getIcon(item.type)}</View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    // ✅ FIX: scrollable={false} prevents the nesting error
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notifications yet.</Text>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  unreadCard: { backgroundColor: '#F0F9FF', borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  iconContainer: { marginRight: 12, justifyContent: 'center' },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  cardMessage: { fontSize: 14, color: '#475569', marginBottom: 6 },
  cardDate: { fontSize: 12, color: '#94A3B8' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },
});