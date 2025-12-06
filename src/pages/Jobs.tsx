import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { JobCard } from '../../components/JobCard';
import { Job } from '../types/job';
import { useUser } from '../context/UserContext';
import { ScreenWrapper } from '../../components/ScreenWrapper';

const COLORS = {
  bg: '#F1F5F9',
  primary: '#2563EB',
  dark: '#0F172A',
  white: '#FFFFFF',
};

export default function Jobs() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  
  // -- State --
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');

  // -- Reload jobs when screen comes into focus (e.g. after placing a bid) --
  useFocusEffect(
    useCallback(() => {
      fetchJobs(true);
    }, [user?.userId, activeFilter])
  );

  const fetchJobs = async (isRefresh = false) => {
    if (loading && !isRefresh) return;
    if (isRefresh) setLoading(true);

    try {
      const currentPage = isRefresh ? 1 : page;
      
      const response = await api.get('/Jobs/search', {
        params: {
          query: searchQuery,
          category: activeFilter === 'All' ? undefined : activeFilter,
          page: currentPage,
          pageSize: 10,
          currentUserId: user?.userId // ✅ CRITICAL: Sends ID to check for "Bid Placed"
        }
      });
      
      // Handle both paginated response { data: [], totalCount: ... } and array response
      const data = response.data.data || response.data || []; 

      if (isRefresh) {
        setJobs(data);
        setPage(2);
      } else {
        setJobs(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }

    } catch (error) {
      console.error('Fetch Jobs Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = () => {
    fetchJobs(true);
  };

  const openJobDetails = (job: Job) => {
    navigation.navigate('JobDetails', { jobData: job, jobId: job.jobId });
  };

  // -- Render Header --
  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.dark, '#1E293B']}
      style={styles.headerGradient}
    >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Find Work</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs, skills..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
            />
            <TouchableOpacity style={styles.filterBtn} onPress={() => fetchJobs(true)}>
               <Ionicons name="search" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Filters */}
          <View style={styles.filtersRow}>
            {['All', 'Development', 'Design', 'Marketing'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive
                ]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
    </LinearGradient>
  );

  return (
    // scrollable={false} because FlatList handles scrolling
    <ScreenWrapper style={styles.container} scrollable={false}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} onPress={openJobDetails} />}
        keyExtractor={(item) => item.jobId.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={() => {
          setRefreshing(true);
          fetchJobs(true);
        }}
        refreshing={refreshing}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No jobs found matching your search.</Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 5,
  },
  headerContent: { paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#FFF',
    padding: 12,
    paddingLeft: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: { position: 'absolute', left: 12, top: 14 },
  filterBtn: {
    width: 48, height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  filtersRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: { backgroundColor: '#FFF' },
  filterText: { color: '#94A3B8', fontWeight: '500' },
  filterTextActive: { color: COLORS.dark, fontWeight: '700' },
  listContent: { padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#64748B', marginTop: 12 },
});