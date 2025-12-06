import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import api from '../config/api';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

// --- CONSTANTS (Fixed) ---
const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 90;
const HEADER_MAX_HEIGHT = 280;
const FAB_SIZE = 56;

const COLORS = {
  bg: '#F1F5F9',
  primary: '#2563EB',
  dark: '#0F172A',
  white: '#FFFFFF',
  secondaryText: '#94A3B8',
  success: '#10B981', // ✅ Added missing color
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
    } catch (e) {
      console.log('Error fetching activity', e);
    }
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

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- DRAGGABLE HEADER --- */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]} {...panResponder.panHandlers}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.headerGradient}>
          {/* 1. COMPACT ROW */}
          <View style={styles.compactRow}>
            <View style={styles.userInfo}>
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
                <Text style={styles.statusText}>
                  <Ionicons name="location-outline" size={10} color={COLORS.secondaryText} /> 
                  {' '}{user?.city || 'Location not set'}
                </Text>
              </View>
            </View>

            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={20} color="#FFF" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. EXPANDED DETAILS */}
          <Animated.View style={[styles.expandedContent, { opacity: detailsOpacity }]}>
            <View style={styles.divider} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Success Rate</Text>
                <Text style={styles.statValue}>98%</Text>
              </View>
              <View style={styles.verticalLine} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Earned</Text>
                <Text style={styles.statValue}>${user?.balance?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.verticalLine} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.statValue}>4.9</Text>
                  <Ionicons name="star" size={12} color="#FBBF24" style={{ marginLeft: 2 }} />
                </View>
              </View>
            </View>

            <View style={styles.expandedActions}>
              <TouchableOpacity style={styles.expButton} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-circle-outline" size={20} color="#FFF" />
                <Text style={styles.expButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.expButton, styles.logoutBtn]} onPress={() => { logout(); navigation.replace('Login'); }}>
                <Ionicons name="log-out-outline" size={20} color="#FCA5A5" />
                <Text style={[styles.expButtonText, { color: '#FCA5A5' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* 3. DRAG HANDLE */}
          <View style={styles.dragHandleContainer}>
            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* --- SCROLL CONTENT --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MIN_HEIGHT + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* BALANCE CARD */}
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>$ {user?.balance?.toFixed(2) || '0.00'}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawText}>Withdraw</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* OVERVIEW GRID */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Jobs')}>
            <View style={[styles.gridIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="briefcase" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>Jobs</Text>
          </TouchableOpacity>

          {/* Only show Post Job if Client (UserType 1) */}
          {user?.userType === 1 && (
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateJob')}>
              <View style={[styles.gridIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="add-circle" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.gridLabel}>Post</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Messages')}>
            <View style={[styles.gridIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="chatbubbles" size={22} color="#D97706" />
            </View>
            <Text style={styles.gridLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Bids' as any)}>
            <View style={[styles.gridIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="document-text" size={22} color="#9333EA" />
            </View>
            <Text style={styles.gridLabel}>Bids</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentActivity.length > 0 ? (
          recentActivity.map((item) => (
            <View key={item.notificationId} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={item.type === 2 ? "checkmark-circle" : "notifications"} 
                  size={18} 
                  color={item.type === 2 ? "#10B981" : COLORS.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.actDate} numberOfLines={1}>{item.message}</Text>
              </View>
              <Text style={styles.actTime}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
          ))
        ) : (
          <Text style={{color: '#94A3B8', textAlign: 'center', marginVertical: 10}}>No recent activity</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- BOTTOM BAR --- */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomIcons}>
          <TouchableOpacity style={styles.navItem}><Ionicons name="home" size={24} color={COLORS.primary} /></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Jobs')}><Ionicons name="search" size={24} color="#94A3B8" /></TouchableOpacity>
          <View style={{ width: FAB_SIZE }} />
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}><Ionicons name="chatbubble-ellipses" size={24} color="#94A3B8" /></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Ionicons name="person" size={24} color="#94A3B8" /></TouchableOpacity>
        </View>

        {/* Hide FAB for Freelancer */}
        {user?.userType === 1 && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateJob')}>
            <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.fabGradient}>
              <Ionicons name="add" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.bg },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  headerGradient: { flex: 1, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: Platform.OS === 'android' ? 40 : 50, paddingHorizontal: 20, overflow: 'hidden' },
  compactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10, overflow: 'hidden' },
  headerAvatarImage: { width: '100%', height: '100%' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, borderWidth: 1.5, borderColor: '#1E293B' },
  greetingText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  statusText: { color: COLORS.secondaryText, fontSize: 11 },
  headerIcons: { flexDirection: 'row' },
  iconButton: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, backgroundColor: '#EF4444', borderRadius: 3.5 },
  expandedContent: { marginTop: 8, flex: 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 16, marginBottom: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  verticalLine: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  statLabel: { color: '#94A3B8', fontSize: 10, marginBottom: 2 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  expandedActions: { flexDirection: 'row', justifyContent: 'space-between' },
  expButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30, flex: 0.48, justifyContent: 'center' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  expButtonText: { color: '#FFF', marginLeft: 6, fontWeight: '600', fontSize: 13 },
  dragHandleContainer: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, height: 24 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  balanceCard: { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  balanceLabel: { color: '#BFDBFE', fontSize: 12, marginBottom: 4 },
  balanceAmount: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  withdrawBtn: { backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  withdrawText: { color: COLORS.primary, fontWeight: '700', fontSize: 12, marginRight: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  gridItem: { alignItems: 'center', width: width / 4.5 },
  gridIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  gridLabel: { color: '#475569', fontSize: 11, fontWeight: '500' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  actTitle: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  actDate: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  actTime: { fontSize: 11, color: '#94A3B8' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BAR_HEIGHT, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 20, flexDirection: 'row', justifyContent: 'center' },
  bottomIcons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 14 },
  navItem: { padding: 8 },
  fab: { position: 'absolute', top: -24, alignSelf: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
  fabGradient: { width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F1F5F9' },
});