import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import api from '../config/api';

interface BidFormProps {
  jobId: number;
  freelancerId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BidForm: React.FC<BidFormProps> = ({ jobId, freelancerId, onSuccess, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !days || !proposal) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Submit Bid
      // The backend (BidsController) AUTOMATICALLY creates the notification
      await api.post('/Bids', {
        jobId,
        freelancerId,
        bidAmount: parseFloat(amount),
        proposalText: proposal,
        deliveryTimeDays: parseInt(days),
      });

      Alert.alert('Success', 'Bid placed successfully!');
      onSuccess(); // Close modal / Refresh parent
    } catch (error: any) {
      console.log('Bid Error:', error);
      Alert.alert('Error', 'Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.header}>Place a Bid</Text>
          
          <Text style={styles.label}>Bid Amount ($)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            returnKeyType="next"
            value={amount} 
            onChangeText={setAmount}
            placeholder="e.g. 500" 
          />

          <Text style={styles.label}>Delivery Time (Days)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            returnKeyType="next"
            value={days} 
            onChangeText={setDays}
            placeholder="e.g. 7" 
          />

          <Text style={styles.label}>Cover Letter</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            multiline 
            value={proposal} 
            onChangeText={setProposal}
            placeholder="Why are you the best fit?"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Proposal</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { padding: 24, backgroundColor: 'white', borderRadius: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  label: { fontSize: 14, color: '#64748B', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', justifyContent:'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  cancelText: { color: '#64748B', fontWeight: '600', fontSize: 16 },
  submitBtn: { flex: 2, backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
});