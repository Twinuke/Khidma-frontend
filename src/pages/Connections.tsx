import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from "../../components/ScreenWrapper"; // Optional if you use this wrapper

export default function Connections() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS'>('FRIENDS');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingChat, setProcessingChat] = useState<number | null>(null); // To show spinner on specific chat button

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'FRIENDS') {
        //
        const res = await api.get(`/Social/connections/${user?.userId}`);
        setData(res.data);
      } else {
        const res = await api.get(`/Social/requests/${user?.userId}`);
        setData(res.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (connectionId: number, status: 'Accepted' | 'Rejected') => {
    try {
      await api.put(`/Social/connection/${connectionId}`, { status });
      Alert.alert("Success", `Request ${status.toLowerCase()}.`);
      fetchData(); 
    } catch (e) {
      Alert.alert("Error", "Action failed.");
    }
  };

  // ✅ NEW: Correctly Open Chat
  const handleChat = async (friend: any) => {
    if (!friend || !user) return;
    
    setProcessingChat(friend.userId); // Show loading on the button
    try {
      // 1. Call API to get/create conversation ID
      const res = await api.post('/Chat/open', {
        user1Id: user.userId,
        user2Id: friend.userId,
        jobId: null // It's a direct chat, no specific job linked
      });

      // 2. Navigate with the valid conversationId
      navigation.navigate('ChatScreen', { 
        conversationId: res.data.conversationId, 
        otherUser: friend 
      });
    } catch (e) {
      console.log("Chat Error:", e);
      Alert.alert("Error", "Could not open chat.");
    } finally {
      setProcessingChat(null);
    }
  };

  const renderFriend = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image 
          source={{ uri: item.friend?.profileImageUrl || 'https://via.placeholder.com/50' }} 
          style={styles.avatar} 
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.friend?.fullName || 'User'}</Text>
          <Text style={styles.subText}>Connected since {new Date(item.since).toLocaleDateString()}</Text>
        </View>
        
        {/* ✅ Updated Chat Button */}
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={() => handleChat(item.friend)}
          disabled={processingChat === item.friend?.userId}
        >
          {processingChat === item.friend?.userId ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="chatbubble-ellipses" size={24} color="#2563EB" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequest = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image 
          source={{ uri: item.requester?.profileImageUrl || 'https://via.placeholder.com/50' }} 
          style={styles.avatar} 
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.requester?.fullName || 'User'}</Text>
          <Text style={styles.subText}>Wants to connect with you</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => respondToRequest(item.connectionId, 'Rejected')}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, styles.acceptBtn]} 
          onPress={() => respondToRequest(item.connectionId, 'Accepted')}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={{width: 32}} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'FRIENDS' && styles.activeTab]} 
          onPress={() => setActiveTab('FRIENDS')}
        >
          <Text style={[styles.tabText, activeTab === 'FRIENDS' && styles.activeTabText]}>My Network</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'REQUESTS' && styles.activeTab]} 
          onPress={() => setActiveTab('REQUESTS')}
        >
          <Text style={[styles.tabText, activeTab === 'REQUESTS' && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.connectionId.toString()}
          renderItem={activeTab === 'FRIENDS' ? renderFriend : renderRequest}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeTab === 'FRIENDS' ? 'No connections yet.' : 'No pending requests.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#FFF' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: 'transparent' },
  activeTab: { borderColor: '#2563EB' },
  tabText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#2563EB' },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowOpacity: 0.05, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0', marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  subText: { fontSize: 12, color: '#64748B' },
  
  chatBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 20 },

  actions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#2563EB' },
  rejectBtn: { backgroundColor: '#F1F5F9' },
  acceptText: { color: '#FFF', fontWeight: '600' },
  rejectText: { color: '#64748B', fontWeight: '600' },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },
});