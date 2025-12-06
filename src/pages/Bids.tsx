import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useUser } from '../context/UserContext';
import api from '../config/api';

export default function Bids() {
  const { user } = useUser();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBids();
  }, [user]);

  const fetchBids = async () => {
    try {
      const endpoint = user?.userType === 1 
        ? `/Bids/job/1` // For clients (needs dynamic logic later)
        : `/Bids/freelancer/${user?.userId}`; // For freelancers
        
      const response = await api.get(endpoint);
      setBids(response.data);
    } catch (error) {
      console.log('Error fetching bids', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ FIX: scrollable={false}
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bids</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item: any) => item.bidId.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No bids found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.amount}>${item.bidAmount}</Text>
                <Text style={[styles.status, 
                  item.status === 1 ? styles.accepted : 
                  item.status === 2 ? styles.rejected : styles.pending
                ]}>
                  {item.status === 1 ? 'Accepted' : item.status === 2 ? 'Rejected' : 'Pending'}
                </Text>
              </View>
              <Text style={styles.proposal} numberOfLines={2}>{item.proposalText}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          )}
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
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowOpacity: 0.05, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amount: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  status: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  pending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  accepted: { backgroundColor: '#DCFCE7', color: '#16A34A' },
  rejected: { backgroundColor: '#FEE2E2', color: '#DC2626' },
  proposal: { color: '#475569', fontSize: 14, marginBottom: 8 },
  date: { color: '#94A3B8', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },
});