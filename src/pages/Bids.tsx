import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useUser } from '../context/UserContext';
import api from '../config/api';

export default function Bids() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBids();
    }, [user?.userId])
  );

  const fetchBids = async () => {
    if (!user) return;
    try {
      // Use the updated endpoint that includes Job info
      const endpoint = user.userType === 1 
        ? `/Bids/job/1` // Placeholder for Client (future logic)
        : `/Bids/freelancer/${user.userId}`; 
        
      const response = await api.get(endpoint);
      setBids(response.data);
    } catch (error) {
      console.log('Error fetching bids', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBids();
  };

  const handleBidPress = (bid: any) => {
    // Navigate to JobDetails
    // We pass 'hasPlacedBid: true' because if it's in this list, we definitely bid on it!
    navigation.navigate('JobDetails', { 
      jobData: bid.job, 
      jobId: bid.jobId,
      hasPlacedBid: true 
    });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
      case 1: return { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted' };
      case 2: return { bg: '#FEE2E2', text: '#DC2626', label: 'Rejected' };
      default: return { bg: '#F3F4F6', text: '#4B5563', label: 'Unknown' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleBidPress(item)} activeOpacity={0.7}>
        <View style={styles.header}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.job?.title || 'Unknown Job'}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
        
        <Text style={styles.clientName}>
          {item.job?.client?.fullName || 'Client'} • {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.amount}>${item.bidAmount}</Text>
          <View style={styles.arrowBtn}>
             <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>My Bids</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => item.bidId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>You haven't placed any bids yet.</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#F1F5F9' },
  amount: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  arrowBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748B', marginTop: 12, fontSize: 16 },
});