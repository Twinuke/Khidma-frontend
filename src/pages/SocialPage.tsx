import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { useUser } from '../context/UserContext';
import api from '../config/api';
import { MiniProfileSheet } from '../components/MiniProfileSheet';

export default function SocialPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Comments Logic
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Profile Sheet Logic
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      // Re-using search to get recent jobs for feed
      const res = await api.get('/Jobs/search?page=1&pageSize=20');
      setJobs(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (jobId: number) => {
    try {
      const res = await api.get(`/Social/comments/${jobId}`);
      setComments(res.data);
    } catch (e) { console.log(e); }
  };

  const toggleComments = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      fetchComments(jobId);
    }
  };

  const postComment = async (jobId: number) => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post('/Social/comments', {
        jobId,
        userId: user?.userId,
        content: newComment
      });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (e) {
      alert('Failed to post');
    }
  };

  const openProfile = (targetUser: any) => {
    setSelectedUser(targetUser);
  };

  const renderJob = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.row}>
        <TouchableOpacity onPress={() => openProfile({ fullName: item.client.fullName, userId: item.client.userId, userType: 1 })}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.client.fullName[0]}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{item.client.fullName}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
      
      <View style={styles.tags}>
        <View style={styles.tag}><Text style={styles.tagText}>${item.budget}</Text></View>
        <View style={styles.tag}><Text style={styles.tagText}>{item.category || 'General'}</Text></View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(item.jobId)}>
          <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
          <Text style={styles.actionText}>Comments</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {expandedJobId === item.jobId && (
        <View style={styles.commentSection}>
          {comments.map(c => (
            <View key={c.commentId} style={styles.commentRow}>
              <TouchableOpacity onPress={() => openProfile(c.user)}>
                <Image source={{ uri: c.user?.profileImageUrl || 'https://via.placeholder.com/30' }} style={styles.commentAvatar} />
              </TouchableOpacity>
              <View style={styles.commentBubble}>
                <Text style={styles.commentUser}>{c.user?.fullName}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Write a comment..." 
              value={newComment} 
              onChangeText={setNewComment} 
            />
            <TouchableOpacity onPress={() => postComment(item.jobId)}>
              <Ionicons name="send" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 20}} />
      ) : (
        <FlatList 
          data={jobs}
          renderItem={renderJob}
          keyExtractor={item => item.jobId.toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <MiniProfileSheet 
        visible={!!selectedUser} 
        user={selectedUser} 
        currentUserId={user?.userId || 0}
        onClose={() => setSelectedUser(null)} 
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowOpacity: 0.05, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontWeight: 'bold', color: '#2563EB' },
  clientName: { fontWeight: '700', color: '#0F172A' },
  time: { fontSize: 12, color: '#94A3B8' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  desc: { color: '#475569', marginBottom: 12 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, color: '#475569' },
  actionRow: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 12, flexDirection: 'row' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#64748B', fontSize: 14 },
  
  commentSection: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  commentRow: { flexDirection: 'row', marginBottom: 12 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8, backgroundColor: '#DDD' },
  commentBubble: { flex: 1, backgroundColor: '#FFF', padding: 8, borderRadius: 8 },
  commentUser: { fontWeight: '700', fontSize: 12, marginBottom: 2 },
  commentText: { fontSize: 13, color: '#334155' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 }
});