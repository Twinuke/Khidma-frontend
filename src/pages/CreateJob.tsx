import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { RootStackParamList } from "../../App";
import api from "../config/api";
import { useUser } from "../context/UserContext";

type CreateJobScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateJob">;

const SKILL_GROUPS = [
  { title: "Development", color: "#2563EB", skills: ["React", "Node.js", "Python", "C#", ".NET", "PHP", "SQL"] },
  { title: "Mobile", color: "#7C3AED", skills: ["React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android"] },
  { title: "Creative", color: "#DB2777", skills: ["Figma", "UI/UX", "Photoshop", "Illustrator", "Video Editing"] },
  { title: "Business", color: "#059669", skills: ["SEO", "Marketing", "Copywriting", "Project Management"] }
];

const AnimatedPill = ({ item, isSelected, color, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View 
        style={[
          styles.pill, 
          isSelected && { backgroundColor: color, borderColor: color, elevation: 4 },
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{item}</Text>
        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" style={{marginLeft: 4}} />}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function CreateJob() {
  const navigation = useNavigation<CreateJobScreenNavigationProp>();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [isRemote, setIsRemote] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setIsGenerating(true);
    try {
      const response = await api.post("/AiJobs/suggest-fields", { userInput: aiInput });
      const data = response.data;
      setTitle(data.title || "");
      setDescription(data.description || "");
      setBudget(data.budget ? data.budget.toString() : "");
      if (data.requiredSkills) {
          const suggested = data.requiredSkills.split(",").map((s: string) => s.trim());
          setSelectedSkills(prev => Array.from(new Set([...prev, ...suggested])));
      }
      setAiModalVisible(false);
      setAiInput("");
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowAdvanced(true);
    } catch (e) { 
        Alert.alert("Error", "AI Assistant failed to draft the job."); 
    } finally { 
        setIsGenerating(false); 
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !budget) { 
        Alert.alert("Required", "Please fill in the basic info first."); 
        return; 
    }
    setLoading(true);
    try {
      const payload = {
        clientId: user?.userId, title, description, budget: Number(budget),
        isRemote, requiredSkills: selectedSkills.join(",")
      };
      await api.post("/Jobs", payload);
      navigation.goBack();
    } catch (e) { 
        Alert.alert("Error", "Failed to post job."); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} style={styles.headerGradient}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Post a Job</Text>
          <TouchableOpacity onPress={() => setAiModalVisible(true)} style={styles.aiCircleBtn}>
            <Ionicons name="sparkles" size={20} color="#60A5FA" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTextContent}>
            <Text style={styles.headerMainTitle}>Find Talent</Text>
            <Text style={styles.headerSubTitle}>Post your project and reach top professionals.</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>Primary Details</Text>
          </View>
          
          <Text style={styles.inputLabel}>Job Title</Text>
          <TextInput 
            style={styles.textInput} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="e.g. Senior Backend Engineer" 
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Project Budget ($)</Text>
          <TextInput 
            style={styles.textInput} 
            value={budget} 
            onChangeText={setBudget} 
            keyboardType="numeric" 
            placeholder="e.g. 3000" 
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput 
            style={[styles.textInput, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            multiline 
            placeholder="Describe your project goals..." 
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.cardSmall}>
           <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Ionicons name="globe-outline" size={20} color="#059669" />
              <Text style={styles.toggleLabel}>Remote Work Allowed</Text>
           </View>
           <Switch 
            value={isRemote} 
            onValueChange={setIsRemote} 
            trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
            thumbColor={isRemote ? "#2563EB" : "#F1F5F9"}
          />
        </View>

        <TouchableOpacity 
            style={styles.advancedToggleBtn} 
            onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowAdvanced(!showAdvanced);
            }}
        >
            <Text style={styles.advancedToggleText}>{showAdvanced ? "Hide Tech Stack" : "Add Tech Requirements"}</Text>
            <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
        </TouchableOpacity>

        {showAdvanced && (
            <View style={[styles.card, { marginTop: 0 }]}>
                {SKILL_GROUPS.map((group) => (
                    <View key={group.title} style={styles.skillGroup}>
                        <Text style={[styles.groupLabel, { color: group.color }]}>{group.title}</Text>
                        {/* ✅ FIXED: Changed div to View to prevent crash */}
                        <View style={styles.pillBox}>
                            {group.skills.map(skill => (
                                <AnimatedPill 
                                    key={skill} 
                                    item={skill} 
                                    color={group.color}
                                    isSelected={selectedSkills.includes(skill)} 
                                    onPress={() => toggleSkill(skill)} 
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        )}

        <TouchableOpacity style={styles.mainSubmitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirm and Post</Text>}
        </TouchableOpacity>
        
        <View style={{height: 100}} />
      </ScrollView>

      <Modal visible={aiModalVisible} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined} 
            style={styles.modalOverlay}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.aiCard, { marginTop: 40 }]}> 
                    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                        <View style={styles.aiModalHeader}>
                            <View style={styles.aiIconTitle}>
                                <Ionicons name="sparkles" size={22} color="#2563EB" />
                                <Text style={styles.aiModalTitle}>AI Posting Assistant</Text>
                            </View>
                            <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.aiModalSub}>
                            Briefly explain your project. AI will fill the form and categorize the skills.
                        </Text>

                        <TextInput
                            style={styles.aiModalInput}
                            multiline
                            autoFocus
                            placeholder="e.g. I need an expert to fix my website's checkout page, budget is $300."
                            placeholderTextColor="#94A3B8"
                            value={aiInput}
                            onChangeText={setAiInput}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity 
                            style={[styles.aiActionBtn, isGenerating && { opacity: 0.7 }]} 
                            onPress={handleAiGenerate} 
                            disabled={isGenerating}
                        >
                            {isGenerating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.aiActionText}>Draft Now</Text>}
                        </TouchableOpacity>
                        
                        <View style={{height: 20}} />
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerGradient: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  circleBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  aiCircleBtn: { width: 44, height: 44, backgroundColor: 'rgba(96, 165, 250, 0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.3)' },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  headerTextContent: { paddingHorizontal: 25, marginTop: 20 },
  headerMainTitle: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  headerSubTitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 15 },
  cardSmall: { backgroundColor: "#FFF", borderRadius: 20, padding: 18, marginBottom: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  inputLabel: { fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 8, marginLeft: 4 },
  textInput: { backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", padding: 14, marginBottom: 20, color: "#0F172A", fontSize: 15 },
  textArea: { height: 120, textAlignVertical: "top" },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginLeft: 10 },
  advancedToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 8 },
  advancedToggleText: { color: '#64748B', fontWeight: '700', fontSize: 14 },
  skillGroup: { marginBottom: 20 },
  groupLabel: { fontSize: 11, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  pillBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, borderWidth: 1.5, borderColor: "#F1F5F9", backgroundColor: "#F8FAFC" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  pillTextSelected: { color: "#FFF" },
  mainSubmitBtn: { backgroundColor: "#0F172A", padding: 20, borderRadius: 20, alignItems: "center", shadowColor: "#000", elevation: 5 },
  submitBtnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-start', padding: 20 },
  aiCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 25, maxHeight: '85%', shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  aiModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  aiIconTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiModalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  aiModalSub: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  aiModalInput: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, height: 160, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16, color: '#0F172A' },
  aiActionBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 25, shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  aiActionText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});