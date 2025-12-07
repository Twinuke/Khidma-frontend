import React, { useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, 
  RefreshControl, StatusBar 
} from 'react-native';
import { useUser } from '../context/UserContext';
import api from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ClientMyJobs() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter State: 'OPEN', 'CLOSED', or 'ALL'
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');

  useFocusEffect(
    useCallback(() => {
      if (user?.userId) fetchMyJobs();
    }, [user?.userId])
  );

  const fetchMyJobs = async () => {
    try {
      const res = await api.get(`/Jobs/client/${user?.userId}`);
      setJobs(res.data);
    } catch (e) {
      console.log('Error fetching jobs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter Logic
  const filteredJobs = jobs.filter((job: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return job.status === 0;
    if (filter === 'CLOSED') return job.status !== 0;
    return true;
  });

  const renderJobCard = ({ item }: { item: any }) => {
    const isOpen = item.status === 0;
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ClientJobDetails', { jobId: item.jobId })}
      >
        <View style={styles.cardTop}>
          <View style={styles.titleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
              <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
                {isOpen ? 'ACTIVE' : 'CLOSED'}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>Posted {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={16} color="#64748B" />
            <Text style={styles.statValue}>${item.budget}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#64748B" />
            <Text style={styles.statValue}>{item.bidsCount} Proposals</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <Text style={styles.headerSubtitle}>Manage your listings</Text>
        </View>
        {/* Connections Shortcut */}
        <TouchableOpacity onPress={() => navigation.navigate('Connections')} style={styles.iconBtn}>
           <Ionicons name="people" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {['OPEN', 'CLOSED', 'ALL'].map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[styles.tab, filter === f && styles.activeTab]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.tabText, filter === f && styles.activeTabText]}>
              {f === 'OPEN' ? 'Active' : f === 'CLOSED' ? 'Closed' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList 
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item: any) => item.jobId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyJobs(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {filter.toLowerCase()} jobs found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateJob')}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 14, color: '#64748B' },
  iconBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#FFF' },
  tab: { marginRight: 15, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F1F5F9' },
  activeTab: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFF' },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, padding: 20, shadowOpacity: 0.05, elevation: 3 },
  cardTop: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
  dateText: { fontSize: 12, color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusOpen: { backgroundColor: '#DCFCE7' },
  statusClosed: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textOpen: { color: '#16A34A' },
  textClosed: { color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#334155' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#94A3B8' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8 }
});