import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenWrapper } from "../../components/ScreenWrapper";
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

  // ✅ FIX: Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.userId) {
        fetchMyJobs();
      }
    }, [user?.userId])
  );

  const fetchMyJobs = async () => {
    try {
      // Calls the new backend endpoint we just added
      const res = await api.get(`/Jobs/client/${user?.userId}`);
      setJobs(res.data);
    } catch (e) {
      console.log('Error fetching jobs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ClientJobDetails', { jobId: item.jobId })}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.status, { backgroundColor: item.status === 0 ? '#DCFCE7' : '#F1F5F9' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.status === 0 ? '#16A34A' : '#64748B' }}>
            {item.status === 0 ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.val}>{item.bidsCount || 0}</Text>
          <Text style={styles.label}>Bids</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.val}>${item.budget}</Text>
          <Text style={styles.label}>Budget</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.val}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.label}>Posted</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateJob')}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 20}} />
      ) : (
        <FlatList 
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.jobId.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyJobs(); }} />}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
              <Text style={{color: '#64748B'}}>No jobs posted yet.</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowOpacity: 0.05, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 12 },
  stat: { alignItems: 'center' },
  val: { fontWeight: '700', color: '#0F172A' },
  label: { fontSize: 12, color: '#64748B' },
});