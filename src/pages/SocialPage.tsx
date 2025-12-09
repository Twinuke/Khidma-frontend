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

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function SocialPage() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetPostId } = route.params || {};

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  // Comments State
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [reactionPickerPostId, setReactionPickerPostId] = useState<
    number | null
  >(null);

  const activePost = posts.find((p) => p.postId === activePostId);

  // Helper: Format Date & Time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  useEffect(() => {
    if (posts.length > 0 && targetPostId) {
      const index = posts.findIndex((p) => p.postId === targetPostId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
      }
    }
  }, [posts, targetPostId]);

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

  const handleLike = async (postId: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          const isLiked = p.isLiked;
          return {
            ...p,
            isLiked: !isLiked,
            likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );
    try {
      await api.post(`/Social/posts/${postId}/like?userId=${user?.userId}`);
    } catch (e) {
      console.log("Like failed", e);
    }
  };

  // ✅ Fixed Reaction Toggle
  const handleReaction = async (postId: number, reaction: string) => {
    setReactionPickerPostId(null);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          const currentReaction = p.myReaction;
          const isRemoving = currentReaction === reaction; // Check if toggling off

          let newReactions = [...(p.reactions || [])];

          if (currentReaction) {
            newReactions = newReactions
              .map((r) =>
                r.type === currentReaction ? { ...r, count: r.count - 1 } : r
              )
              .filter((r) => r.count > 0);
          }

          if (!isRemoving) {
            const existing = newReactions.find((r) => r.type === reaction);
            if (existing) {
              existing.count += 1;
            } else {
              newReactions.push({ type: reaction, count: 1 });
            }
          }

          return {
            ...p,
            myReaction: isRemoving ? null : reaction,
            reactions: newReactions,
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

  const handleLikeComment = async (commentId: number) => {
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
    const formattedDate = formatDateTime(item.createdAt);
    const isTarget = item.postId === targetPostId;

    return (
      <View
        style={[styles.card, isTarget && styles.highlightCard]}
        onStartShouldSetResponder={() => {
          if (reactionPickerPostId === item.postId)
            setReactionPickerPostId(null);
          return false;
        }}
      >
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
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>

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

        {item.reactions && item.reactions.length > 0 && (
          <View style={styles.reactionsList}>
            {item.reactions.map((r: any) => (
              <View key={r.type} style={styles.reactionBubble}>
                <Text style={{ fontSize: 12 }}>
                  {r.type} {r.count}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statText}>{item.likesCount} Likes</Text>
          <TouchableOpacity onPress={() => openComments(item.postId)}>
            <Text style={styles.statText}>{item.comments.length} Comments</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.actions, { zIndex: 10 }]}>
          {reactionPickerPostId === item.postId && (
            <View style={styles.reactionContainer}>
              {REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReaction(item.postId, emoji)}
                  style={styles.emojiBtn}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item.postId)}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={22}
              color={item.isLiked ? "#EF4444" : "#64748B"}
            />
            <Text
              style={[styles.actionText, item.isLiked && { color: "#EF4444" }]}
            >
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              setReactionPickerPostId(
                reactionPickerPostId === item.postId ? null : item.postId
              )
            }
          >
            {item.myReaction ? (
              <Text style={{ fontSize: 20 }}>{item.myReaction}</Text>
            ) : (
              <Ionicons name="happy-outline" size={22} color="#64748B" />
            )}
            <Text
              style={[
                styles.actionText,
                item.myReaction && { color: "#2563EB" },
              ]}
            >
              {item.myReaction ? "Reacted" : "React"}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyTitle}>No posts yet.</Text>
          }
        />
      )}

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
                    <Text style={styles.commentDate}>
                      {formatDateTime(item.createdAt)}
                    </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  iconBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  highlightCard: {
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
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
  reactionsList: { flexDirection: "row", gap: 6, marginBottom: 10 },
  reactionBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
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
  reactionContainer: {
    position: "absolute",
    bottom: 50,
    left: "20%",
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
