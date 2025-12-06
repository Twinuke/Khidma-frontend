import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../types/job';
import { BidForm } from '../../components/BidForm';

export default function JobDetails() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const job = route.params?.jobData as Job;
  const [modalVisible, setModalVisible] = useState(false);

  // Fallback if data is missing
  if (!job) return <View style={styles.container}><Text>Error loading job</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.posted}>Posted {new Date(job.createdAt).toLocaleDateString()}</Text>
          
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Budget:</Text>
            <Text style={styles.budgetAmount}>${job.budget}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailItem}>
             <Ionicons name="folder-outline" size={18} color="#64748B" />
             <Text style={styles.detailText}>Category: {job.category || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
             <Ionicons name="globe-outline" size={18} color="#64748B" />
             <Text style={styles.detailText}>{job.isRemote ? 'Remote' : 'On-Site'}</Text>
          </View>
          <View style={styles.detailItem}>
             <Ionicons name="ribbon-outline" size={18} color="#64748B" />
             <Text style={styles.detailText}>{job.experienceLevel || 'Intermediate'}</Text>
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>About the Client</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={{color: '#2563EB', fontWeight: 'bold'}}>
                {job.client?.fullName?.[0] || 'C'}
              </Text>
            </View>
            <View>
              <Text style={styles.clientName}>{job.client?.fullName}</Text>
              <Text style={styles.clientMeta}>Verified Client</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bidBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.bidBtnText}>Apply Now</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BidForm 
            jobId={job.jobId} 
            freelancerId={1} // TODO: Replace with dynamic user ID from Auth context
            onCancel={() => setModalVisible(false)}
            onSuccess={() => {
              setModalVisible(false);
              navigation.goBack();
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  mainInfo: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  posted: { color: '#64748B', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, alignSelf: 'flex-start' },
  budgetLabel: { marginRight: 8, color: '#64748B' },
  budgetAmount: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  descText: { fontSize: 15, lineHeight: 24, color: '#334155' },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  detailText: { fontSize: 15, color: '#475569' },
  clientSection: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  clientMeta: { color: '#64748B', fontSize: 13 },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#E2E8F0' },
  bidBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 16, alignItems: 'center' },
  bidBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
});