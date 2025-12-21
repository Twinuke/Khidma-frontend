import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../config/api";

const { height } = Dimensions.get("window");

interface MiniProfileSheetProps {
  visible: boolean;
  userId: number | null;
  onClose: () => void;
}

export const MiniProfileSheet = ({ visible, userId, onClose }: MiniProfileSheetProps) => {
  const navigation = useNavigation<any>();
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiProfile, setAiProfile] = useState<any>(null);

  // ✅ 1. PanResponder for Drag Gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture gesture if dragging vertically significantly
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging downwards (positive dy)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 100px or flicked down quickly, close it
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose(); // Parent 'visible' prop will trigger the useEffect exit animation
        } else {
          // Snap back to open position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && userId) {
      setUser(null);
      setAiProfile(null);
      setLoading(true);
      
      // Reset position to 0 (Open)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }).start();

      fetchData(userId);
    } else {
      // Slide down to close
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, userId]);

  const fetchData = async (id: number) => {
    try {
      const [userRes, aiRes] = await Promise.all([
        api.get(`/Users/profile/${id}`).catch(() => null),
        api.get(`/Onboarding/${id}`).catch(() => null),
      ]);

      if (userRes?.data?.user) {
        setUser(userRes.data.user);
      }
      if (aiRes?.data) {
        setAiProfile(aiRes.data);
      }
    } catch (e) {
      console.log("Mini Profile Error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    onClose();
    navigation.navigate('UserProfile', { userId });
  };

  const Tag = ({ text, color }: { text: string; color: string }) => (
    <View style={[styles.tag, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent onRequestClose={onClose} animationType="none">
      <View style={styles.backdropContainer}>
        {/* Tap background to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* ✅ 2. Attach PanResponder Handlers to Animated.View */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle Bar Indicator */}
          <View style={styles.handleContainer}>
             <View style={styles.handle} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : user ? (
            <>
              <View style={styles.header}>
                <Image
                  source={{
                    uri: user.profileImageUrl || "https://via.placeholder.com/150",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.headerInfo}>
                  <Text style={styles.name}>{user.fullName}</Text>
                  <Text style={styles.jobTitle}>
                    {user.userType === 1 ? "Client" : (user.jobTitle || "Freelancer")}
                  </Text>
                  
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}> 4.9 • {user.city || "Remote"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {aiProfile && (
                <View style={styles.tagsSection}>
                  <Text style={styles.sectionLabel}>Top Skills</Text>
                  <View style={styles.tagsWrapper}>
                    {aiProfile.selectedDomains?.split(",").slice(0, 3).map((t: string, i: number) => (
                      <Tag key={i} text={t} color="#0F172A" />
                    ))}
                    {aiProfile.selectedSkills?.split(",").slice(0, 3).map((t: string, i: number) => (
                      <Tag key={i + 10} text={t} color="#2563EB" />
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.fullProfileBtn} onPress={handleViewFullProfile}>
                <Text style={styles.fullProfileText}>View Full Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.loadingContainer}>
                <Text style={{color: '#64748B'}}>User not found</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 300,
    // Add shadow to make it look like a sheet
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  handleContainer: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: 15,
      // Larger hit slop for dragging from top
      paddingBottom: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
  },
  loadingContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9' },
  headerInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  jobTitle: { fontSize: 14, color: '#64748B', marginVertical: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },

  tagsSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 10 },
  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },

  fullProfileBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  fullProfileText: { color: 'white', fontWeight: '700', fontSize: 16, marginRight: 8 }
});