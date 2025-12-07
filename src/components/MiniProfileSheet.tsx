import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { useNavigation } from '@react-navigation/native';

interface MiniProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  user: any; // The target user to show
  currentUserId: number;
}

const { height } = Dimensions.get('window');

export const MiniProfileSheet: React.FC<MiniProfileSheetProps> = ({ visible, onClose, user, currentUserId }) => {
  const navigation = useNavigation<any>();

  const handleConnect = async () => {
    try {
      await api.post('/Social/connect', {
        requesterId: currentUserId,
        targetId: user.userId
      });
      alert('Connection request sent!');
      onClose();
    } catch (e) {
      alert('Could not connect or already connected.');
    }
  };

  const handleChat = async () => {
    // Reuse existing chat logic
    try {
      const res = await api.post('/Chat/open', {
        user1Id: currentUserId,
        user2Id: user.userId
      });
      onClose();
      navigation.navigate('ChatScreen', { conversationId: res.data.conversationId, otherUser: user });
    } catch (e) {
      console.log(e);
    }
  };

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        
        <View style={styles.header}>
          {user.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.fullName?.[0]}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.role}>{user.userType === 1 ? 'Client' : 'Freelancer'} • {user.city || 'No Location'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>12</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {user.userId !== currentUserId && (
            <>
              <TouchableOpacity style={[styles.btn, styles.connectBtn]} onPress={handleConnect}>
                <Ionicons name="person-add" size={20} color="#FFF" />
                <Text style={styles.btnText}>Connect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.chatBtn]} onPress={handleChat}>
                <Ionicons name="chatbubble" size={20} color="#2563EB" />
                <Text style={[styles.btnText, { color: '#2563EB' }]}>Chat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    elevation: 10 
  },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#2563EB' },
  info: { marginLeft: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  role: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B' },
  verticalLine: { width: 1, backgroundColor: '#F1F5F9' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12, gap: 8 },
  connectBtn: { backgroundColor: '#2563EB' },
  chatBtn: { backgroundColor: '#F1F5F9' },
  btnText: { fontWeight: '600', color: '#FFF' },
});