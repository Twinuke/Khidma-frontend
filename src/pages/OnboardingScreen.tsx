import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width, height } = Dimensions.get("window");

// --- 🧠 EXPANDED DATASET (More Options) ---
const DOMAINS = [
  "Software Dev", "Mobile Apps", "Web Dev", "Game Dev", "UI/UX Design", 
  "Graphic Design", "Logo Design", "Video Editing", "3D Animation", 
  "Copywriting", "Marketing", "SEO", "Data Science", "Cybersecurity",
  "Virtual Assistant", "Finance", "Translation", "Consulting",
  "Photography", "Music & Audio", "Legal Services", "HR & Recruiting"
];

const SKILL_MAP: Record<string, string[]> = {
  "Software Dev": ["Backend", "Frontend", "Full-Stack", "DevOps", "Cybersecurity", "Blockchain", "QA Testing", "Embedded Systems", "System Arch"],
  "Mobile Apps": ["iOS", "Android", "React Native", "Flutter", "Swift", "Kotlin", "App Store Optimization", "Objective-C"],
  "Web Dev": ["React", "Vue", "Angular", "HTML/CSS", "Next.js", "WordPress", "Shopify", "Webflow", "Magento", "Node.js"],
  "Game Dev": ["Unity", "Unreal Engine", "C#", "C++", "3D Modeling", "Level Design", "Game Physics"],
  "UI/UX Design": ["User Research", "Wireframing", "Prototyping", "Figma", "Adobe XD", "Interaction Design", "Design Systems", "Usability Testing"],
  "Graphic Design": ["Photoshop", "Illustrator", "Branding", "Print Design", "Packaging", "Typography", "Infographics", "Vector Art"],
  "Video Editing": ["Premiere Pro", "After Effects", "Color Grading", "Sound Design", "YouTube Editing", "Motion Graphics", "VFX"],
  "Marketing": ["Social Media", "PPC", "Email Marketing", "Google Ads", "Content Strategy", "Influencer Marketing", "Affiliate Marketing", "SEO"],
  "Virtual Assistant": ["Data Entry", "Scheduling", "Customer Support", "Research", "Email Management", "Travel Planning", "CRM Mgmt"],
  "Finance": ["Bookkeeping", "Tax Prep", "Financial Modeling", "QuickBooks", "Excel", "Payroll", "Forecasting", "Crypto"],
  "default": ["Project Mgmt", "Communication", "Leadership", "Agile", "Problem Solving", "Time Management", "Remote Work"]
};

const TOOLS = [
  // Dev
  "React", "React Native", "Expo", "Node.js", ".NET", "Python", "Docker", "AWS", "Firebase", "Git", "Java", "C#", "PHP", "Go", "Rust",
  // Design & Creative
  "Figma", "Photoshop", "Illustrator", "Blender", "Canva", "InDesign", "Premiere Pro", "After Effects", "Lightroom", "Sketch",
  // Business & Productivity
  "Jira", "Slack", "Trello", "Notion", "Asana", "Zoom", "Microsoft Office", "Google Workspace", "Salesforce", "HubSpot",
  // Specialized
  "QuickBooks", "Tableau", "Google Analytics", "WordPress", "Shopify", "XCode", "Android Studio"
];

const BEHAVIOR = [
  "Short Gigs", "Long-term Projects", "Fixed Price", "Hourly Rate", 
  "Tight Deadlines", "Flexible Schedule", "Startup Environment", "Corporate Structure",
  "Team Player", "Solo Worker", "Remote Only", "Hybrid Ready", "Weekend Work", "Rush Jobs"
];

const CONFIDENCE = [
  { label: "Beginner", desc: "Learning the ropes", icon: "🌱" },
  { label: "Intermediate", desc: "Solid daily experience", icon: "⚡" },
  { label: "Expert", desc: "Deep technical mastery", icon: "🔥" },
  { label: "Agency / Pro", desc: "Top-tier delivery", icon: "💎" }
];

// --- ✨ ANIMATED PILL COMPONENT ---
const AnimatedPill = ({ item, isSelected, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0, 
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.pill,
          isSelected && styles.pillSelected,
          { transform: [{ scale: scaleAnim }] } 
        ]}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {item}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedBehavior, setSelectedBehavior] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<string>("");

  // UI States
  const [errorMsg, setErrorMsg] = useState("");
  const errorFade = useRef(new Animated.Value(0)).current;
  
  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;

  // Page Transition Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20); 

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.poly(4)),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.poly(4)),
      })
    ]).start();
  }, [step]);

  // --- 🔒 SELECTION LIMIT LOGIC ---
  const toggleSelection = (item: string, list: string[], setList: any) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
      setErrorMsg(""); 
    } else {
      if (list.length >= 3) {
        showError("You can only select up to 3 options.");
        return;
      }
      setList([...list, item]);
      setErrorMsg("");
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    errorFade.setValue(0);
    Animated.timing(errorFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(errorFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setErrorMsg(""));
    }, 2000);
  };

  const getRelevantSkills = () => {
    let skills: string[] = [];
    selectedDomains.forEach(d => {
      if (SKILL_MAP[d]) skills = [...skills, ...SKILL_MAP[d]];
    });
    if (skills.length === 0) return SKILL_MAP["default"];
    return Array.from(new Set(skills)); 
  };

  const handleFinish = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const payload = {
        userId: user.userId,
        domains: selectedDomains,
        skills: selectedSkills,
        tools: selectedTools,
        behavior: selectedBehavior,
        confidence,
      };
      await api.post("/Onboarding", payload);
      
      // ✅ TRIGGER SUCCESS POPUP
      setShowSuccess(true);
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 10,
        speed: 15
      }).start();
      
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <View key="step0">
            <Text style={styles.title}>Primary Focus</Text>
            <Text style={styles.subtitle}>Select the industries you specialize in.</Text>
            {errorMsg ? <Animated.Text style={[styles.errorText, { opacity: errorFade }]}>{errorMsg}</Animated.Text> : <View style={{height: 20}} />}
            <View style={styles.pillContainer}>
              {DOMAINS.map((item) => (
                <AnimatedPill
                  key={item} item={item}
                  isSelected={selectedDomains.includes(item)}
                  onPress={() => toggleSelection(item, selectedDomains, setSelectedDomains)}
                />
              ))}
            </View>
          </View>
        );
      case 1:
        const skills = getRelevantSkills();
        return (
          <View key="step1">
            <Text style={styles.title}>Core Competencies</Text>
            <Text style={styles.subtitle}>What specifically can you do?</Text>
            {errorMsg ? <Animated.Text style={[styles.errorText, { opacity: errorFade }]}>{errorMsg}</Animated.Text> : <View style={{height: 20}} />}
            <View style={styles.pillContainer}>
              {skills.map((item) => (
                <AnimatedPill
                  key={item} item={item}
                  isSelected={selectedSkills.includes(item)}
                  onPress={() => toggleSelection(item, selectedSkills, setSelectedSkills)}
                />
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View key="step2">
            <Text style={styles.title}>Tech Stack</Text>
            <Text style={styles.subtitle}>Which tools do you use daily?</Text>
            {errorMsg ? <Animated.Text style={[styles.errorText, { opacity: errorFade }]}>{errorMsg}</Animated.Text> : <View style={{height: 20}} />}
            <View style={styles.pillContainer}>
              {TOOLS.map((item) => (
                <AnimatedPill
                  key={item} item={item}
                  isSelected={selectedTools.includes(item)}
                  onPress={() => toggleSelection(item, selectedTools, setSelectedTools)}
                />
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View key="step3">
            <Text style={styles.title}>Work Preferences</Text>
            <Text style={styles.subtitle}>How do you like to work?</Text>
            {errorMsg ? <Animated.Text style={[styles.errorText, { opacity: errorFade }]}>{errorMsg}</Animated.Text> : <View style={{height: 20}} />}
            <View style={styles.pillContainer}>
              {BEHAVIOR.map((item) => (
                <AnimatedPill
                  key={item} item={item}
                  isSelected={selectedBehavior.includes(item)}
                  onPress={() => toggleSelection(item, selectedBehavior, setSelectedBehavior)}
                />
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View key="step4">
            <Text style={styles.title}>Experience Level</Text>
            <Text style={styles.subtitle}>This helps us calibrate job difficulty.</Text>
            <View style={{ gap: 14, marginTop: 20 }}>
              {CONFIDENCE.map((c) => {
                const isSelected = confidence === c.label;
                return (
                  <TouchableOpacity
                    key={c.label}
                    activeOpacity={0.8}
                    style={[styles.card, isSelected && styles.cardSelected]}
                    onPress={() => setConfidence(c.label)}
                  >
                    <View style={[styles.cardIconBox, isSelected && styles.cardIconBoxSelected]}>
                      <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTextSelected]}>{c.label}</Text>
                      <Text style={[styles.cardDesc, isSelected && styles.cardTextSelected]}>{c.desc}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          disabled={step === 0} 
          onPress={() => setStep(step - 1)}
        >
          {step > 0 ? <Ionicons name="chevron-back" size={28} color="#0F172A" /> : <View />}
        </TouchableOpacity>
        
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>Step {step + 1} of 5</Text>
        </View>
        
        <View style={{width: 40}} /> 
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} />
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {renderContent()}
        </Animated.View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => {
            if (step < 4) setStep(step + 1);
            else handleFinish();
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === 4 ? "Complete Profile" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 🎉 SUCCESS MODAL 🎉 */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="white" />
                </View>
                <Text style={styles.successTitle}>You're all set to go!</Text>
                <Text style={styles.successSub}>Your AI profile is ready to find jobs.</Text>
                
                <TouchableOpacity 
                    style={styles.successBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.replace("MainTabs")}
                >
                    <Text style={styles.successBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
            </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  stepContainer: { backgroundColor: "#E2E8F0", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  stepText: { fontSize: 12, fontWeight: "600", color: "#64748B" },

  progressBg: { height: 4, backgroundColor: "#E2E8F0", marginHorizontal: 0 },
  progressFill: { height: "100%", backgroundColor: "#0F172A" },

  content: { padding: 24, paddingBottom: 100 },
  
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748B", marginBottom: 10, lineHeight: 22 },

  errorText: { color: "#EF4444", fontSize: 13, fontWeight: "600", marginBottom: 16 },

  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  pill: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#64748B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  pillSelected: {
    backgroundColor: "#0F172A", borderColor: "#0F172A", shadowColor: "#0F172A", shadowOpacity: 0.2
  },
  pillText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  pillTextSelected: { color: "#FFFFFF" },

  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  cardSelected: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  cardIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cardIconBoxSelected: { backgroundColor: 'rgba(255,255,255,0.1)' },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  cardTextSelected: { color: "white" },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  nextBtn: { backgroundColor: "#0F172A", paddingVertical: 16, borderRadius: 12, alignItems: "center", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  nextBtnText: { color: "white", fontSize: 16, fontWeight: "700" },

  // --- SUCCESS MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: {
    backgroundColor: 'white', width: '100%', borderRadius: 24, padding: 32, alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#10B981", alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F172A',
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', justifyContent: 'center'
  },
  successBtnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});