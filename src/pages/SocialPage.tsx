import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
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
import { ScreenWrapper } from "../../components/ScreenWrapper";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function SocialPage() {
  const { user } = useUser();
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0);

  // Comments State
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // Reaction Picker State
  const [reactionPickerPostId, setReactionPickerPostId] = useState<
    number | null
  >(null);

  const activePost = posts.find((p) => p.postId === activePostId);

  useEffect(() => {
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  const fetchFeed = async () => {
    try {
      const connRes = await api.get(`/Social/connections/${user?.userId}`);
      setConnectionsCount(connRes.data.length);

      const res = await api.get(`/Social/feed/${user?.userId}`);
      setPosts(res.data);
    } catch (e) {
      console.log("Feed Error", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle Reaction (Emoji)
  const handleReaction = async (postId: number, reaction: string) => {
    setReactionPickerPostId(null); // Close picker

    // Optimistic Update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          const isNew = !p.myReaction;
          return {
            ...p,
            myReaction: reaction,
            likesCount: isNew ? p.likesCount + 1 : p.likesCount,
          };
        }
        return p;
      })
    );

    try {
      await api.post(`/Social/posts/react`, {
        postId,
        userId: user?.userId,
        reaction,
      });
    } catch (e) {
      console.log("Reaction failed", e);
    }
  };

  // ✅ NEW: Simple Like Toggle (Default Heart)
  const handleSimpleLike = (postId: number, currentReaction: string | null) => {
    if (currentReaction) {
      // If already reacted, remove reaction (Unlike)
      handleRemoveReaction(postId);
    } else {
      // Default like
      handleReaction(postId, "❤️");
    }
  };

  const handleRemoveReaction = async (postId: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          return { ...p, myReaction: null, likesCount: p.likesCount - 1 };
        }
        return p;
      })
    );

    try {
      await api.delete(`/Social/posts/${postId}/react?userId=${user?.userId}`);
    } catch (e) {
      console.log(e);
    }
  };

  // ✅ NEW: Like a Comment
  const handleLikeComment = async (commentId: number) => {
    // Update Local State inside the Active Post
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === activePostId) {
          const updatedComments = p.comments.map((c: any) => {
            if (c.commentId === commentId) {
              const isLiked = c.isLiked;
              return {
                ...c,
                isLiked: !isLiked,
                likesCount: isLiked
                  ? (c.likesCount || 0) - 1
                  : (c.likesCount || 0) + 1,
              };
            }
            return c;
          });
          return { ...p, comments: updatedComments };
        }
        return p;
      })
    );

    // API Call
    try {
      await api.post(`/Social/comments/${commentId}/like`, {
        userId: user?.userId,
      });
    } catch (e) {
      console.log(e);
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
              comments: [
                ...p.comments,
                { ...res.data, likesCount: 0, isLiked: false },
              ],
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

  const openComments = (postId: number) => setActivePostId(postId);
  const closeComments = () => {
    setActivePostId(null);
    setCommentText("");
  };

  const renderPost = ({ item }: { item: any }) => {
    const isJobPosted = item.type === 0;
    const timeAgo = new Date(item.createdAt).toLocaleDateString();

    return (
      <View
        style={styles.card}
        onStartShouldSetResponder={() => {
          setReactionPickerPostId(null);
          return false;
        }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Image
            source={{
              uri:
                item.user.profileImageUrl || "https://via.placeholder.com/40",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{item.user.fullName}</Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.body}>
          {isJobPosted ? (
            <Text style={styles.text}>
              posted a new job:{" "}
              <Text
                style={styles.linkText}
                onPress={() =>
                  navigation.navigate("JobDetails", { jobId: item.jobId })
                }
              >
                {item.jobTitle}
              </Text>
            </Text>
          ) : (
            <Text style={styles.text}>
              had their bid accepted on{" "}
              <Text
                style={styles.linkText}
                onPress={() =>
                  navigation.navigate("JobDetails", { jobId: item.jobId })
                }
              >
                {item.jobTitle}
              </Text>
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{item.likesCount} Likes</Text>
          <TouchableOpacity onPress={() => openComments(item.postId)}>
            <Text style={styles.statText}>{item.comments.length} Comments</Text>
          </TouchableOpacity>
        </View>

        {/* Actions with Reaction Picker */}
        <View style={[styles.actions, { zIndex: 10 }]}>
          {/* Reaction Picker Overlay */}
          {reactionPickerPostId === item.postId && (
            <View style={styles.reactionContainer}>
              {REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReaction(item.postId, emoji)}
                  style={styles.emojiBtn}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleSimpleLike(item.postId, item.myReaction)}
            onLongPress={() => setReactionPickerPostId(item.postId)}
          >
            {item.myReaction ? (
              <Text style={{ fontSize: 20 }}>{item.myReaction}</Text>
            ) : (
              <Ionicons name="heart-outline" size={20} color="#64748B" />
            )}
            <Text
              style={[
                styles.actionText,
                item.myReaction && { color: "#EF4444" },
              ]}
            >
              {item.myReaction ? "Reacted" : "Like"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openComments(item.postId)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper style={styles.container} scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyTitle}>No posts yet.</Text>
          }
        />
      )}

      {/* COMMENTS MODAL */}
      <Modal
        visible={activePostId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeComments}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={closeComments}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={activePost?.comments || []}
            keyExtractor={(item) => item.commentId.toString()}
            contentContainerStyle={styles.commentsList}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{
                    uri:
                      item.user.profileImageUrl ||
                      "https://via.placeholder.com/30",
                  }}
                  style={styles.commentAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{item.user.fullName}</Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                  <View style={styles.commentActions}>
                    <Text style={styles.commentDate}>Just now</Text>
                    <TouchableOpacity
                      onPress={() => handleLikeComment(item.commentId)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name={item.isLiked ? "heart" : "heart-outline"}
                        size={14}
                        color={item.isLiked ? "#EF4444" : "#94A3B8"}
                      />
                      <Text style={{ fontSize: 12, color: "#64748B" }}>
                        {item.likesCount > 0 ? item.likesCount : "Like"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentText.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={commentText.trim() ? "#2563EB" : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#E2E8F0",
  },
  username: { fontWeight: "700", fontSize: 16, color: "#0F172A" },
  timestamp: { fontSize: 12, color: "#64748B" },
  body: { marginBottom: 12 },
  text: { fontSize: 15, color: "#334155", lineHeight: 22 },
  linkText: { color: "#2563EB", fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 8,
  },
  statText: { fontSize: 12, color: "#64748B" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "relative",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  actionText: { fontSize: 14, fontWeight: "600", color: "#64748B" },

  // Reaction Picker Styles
  reactionContainer: {
    position: "absolute",
    bottom: 40,
    left: 10,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 8,
    gap: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  emojiBtn: { padding: 4 },

  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  commentsList: { padding: 16 },
  commentItem: { flexDirection: "row", marginBottom: 16 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#E2E8F0",
  },
  commentBubble: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 10,
    alignSelf: "flex-start",
  },
  commentUser: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 2,
  },
  commentContent: { fontSize: 14, color: "#334155" },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    marginLeft: 4,
  },
  commentDate: { fontSize: 12, color: "#94A3B8" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
    maxHeight: 100,
  },
  emptyTitle: { textAlign: "center", marginTop: 20, color: "#94A3B8" },
});
