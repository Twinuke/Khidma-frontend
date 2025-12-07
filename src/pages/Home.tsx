import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  Animated, PanResponder, Dimensions, StatusBar, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import api from '../config/api';
import { RootStackParamList } from '../../App';

const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 90;
const HEADER_MAX_HEIGHT = 280;
const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;
const FAB_SIZE = 56;

const COLORS = {
  bg: '#F1F5F9',
  primary: '#2563EB',
  dark: '#0F172A',
  white: '#FFFFFF',
  secondaryText: '#94A3B8',
  success: '#10B981',
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout, refreshUser } = useUser();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const headerHeight = useRef(new Animated.Value(HEADER_MIN_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      fetchActivity();
    }, [user?.userId])
  );

  const fetchActivity = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/Notifications/user/${user.userId}`);
      setRecentActivity(response.data.slice(0, 3));
    } catch (e) { console.log(e); }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        let newHeight = (isExpanded ? HEADER_MAX_HEIGHT : HEADER_MIN_HEIGHT) + gestureState.dy;
        if (newHeight < HEADER_MIN_HEIGHT) newHeight = HEADER_MIN_HEIGHT;
        if (newHeight > HEADER_MAX_HEIGHT + 30) newHeight = HEADER_MAX_HEIGHT + 30;
        headerHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || (isExpanded && gestureState.dy > -50)) {
          Animated.spring(headerHeight, { toValue: HEADER_MAX_HEIGHT, useNativeDriver: false }).start();
          setIsExpanded(true);
        } else {
          Animated.spring(headerHeight, { toValue: HEADER_MIN_HEIGHT, useNativeDriver: false }).start();
          setIsExpanded(false);
        }
      },
    })
  ).current;

  const detailsOpacity = headerHeight.interpolate({
    inputRange: [HEADER_MIN_HEIGHT, HEADER_MAX_HEIGHT - 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleJobsPress = () => {
    if (user?.userType === 1) {
      navigation.navigate('ClientMyJobs');
    } else {
      navigation.navigate('Jobs');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]} {...panResponder.panHandlers}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.headerGradient}>
          <View style={styles.compactRow}>
            {/* Clickable Avatar to Profile */}
            <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.avatarContainer}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.headerAvatarImage} />
                ) : (
                  <Ionicons name="person" size={20} color="#FFF" />
                )}
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={styles.greetingText}>Hello, {user?.fullName?.split(' ')[0]}</Text>
                <Text style={styles.statusText}><Ionicons name="location-outline" size={10} /> {user?.city || 'No Location'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#FFF" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.expandedContent, { opacity: detailsOpacity }]}>
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statLabel}>Success</Text><Text style={styles.statValue}>98%</Text></View>
              <View style={styles.verticalLine} />
              <View style={styles.statItem}><Text style={styles.statLabel}>Balance</Text><Text style={styles.statValue}>${user?.balance?.toFixed(2)}</Text></View>
              <View style={styles.verticalLine} />
              <View style={styles.statItem}><Text style={styles.statLabel}>Rating</Text><Text style={styles.statValue}>4.9 ★</Text></View>
            </View>
            
            {/* ✅ HERE IT IS: Edit Profile in Header */}
            <TouchableOpacity style={styles.expButton} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle-outline" size={20} color="#FFF" />
              <Text style={styles.expButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.expButton, styles.logoutBtn]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.dragHandle}><Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.3)" /></View>
        </LinearGradient>
      </Animated.View>

      {/* CONTENT */}
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MIN_HEIGHT + 20 }]}>
        
        {/* Overview Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={handleJobsPress}>
            <View style={[styles.gridIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name={user?.userType === 1 ? "briefcase" : "search"} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>{user?.userType === 1 ? 'My Jobs' : 'Find Jobs'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SocialPage')}>
            <View style={[styles.gridIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="people" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.gridLabel}>Community</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.gridIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={22} color="#D97706" />
            </View>
            <Text style={styles.gridLabel}>Chat</Text>
          </TouchableOpacity>

          {/* ✅ REPLACED "Profile" with "Bids" (or Settings) to remove duplicate */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Bids' as any)}>
            <View style={[styles.gridIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="document-text" size={22} color="#9333EA" />
            </View>
            <Text style={styles.gridLabel}>Bids</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Feed */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        {recentActivity.map((item) => (
          <View key={item.notificationId} style={styles.activityItem}>
            <Ionicons name="notifications" size={18} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.actTitle}>{item.title}</Text>
              <Text style={styles.actDate}>{item.message}</Text>
            </View>
          </View>
        ))}
        <View style={{height: 100}}/>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomIcons}>
          <TouchableOpacity onPress={() => {}}><Ionicons name="home" size={24} color={COLORS.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={handleJobsPress}><Ionicons name="list" size={24} color="#94A3B8" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SocialPage')}><Ionicons name="people" size={24} color="#94A3B8" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Messages')}><Ionicons name="chatbubble-ellipses" size={24} color="#94A3B8" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}><Ionicons name="person" size={24} color="#94A3B8" /></TouchableOpacity>
        </View>
      </View>

      {/* FAB (Client Only) */}
      {user?.userType === 1 && (
        <TouchableOpacity style={styles.floatingFab} onPress={() => navigation.navigate('CreateJob')}>
          <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.fabGradient}>
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, elevation: 10 },
  headerGradient: { flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingHorizontal: 20 },
  compactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerAvatarImage: { width: '100%', height: '100%', borderRadius: 20 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, borderWidth: 1.5, borderColor: '#1E293B' },
  greetingText: { color: '#FFF', fontWeight: 'bold' },
  statusText: { color: COLORS.secondaryText, fontSize: 11 },
  headerIcons: { flexDirection: 'row' },
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18 },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: 'red', borderRadius: 4 },
  expandedContent: { marginTop: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#94A3B8', fontSize: 10 },
  statValue: { color: '#FFF', fontWeight: 'bold' },
  verticalLine: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  expandedActions: { alignItems: 'center' },
  expButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 5 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  expButtonText: { color: '#FFF', marginLeft: 5 },
  logoutText: { color: '#FCA5A5' },
  dragHandleContainer: { alignItems: 'center', paddingBottom: 5 },
  dragHandle: {  alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, height: 24  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  balanceCard: { borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: '#BFDBFE', fontSize: 12 },
  balanceAmount: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  withdrawBtn: { backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  withdrawText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12, marginRight: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { width: '23%', alignItems: 'center' },
  gridIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  gridLabel: { fontSize: 11, color: '#475569', fontWeight: '500' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { color: COLORS.primary },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10 },
  actTitle: { fontWeight: 'bold', color: COLORS.dark },
  actDate: { color: '#94A3B8', fontSize: 12 },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: BOTTOM_BAR_HEIGHT, backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'center', elevation: 20 },
  bottomIcons: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', paddingTop: 15 },
  navItem: { padding: 5 },
  floatingFab: { position: 'absolute', bottom: 100, right: 20, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
});