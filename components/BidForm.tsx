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
import api from '../src/config/api';

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
      await api.post('/Bids', {
        jobId,
        freelancerId,
        bidAmount: parseFloat(amount),
        proposalText: proposal,
        deliveryTimeDays: parseInt(days),
      });
      Alert.alert('Success', 'Bid placed successfully!');
      onSuccess();
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust based on modal position
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
            // Usually, we don't dismiss keyboard on 'Enter' for multiline, 
            // but user can tap outside now thanks to ScrollView + handled.
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
  keyboardAvoid: {
    flex: 1, // Ensure it fills the modal/container space
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // Centers content if screen is tall
  },
  container: { 
    padding: 20, 
    backgroundColor: 'white', 
    borderRadius: 20 
  },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  label: { fontSize: 14, color: '#64748B', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', justifyContent:'center' },
  cancelText: { color: '#64748B', fontWeight: '600' },
  submitBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: { color: 'white', fontWeight: '700' },
});