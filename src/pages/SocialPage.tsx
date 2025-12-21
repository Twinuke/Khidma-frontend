import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");

// Define the reaction options
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
  const insets = useSafeAreaInsets();
  const { targetPostId } = route.params || {};

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Interaction State
  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);

  // Comments State
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // Create Post State
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  const activePost = posts.find((p) => p.postId === activePostId);

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  // Helper: Format Date & Time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  useEffect(() => {
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  // Scroll to target post if redirected from a notification
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
      if (!user?.userId) {
        console.log("No user ID available");
        setLoading(false);
        return;
      }

      console.log(`Fetching feed for user ${user.userId}`);
      const res = await api.get(`/Social/feed/${user.userId}`);

      if (res.data && Array.isArray(res.data)) {
        console.log(`Feed loaded: ${res.data.length} posts`);
        setPosts(res.data);
      } else {
        console.log("Invalid feed response format");
        setPosts([]);
      }
    } catch (e: any) {
      console.log("Feed Error:", e);
      console.log("Error details:", e.response?.data || e.message);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user?.userId) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    setPosting(true);
    try {
      const res = await api.post("/Social/posts", {
        userId: user.userId,
        content: postContent.trim(),
      });

      // Add the new post to the top of the list
      setPosts((prev) => [res.data, ...prev]);
      setCreatePostVisible(false);
      setPostContent("");
      Alert.alert("Success", "Post created successfully!");
    } catch (e: any) {
      console.log("Create post error:", e);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleInteraction = async (postId: number, reaction: string | null) => {
    setReactionPickerId(null);

    // Optimistic UI Update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          const wasInteracted = p.isLiked;
          const isRemoving =
            reaction === null || (wasInteracted && p.myReaction === reaction);

          return {
            ...p,
            isLiked: !isRemoving,
            myReaction: isRemoving ? null : reaction,
            likesCount: isRemoving
              ? p.likesCount - 1
              : wasInteracted
              ? p.likesCount
              : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    try {
      if (!user?.userId) return;

      const reactionValue = reaction || "";
      const url = `/Social/posts/${postId}/react?userId=${user.userId}&reaction=${encodeURIComponent(reactionValue)}`;

      await api.post(url);
    } catch (e: any) {
      console.log("Interaction failed:", e);
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

  const openComments = (postId: number) => setActivePostId(postId);
  const closeComments = () => {
    setActivePostId(null);
    setCommentText("");
  };

  const renderPost = ({ item }: { item: any }) => {
    const isGeneralPost = item.type === 2;
    const isJobPosted = item.type === 0;
    const formattedDate = formatDateTime(item.createdAt);
    const isTarget = item.postId === targetPostId;

    const currentEmoji = REACTION_OPTIONS.find(
      (r) => r.type === item.myReaction
    )?.emoji;

    return (
      <View style={[styles.card, isTarget && styles.highlightCard]}>
        <View style={styles.headerRow}>
          <Image
            source={{
              uri:
                item.user?.profileImageUrl || "https://via.placeholder.com/40",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.user?.fullName || "Unknown"}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {isGeneralPost ? (
            <Text style={styles.postContent}>{item.content}</Text>
          ) : (
            <Text style={styles.text}>
              {isJobPosted ? "posted a new job: " : "had their bid accepted on "}
              <Text
                style={styles.linkText}
                onPress={() =>
                  item.jobId &&
                  navigation.navigate("JobDetails", { jobId: item.jobId })
                }
              >
                {item.jobTitle}
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            {item.likesCount || 0} {item.likesCount === 1 ? "Interaction" : "Interactions"}
          </Text>
          <TouchableOpacity onPress={() => openComments(item.postId)}>
            <Text style={styles.statText}>
              {item.comments?.length || 0} {item.comments?.length === 1 ? "Comment" : "Comments"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          {reactionPickerId === item.postId && (
            <View style={styles.reactionPopup}>
              {REACTION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => handleInteraction(item.postId, opt.type)}
                  style={styles.emojiBtn}
                >
                  <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              handleInteraction(item.postId, item.isLiked ? null : "Like")
            }
            onLongPress={() => setReactionPickerId(item.postId)}
            delayLongPress={300}
          >
            {item.isLiked && item.myReaction !== "Like" ? (
              <Text style={{ fontSize: 20 }}>{currentEmoji}</Text>
            ) : (
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={22}
                color={item.isLiked ? "#2563EB" : "#64748B"}
              />
            )}
            <Text
              style={[styles.actionText, item.isLiked && { color: "#2563EB" }]}
            >
              {item.myReaction || "Like"}
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
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community</Text>
            <TouchableOpacity
              onPress={() => setCreatePostVisible(true)}
              style={styles.createBtn}
            >
              <LinearGradient
                colors={["#2563EB", "#3B82F6"]}
                style={styles.createBtnGradient}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share something with your community!
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setCreatePostVisible(true)}
              >
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Create Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Post Modal */}
      <Modal
        visible={createPostVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreatePostVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreatePostVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={posting || !postContent.trim()}
            >
              <Text
                style={[
                  styles.modalPost,
                  (!postContent.trim() || posting) && styles.modalPostDisabled,
                ]}
              >
                {posting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.modalUserRow}>
              <Image
                source={{
                  uri:
                    user?.profileImageUrl || "https://via.placeholder.com/40",
                }}
                style={styles.modalAvatar}
              />
              <Text style={styles.modalUserName}>{user?.fullName || "You"}</Text>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#94A3B8"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              autoFocus
              maxLength={1000}
            />
            <Text style={styles.charCount}>
              {postContent.length}/1000
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
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
                      item.user?.profileImageUrl ||
                      "https://via.placeholder.com/30",
                  }}
                  style={styles.commentAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>
                      {item.user?.fullName || "Unknown"}
                    </Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                  <Text style={styles.commentDate}>
                    {formatDateTime(item.createdAt)}
                  </Text>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },
  headerGradient: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  iconBtn: { padding: 4, width: 40 },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  createBtnGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  list: { padding: 16, paddingTop: 120, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightCard: {
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },
  username: { fontWeight: "700", fontSize: 16, color: "#0F172A" },
  timestamp: { fontSize: 12, color: "#64748B", marginTop: 2 },
  body: { marginBottom: 12 },
  text: { fontSize: 15, color: "#334155", lineHeight: 22 },
  postContent: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
  linkText: { color: "#2563EB", fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  statText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "relative",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    minWidth: 100,
    justifyContent: "center",
  },
  actionText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  reactionPopup: {
    position: "absolute",
    bottom: 55,
    left: 20,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 8,
    gap: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9999,
  },
  emojiBtn: { padding: 4 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
  },
  modalCancel: { fontSize: 16, color: "#64748B" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  modalPost: { fontSize: 16, fontWeight: "600", color: "#2563EB" },
  modalPostDisabled: { color: "#94A3B8" },
  modalBody: { flex: 1, padding: 16 },
  modalUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  modalInput: {
    fontSize: 16,
    color: "#0F172A",
    minHeight: 200,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 8,
  },
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
  commentDate: { fontSize: 12, color: "#94A3B8", marginTop: 4, marginLeft: 4 },
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
});
