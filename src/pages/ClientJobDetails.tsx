import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, Alert, StatusBar, Modal 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

const Tabs = ({ activeTab, onTabChange }: any) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'overview' && styles.activeTab]} 
      onPress={() => onTabChange('overview')}
    >
      <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.tab, activeTab === 'proposals' && styles.activeTab]} 
      onPress={() => onTabChange('proposals')}
    >
      <Text style={[styles.tabText, activeTab === 'proposals' && styles.activeTabText]}>Proposals</Text>
    </TouchableOpacity>
  </View>
);

export default function ClientJobDetails() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { jobId } = route.params;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals'); 
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobData();
  }, []);

  const fetchJobData = async () => {
    try {
      console.log(`Fetching full details for Job ID: ${jobId}`);
      const res = await api.get(`/Jobs/${jobId}/bids-full`);
      
      console.log("JOB DATA RECEIVED:", res.data); // ✅ CHECK TERMINAL FOR THIS
      console.log("BIDS ARRAY:", res.data.bids);   // ✅ CHECK IF THIS IS EMPTY

      setJob(res.data);
    } catch (e) {
      console.log("Error fetching job:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: number, freelancerName: string) => {
    Alert.alert(
      "Accept Proposal",
      `Hire ${freelancerName}? This will start the contract and close the job.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Accept", 
          onPress: async () => {
            setProcessingId(bidId);
            try {
              await api.put(`/Bids/${bidId}/accept`);
              Alert.alert("Success", "Bid accepted! Contract started.");
              fetchJobData(); 
            } catch (e) {
              Alert.alert("Error", "Failed to accept bid.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleChat = async (freelancer: any) => {
    try {
      const res = await api.post('/Chat/open', {
        user1Id: job.clientId,
        user2Id: freelancer.userId,
        jobId: job.jobId
      });
      navigation.navigate('ChatScreen', { conversationId: res.data.conversationId, otherUser: freelancer });
    } catch (e) {
      console.log("Chat Error:", e);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />;
  if (!job) return <View style={styles.container}><Text style={styles.emptyText}>Job not found.</Text></View>;

  // ✅ CALCULATE AVERAGE SAFELY
  const bids = job.bids || [];
  const bidCount = bids.length;
  
  // Ensure bidAmount is treated as a number
  const totalAmount = bids.reduce((sum: number, b: any) => sum + (Number(b.bidAmount) || 0), 0);
  const avgBid = bidCount > 0 ? (totalAmount / bidCount).toFixed(0) : '0';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Job</Text>
        <View style={{width: 32}} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: job.status === 0 ? '#DCFCE7' : '#F1F5F9' }]}>
            <Text style={[styles.statusText, { color: job.status === 0 ? '#16A34A' : '#64748B' }]}>
              {job.status === 0 ? 'ACTIVE' : 'CLOSED'}
            </Text>
          </View>
          <Text style={styles.postedDate}>Posted {new Date(job.createdAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricVal}>${job.budget}</Text>
            <Text style={styles.metricLabel}>Budget</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={styles.metricVal}>{bidCount}</Text>
            <Text style={styles.metricLabel}>Proposals</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={styles.metricVal}>${avgBid}</Text>
            <Text style={styles.metricLabel}>Avg. Bid</Text>
          </View>
        </View>
      </View>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <View style={styles.content}>
        {activeTab === 'overview' ? (
          <ScrollView contentContainerStyle={styles.overviewContainer}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.bodyText}>{job.description}</Text>
            
            <Text style={styles.sectionHeader}>Details</Text>
            <View style={styles.detailRow}><Ionicons name="pricetag-outline" size={18} color="#64748B"/><Text style={styles.detailText}>{job.category}</Text></View>
            <View style={styles.detailRow}><Ionicons name="globe-outline" size={18} color="#64748B"/><Text style={styles.detailText}>{job.isRemote ? 'Remote' : 'On-site'}</Text></View>
            <View style={styles.detailRow}><Ionicons name="ribbon-outline" size={18} color="#64748B"/><Text style={styles.detailText}>{job.experienceLevel}</Text></View>
          </ScrollView>
        ) : (
          <FlatList
            data={bids}
            keyExtractor={(item:any) => item.bidId.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No proposals yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.bidCard}>
                <View style={styles.bidHeader}>
                  <View style={styles.bidAvatar}>
                    <Text style={styles.bidAvatarText}>{item.freelancer?.fullName?.[0] || 'U'}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.bidName}>{item.freelancer?.fullName || 'Unknown User'}</Text>
                    <Text style={styles.bidTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.bidPrice}>${item.bidAmount}</Text>
                </View>

                <View style={styles.proposalBox}>
                  <Text style={styles.proposalText}>{item.proposalText || "No cover letter provided."}</Text>
                </View>

                <View style={styles.bidActions}>
                  <TouchableOpacity style={styles.chatBtn} onPress={() => handleChat(item.freelancer)}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#64748B" />
                  </TouchableOpacity>

                  {item.status === 1 ? (
                    <View style={styles.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                      <Text style={styles.acceptedText}>Accepted</Text>
                    </View>
                  ) : job.status !== 0 ? (
                    <Text style={styles.closedText}>Job Closed</Text>
                  ) : (
                    <TouchableOpacity 
                      style={styles.acceptBtn} 
                      onPress={() => handleAcceptBid(item.bidId, item.freelancer?.fullName)}
                      disabled={processingId === item.bidId}
                    >
                      {processingId === item.bidId ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  
  summaryCard: { backgroundColor: '#FFF', padding: 20, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  jobTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  postedDate: { color: '#64748B', fontSize: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12 },
  metric: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  metricLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#E2E8F0' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#2563EB' },

  content: { flex: 1 },
  overviewContainer: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 16, marginBottom: 8 },
  bodyText: { fontSize: 15, color: '#334155', lineHeight: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailText: { fontSize: 15, color: '#475569' },

  listContent: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40 },
  
  bidCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bidAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bidAvatarText: { color: '#2563EB', fontWeight: '700' },
  bidName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  bidTime: { fontSize: 12, color: '#94A3B8' },
  bidPrice: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  
  proposalBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16 },
  proposalText: { fontSize: 14, color: '#334155', fontStyle: 'italic' },

  bidActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  chatBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
  acceptBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  acceptBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  
  acceptedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  acceptedText: { color: '#16A34A', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  closedText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
});