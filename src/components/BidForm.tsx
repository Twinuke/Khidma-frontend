import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Ensure this path matches your project structure. 
// If your file is in 'components/', use '../src/config/api' or similar.
import api from "../config/api";
import { Ionicons } from "@expo/vector-icons"; 

interface BidFormProps {
  jobId: number;
  freelancerId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BidForm: React.FC<BidFormProps> = ({
  jobId,
  freelancerId,
  onSuccess,
  onCancel,
}) => {
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // --- AI FUNCTIONALITY ---
  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
      // Calls the new C# Controller
      const response = await api.get(`/AiBid/suggest/${jobId}`);
      const data = response.data;

      // Fill form with AI data
      setAmount(data.amount.toString());
      setDays(data.days.toString());
      setProposal(data.proposal);
      
      Alert.alert("✨ AI Magic", "Bid generated using Job Details & History!");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "AI could not generate a bid. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };
  // ------------------------

  const handleSubmit = async () => {
    if (!amount || !days || !proposal) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/Bids", {
        jobId,
        freelancerId,
        bidAmount: parseFloat(amount),
        proposalText: proposal,
        deliveryTimeDays: parseInt(days),
      });
      Alert.alert("Success", "Bid placed successfully!");
      onSuccess();
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          
          <View style={styles.headerRow}>
            <Text style={styles.header}>Place a Bid</Text>
            
            {/* ✨ AI BUTTON ✨ */}
            <TouchableOpacity 
              style={styles.aiButton} 
              onPress={handleAiAssist}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="white" style={{marginRight: 6}} />
                  <Text style={styles.aiButtonText}>AI Auto-Fill</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Bid Amount ($)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 500"
          />

          <Text style={styles.label}>Delivery Time (Days)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
            placeholder="e.g. 7"
          />

          <Text style={styles.label}>Proposal</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={proposal}
            onChangeText={setProposal}
            placeholder="Why are you the best fit?"
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Submit Proposal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  container: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  aiButton: {
    backgroundColor: "#8B5CF6", // Purple/Violet color for AI
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  aiButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  label: { fontSize: 14, color: "#64748B", marginBottom: 6 },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#64748B", fontWeight: "600" },
  submitBtn: {
    flex: 2,
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "700" },
});