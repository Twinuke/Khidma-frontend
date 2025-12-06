import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '../src/types/job';

const COLORS = {
  bg: '#FFF',
  primary: '#2563EB',
  textMain: '#0F172A',
  textSec: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  grayBg: '#F3F4F6'
};

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  return (
    <TouchableOpacity 
      // ✅ FIX: Apply gray style if bid placed
      style={[styles.card, job.hasPlacedBid && styles.cardDisabled]} 
      onPress={() => onPress(job)} 
      activeOpacity={0.9}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.client}>
            {job.client?.fullName || 'Unknown Client'}
          </Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${job.budget}</Text>
        </View>
      </View>

      {/* ✅ FIX: Red Badge if Bid Placed */}
      {job.hasPlacedBid && (
        <View style={styles.bidBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#FFF" />
          <Text style={styles.bidBadgeText}>Bid Placed</Text>
        </View>
      )}

      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{job.category || 'General'}</Text>
        </View>
        {job.isRemote && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Remote</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.iconRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSec} />
          <Text style={styles.footerText}>{timeAgo(job.createdAt)}</Text>
        </View>
        <View style={styles.iconRow}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.textSec} />
          <Text style={styles.footerText}>{job.bidsCount || 0} Bids</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDisabled: {
    backgroundColor: COLORS.grayBg,
    opacity: 0.9,
    borderColor: '#D1D5DB'
  },
  bidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  bidBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  client: { fontSize: 12, color: COLORS.textSec },
  priceTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 8 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, color: '#475569', fontWeight: '500' },
  description: { fontSize: 13, color: COLORS.textSec, lineHeight: 18, marginBottom: 12 },
  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, gap: 16 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: COLORS.textSec },
});