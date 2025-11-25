import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Only the routes that don't take params
type BottomNavScreen = 'Home' | 'Jobs' | 'Messages' | 'Settings';

type BottomNavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: BottomNavScreen;
};

const BOTTOM_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 70;
const FAB_SIZE = 52;

// Top sheet travel distance (collapsed at top, then slides a bit down)
const SHEET_COLLAPSED_Y = 0;
const SHEET_EXPANDED_Y = 160;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleLogout = () => {
    navigation.replace('Login');
  };

  const goToCreateJob = () => {
    navigation.navigate('CreateJob');
  };

  const bottomNavItems: BottomNavItem[] = [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Jobs', icon: 'briefcase-outline', screen: 'Jobs' },
    { label: 'Messages', icon: 'chatbubble-ellipses-outline', screen: 'Messages' },
    { label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
  ];

  // Draggable top header sheet
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_COLLAPSED_Y)).current;
  const sheetOffset = useRef(SHEET_COLLAPSED_Y);

  const animateSheet = (toValue: number) => {
    Animated.spring(sheetTranslateY, {
      toValue,
      useNativeDriver: false, // we animate height inside
      friction: 9,
      tension: 50,
    }).start();
    sheetOffset.current = toValue;
    setSheetExpanded(toValue === SHEET_EXPANDED_Y);
  };

  const toggleSheet = () => {
    animateSheet(sheetExpanded ? SHEET_COLLAPSED_Y : SHEET_EXPANDED_Y);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderMove: (_, gesture) => {
        const next = sheetOffset.current + gesture.dy;
        const clamped = Math.min(
          Math.max(next, SHEET_COLLAPSED_Y),
          SHEET_EXPANDED_Y,
        );
        sheetTranslateY.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        const current = sheetOffset.current + gesture.dy;
        const halfway = (SHEET_EXPANDED_Y - SHEET_COLLAPSED_Y) / 2;

        const shouldExpand =
          (gesture.vy > 0 && current > SHEET_COLLAPSED_Y) ||
          current - SHEET_COLLAPSED_Y > halfway;

        animateSheet(shouldExpand ? SHEET_EXPANDED_Y : SHEET_COLLAPSED_Y);
      },
    }),
  ).current;

  const sheetDetailsOpacity = sheetTranslateY.interpolate({
    inputRange: [SHEET_COLLAPSED_Y, SHEET_EXPANDED_Y],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const sheetDetailsHeight = sheetTranslateY.interpolate({
    inputRange: [SHEET_COLLAPSED_Y, SHEET_EXPANDED_Y],
    outputRange: [0, 130],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Draggable PROFILE HEADER SHEET – small top header that slides down */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={['#0B2447', '#19376D']}
            style={styles.sheetGradient}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={toggleSheet}>
              {/* handle bar */}
              <View style={styles.sheetHandle} />

              {/* collapsed header row */}
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetAvatar}>
                  <Ionicons name="person-outline" size={24} color="#E0ECFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>Your Name</Text>
                  <Text style={styles.sheetMeta}>Freelancer • Available</Text>
                </View>
                <Ionicons
                  name={sheetExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#E5E7EB"
                />
              </View>

              {/* expanded info (visible when dragged down) */}
              <Animated.View
                style={[
                  styles.sheetDetails,
                  {
                    opacity: sheetDetailsOpacity,
                    height: sheetDetailsHeight,
                  },
                ]}
              >
                <Text style={styles.sheetDescription}>
                  Short bio about the freelancer, main skills and location.
                </Text>

                <View style={styles.sheetInfoRow}>
                  <Ionicons name="call-outline" size={16} color="#C7D2FE" />
                  <Text style={styles.sheetInfoText}>+961 70 000 000</Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <Ionicons name="location-outline" size={16} color="#C7D2FE" />
                  <Text style={styles.sheetInfoText}>Beirut, Lebanon</Text>
                </View>

                {/* Logout inside expanded sheet */}
                <TouchableOpacity
                  style={styles.sheetLogoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={16} color="#B91C1C" />
                  <Text style={styles.sheetLogoutText}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* MAIN CONTENT (no scrolling) */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // page not scrollable
        >
          {/* TOP SEARCH / ACTION STRIP (fills gap between header and balance) */}
          <View style={styles.topSearchRow}>
            <TouchableOpacity
              style={styles.topAvatarCircle}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={20} color="#E5E7EB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchPill}
              onPress={() => navigation.navigate('Search' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="search-outline" size={18} color="#E5E7EB" />
              <Text style={styles.searchText}>Search jobs, clients...</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topIconCircle}
              onPress={() => navigation.navigate('Bids' as any)}
            >
              <Ionicons name="ribbon-outline" size={18} color="#E5E7EB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topIconCircle}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="qr-code-outline" size={18} color="#E5E7EB" />
            </TouchableOpacity>
          </View>

          {/* BALANCE CARD */}
          <View style={styles.balanceWrapper}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Freelancer Balance</Text>
              <Text style={styles.balanceAmount}>$ 1,250.00</Text>
              <Text style={styles.balanceSub}>
                Total earnings available to withdraw
              </Text>

              <View style={styles.balanceActionsRow}>
                <TouchableOpacity
                  style={styles.balanceAction}
                  onPress={() => navigation.navigate('Payouts' as any)}
                >
                  <Ionicons name="card-outline" size={16} color="#EFF6FF" />
                  <Text style={styles.balanceActionText}>Withdraw</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.balanceAction}
                  onPress={() => navigation.navigate('Earnings' as any)}
                >
                  <Ionicons name="bar-chart-outline" size={16} color="#EFF6FF" />
                  <Text style={styles.balanceActionText}>View details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* QUICK ACTION ICONS (core actions) */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Jobs')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="search-outline" size={20} color="#F9FAFB" />
              </View>
              <Text style={styles.quickActionText}>Browse Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CreateJob')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add-circle-outline" size={20} color="#F9FAFB" />
              </View>
              <Text style={styles.quickActionText}>Post a Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="briefcase-outline" size={20} color="#F9FAFB" />
              </View>
              <Text style={styles.quickActionText}>My Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Messages')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F9FAFB" />
              </View>
              <Text style={styles.quickActionText}>Messages</Text>
            </TouchableOpacity>
          </View>

          {/* RECENT ACTIVITY (replaces Navigation) */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recent Activity</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Activity' as any)}
              >
                <Text style={styles.recentViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            {/* Card 1 */}
            <TouchableOpacity
              style={styles.activityItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Jobs')}
            >
              <View style={styles.activityIconCircle}>
                <Ionicons name="hammer-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>Logo Design Project</Text>
                <Text style={styles.activitySubtitle}>Bid placed • 5 min ago</Text>
              </View>
              <Text style={styles.activityAmount}>$120</Text>
            </TouchableOpacity>

            {/* Card 2 */}
            <TouchableOpacity
              style={styles.activityItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyJobs')}
            >
              <View style={styles.activityIconCircle}>
                <Ionicons name="code-slash-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>React Native Fixes</Text>
                <Text style={styles.activitySubtitle}>Job created • 1h ago</Text>
              </View>
              <Text style={styles.activityAmount}>$250</Text>
            </TouchableOpacity>

            {/* Card 3 */}
            <TouchableOpacity
              style={styles.activityItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Messages')}
            >
              <View style={styles.activityIconCircle}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#2563EB"
                />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>New message</Text>
                <Text style={styles.activitySubtitle}>From: John Doe</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* BOTTOM BAR WITH FAB INSIDE ON THE LEFT */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.fabInBar}
            onPress={goToCreateJob}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.bottomNavItemsWrapper}>
            {bottomNavItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.bottomItem}
                onPress={() => navigation.navigate(item.screen)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.label === 'Home' ? '#2563EB' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.bottomLabel,
                    item.label === 'Home' && styles.bottomLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // status bar area
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 130, // slightly tighter, reduces white space
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_BAR_HEIGHT + 16,
  },

  /* TOP SEARCH STRIP */
  topSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  topAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchText: {
    marginLeft: 8,
    color: '#E5E7EB',
    fontSize: 13,
  },
  topIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  /* BALANCE CARD */
  balanceWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceCard: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#2563EB',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#DBEAFE',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  balanceSub: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 6,
  },
  balanceActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  balanceActionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#EFF6FF',
    fontWeight: '500',
  },

  /* QUICK ACTION ICONS */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* RECENT ACTIVITY */
  recentSection: {
    marginTop: 4,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  recentViewAll: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  /* DRAGGABLE TOP SHEET */
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
  },
  sheetGradient: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#4B5563',
    marginBottom: 6,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  sheetMeta: {
    fontSize: 13,
    color: '#C7D2FE',
    marginTop: 2,
  },
  sheetDetails: {
    marginTop: 8,
    overflow: 'hidden',
  },
  sheetDescription: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 6,
  },
  sheetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetInfoText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#E5E7EB',
  },
  sheetLogoutButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  sheetLogoutText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },

  /* BOTTOM BAR + FAB INSIDE */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -1 },
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  fabInBar: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bottomNavItemsWrapper: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#6B7280',
  },
  bottomLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
