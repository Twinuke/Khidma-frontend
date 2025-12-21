import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const REACTION_OPTIONS = [
  { type: "Like", emoji: "👍" },
  { type: "Celebrate", emoji: "👏" },
  { type: "Love", emoji: "❤️" },
  { type: "Funny", emoji: "😂" },
  { type: "Insightful", emoji: "💡" },
];

export default function SocialPage() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetPostId } = route.params || {};

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const activePost = posts.find((p) => p.postId === activePostId);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    // ✅ FIX: Defensive check for userId
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  const fetchFeed = async () => {
    try {
      const res = await api.get(`/Social/feed/${user?.userId}`);
      // ✅ FIX: Ensure res.data is an array
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("Feed Error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (postId: number, reaction: string | null) => {
    setReactionPickerId(null);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          const wasInteracted = p.isLiked;
          const isRemoving = reaction === null || (wasInteracted && p.myReaction === reaction);
          return {
            ...p,
            isLiked: !isRemoving,
            myReaction: isRemoving ? null : reaction,
            likesCount: isRemoving ? (p.likesCount || 0) - 1 : wasInteracted ? p.likesCount : (p.likesCount || 0) + 1,
          };
        }
        return p;
      })
    );

    try {
      await api.post(`/Social/posts/${postId}/react?userId=${user?.userId}&reaction=${reaction || ""}`);
    } catch (e) {
      fetchFeed();
    }
  };

  const handleComment = async () => {
    if (!activePostId || !commentText.trim()) return;
    try {
      const res = await api.post("/Social/posts/comment", {
        postId: activePostId,
        userId: user?.userId,
        content: commentText,
      });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.postId === activePostId) {
            return {
              ...p,
              // ✅ FIX: Safeguard comments array
              comments: [...(p.comments || []), res.data],
            };
          }
          return p;
        })
      );
      setCommentText("");
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert("Error", "Failed to post comment.");
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    // ✅ FIX: Immediate return if item or user is missing to prevent 500 crash
    if (!item || !item.user) return null;

    const isJobPosted = item.type === 0;
    const currentEmoji = REACTION_OPTIONS.find((r) => r.type === item.myReaction)?.emoji;

    return (
      <View style={[styles.card, item.postId === targetPostId && styles.highlightCard]}>
        <View style={styles.headerRow}>
          <Image
            source={{ uri: item.user.profileImageUrl || "https://via.placeholder.com/40" }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{item.user.fullName || "Unknown User"}</Text>
            <Text style={styles.timestamp}>{formatDateTime(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.text}>
            {isJobPosted ? "posted a new job: " : "had their bid accepted on "}
            <Text style={styles.linkText} onPress={() => navigation.navigate("JobDetails", { jobId: item.jobId })}>
              {item.jobTitle || "Job Details"}
            </Text>
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{(item.likesCount || 0)} Interactions</Text>
          <TouchableOpacity onPress={() => setActivePostId(item.postId)}>
            <Text style={styles.statText}>{(item.comments?.length || 0)} Comments</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {reactionPickerId === item.postId && (
            <View style={styles.reactionPopup}>
              {REACTION_OPTIONS.map((opt) => (
                <TouchableOpacity key={opt.type} onPress={() => handleInteraction(item.postId, opt.type)}>
                  <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleInteraction(item.postId, item.isLiked ? null : "Like")}
            onLongPress={() => setReactionPickerId(item.postId)}
          >
            {item.isLiked && item.myReaction !== "Like" ? (
              <Text style={{ fontSize: 20 }}>{currentEmoji}</Text>
            ) : (
              <Ionicons name={item.isLiked ? "heart" : "heart-outline"} size={22} color={item.isLiked ? "#2563EB" : "#64748B"} />
            )}
            <Text style={[styles.actionText, item.isLiked && { color: "#2563EB" }]}>{item.myReaction || "Like"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setActivePostId(item.postId)}>
            <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.postId?.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyTitle}>No posts yet.</Text>}
        />
      )}

      <Modal visible={activePostId !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActivePostId(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActivePostId(null)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={activePost?.comments || []}
            keyExtractor={(item) => item.commentId?.toString()}
            contentContainerStyle={styles.commentsList}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image source={{ uri: item.user?.profileImageUrl || "https://via.placeholder.com/30" }} style={styles.commentAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{item.user?.fullName || "User"}</Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                  <Text style={styles.commentDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
              </View>
            )}
          />
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Add a comment..." value={commentText} onChangeText={setCommentText} multiline />
            <TouchableOpacity onPress={handleComment} disabled={!commentText.trim()}>
              <Ionicons name="send" size={24} color={commentText.trim() ? "#2563EB" : "#94A3B8"} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  iconBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  highlightCard: { borderWidth: 2, borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#E2E8F0" },
  username: { fontWeight: "700", fontSize: 16, color: "#0F172A" },
  timestamp: { fontSize: 12, color: "#64748B" },
  body: { marginBottom: 12 },
  text: { fontSize: 15, color: "#334155", lineHeight: 22 },
  linkText: { color: "#2563EB", fontWeight: "700" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, borderBottomWidth: 1, borderColor: "#F1F5F9", paddingBottom: 8 },
  statText: { fontSize: 12, color: "#64748B" },
  actions: { flexDirection: "row", justifyContent: "space-around", position: "relative" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, minWidth: 100, justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  reactionPopup: { position: "absolute", bottom: 55, left: 20, flexDirection: "row", backgroundColor: "#FFF", borderRadius: 30, padding: 8, gap: 12, elevation: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, zIndex: 9999 },
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  commentsList: { padding: 16 },
  commentItem: { flexDirection: "row", marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: "#E2E8F0" },
  commentBubble: { backgroundColor: "#F1F5F9", borderRadius: 12, padding: 10, alignSelf: "flex-start" },
  commentUser: { fontWeight: "700", fontSize: 13, color: "#0F172A", marginBottom: 2 },
  commentContent: { fontSize: 14, color: "#334155" },
  commentDate: { fontSize: 12, color: "#94A3B8", marginTop: 4, marginLeft: 4 },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderColor: "#E2E8F0", paddingBottom: Platform.OS === "ios" ? 30 : 10 },
  input: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#E2E8F0", marginRight: 10, maxHeight: 100 },
  emptyTitle: { textAlign: "center", marginTop: 20, color: "#94A3B8" },
});