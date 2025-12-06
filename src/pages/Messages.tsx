import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import api from '../config/api';

export default function Messages() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(useCallback(() => {
    if (user) fetchConversations();
  }, [user]));

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/Chat/my/${user?.userId}`);
      setConversations(res.data);
    } catch (e) { console.log(e); }
  };

  const openChat = (conversationId: number, otherUser: any) => {
    navigation.navigate('ChatScreen', { conversationId, otherUser });
  };

  return (
    <ScreenWrapper scrollable={false} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {/* Search Bar - Logic to search new users not implemented for brevity, but UI is here */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput 
          placeholder="Search users..." 
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item.conversationId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openChat(item.conversationId, item.otherUser)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.otherUser.fullName[0]}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.name}>{item.otherUser.fullName}</Text>
              <Text style={styles.msg} numberOfLines={1}>{item.lastMessage?.content || 'Start chatting...'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', margin: 16, padding: 12, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center' },
  input: { flex: 1, marginLeft: 10 },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  msg: { color: '#64748B', marginTop: 2 },
});