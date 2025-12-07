import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, 
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { useUser } from '../context/UserContext';
import api from '../config/api';
import { useNavigation } from '@react-navigation/native';

export default function SocialPage() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0); // Check if empty due to no friends

  // Comments State
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  const fetchFeed = async () => {
    try {
      // 1. Check if user has connections first (optional UI enhancement)
      const connRes = await api.get(`/Social/connections/${user?.userId}`);
      setConnectionsCount(connRes.data.length);

      // 2. Fetch the actual feed
      const res = await api.get(`/Social/feed/${user?.userId}`);
      setPosts(res.data);
    } catch (e) {
      console.log('Feed Error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.postId === postId) {
        return { 
          ...p, 
          isLiked: !isLiked, 
          likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 
        };
      }
      return p;
    }));

    try {
      await api.post(`/Social/posts/${postId}/like?userId=${user?.userId}`);
    } catch (e) {
      console.log("Like failed", e);
      // Revert if failed (omitted for brevity)
    }
  };

  const handleComment = async (postId: number) => {
    if (!commentText.trim()) return;

    try {
      const res = await api.post('/Social/posts/comment', {
        postId,
        userId: user?.userId,
        content: commentText
      });
      
      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.postId === postId) {
          return { ...p, comments: [...p.comments, res.data] };
        }
        return p;
      }));
      
      setCommentText('');
    } catch (e) {
      Alert.alert("Error", "Failed to post comment.");
    }
  };

  const navigateToJob = (jobId: number) => {
    // If client -> ClientJobDetails, if Freelancer -> JobDetails (standard view)
    // Assuming standard view is safer for general navigation
    navigation.navigate('JobDetails', { jobId }); 
  };

  const renderPost = ({ item }: { item: any }) => {
    const isJobPosted = item.type === 0;
    const timeAgo = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image 
            source={{ uri: item.user.profileImageUrl || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.username}>{item.user.fullName}</Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {isJobPosted ? (
            <Text style={styles.text}>
              posted a new job: 
              <Text style={styles.linkText} onPress={() => navigateToJob(item.jobId)}> {item.jobTitle}</Text>
            </Text>
          ) : (
            <Text style={styles.text}>
              had their bid accepted on 
              <Text style={styles.linkText} onPress={() => navigateToJob(item.jobId)}> {item.jobTitle} </Text>
              by <Text style={{fontWeight:'700'}}>{item.secondPartyName}</Text>.
            </Text>
          )}
        </View>

        {/* Interaction Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{item.likesCount} Likes</Text>
          <Text style={styles.statText}>{item.comments.length} Comments</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleLike(item.postId, item.isLiked)}
          >
            <Ionicons name={item.isLiked ? "heart" : "heart-outline"} size={20} color={item.isLiked ? "#EF4444" : "#64748B"} />
            <Text style={[styles.actionText, item.isLiked && {color: '#EF4444'}]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => setActivePostId(activePostId === item.postId ? null : item.postId)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </View>

        {/* Comment Section (Expanded) */}
        {activePostId === item.postId && (
          <View style={styles.commentsSection}>
            {item.comments.map((c: any) => (
              <View key={c.commentId} style={styles.commentItem}>
                <Text style={styles.commentUser}>{c.user.fullName}: </Text>
                <Text style={styles.commentContent}>{c.content}</Text>
              </View>
            ))}
            
            <View style={styles.inputRow}>
              <TextInput 
                style={styles.input} 
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={() => handleComment(item.postId)}>
                <Ionicons name="send" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.postId.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {connectionsCount === 0 ? "No connections yet" : "No recent activity"}
              </Text>
              <Text style={styles.emptySub}>
                {connectionsCount === 0 
                  ? "Add users to your network to start seeing their updates here." 
                  : "Your friends haven't posted anything recently."}
              </Text>
              
              {connectionsCount === 0 && (
                <TouchableOpacity 
                  style={styles.findBtn}
                  onPress={() => navigation.navigate('Search')} // Or navigate to connections tab
                >
                  <Text style={styles.findBtnText}>Find People</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#E2E8F0' },
  username: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  timestamp: { fontSize: 12, color: '#64748B' },
  
  body: { marginBottom: 12 },
  text: { fontSize: 15, color: '#334155', lineHeight: 22 },
  linkText: { color: '#2563EB', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12, borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 8 },
  statText: { fontSize: 12, color: '#64748B' },

  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  commentsSection: { marginTop: 10, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  commentItem: { flexDirection: 'row', marginBottom: 6 },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#0F172A' },
  commentContent: { fontSize: 13, color: '#334155', flex: 1 },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E2E8F0', height: 40 },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 16 },
  emptySub: { textAlign: 'center', color: '#64748B', marginTop: 8, lineHeight: 20 },
  findBtn: { marginTop: 20, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  findBtnText: { color: '#FFF', fontWeight: '700' }
});