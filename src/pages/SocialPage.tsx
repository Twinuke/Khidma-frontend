import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
  Share,
  Linking, // ✅ Added for opening document URLs
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");

const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A",
  subtext: "#64748B",
  primary: "#2563EB",
  border: "#E2E8F0",
  success: "#059669",
  jobBg: "#EFF6FF",
};

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
  const insets = useSafeAreaInsets();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);
  
  // Create Post States
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Comment States
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const activePost = posts.find((p) => p.postId === activePostId);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fix: Base URL for files (strips /api from the end)
  const FILE_BASE_URL = api.defaults.baseURL?.replace(/\/api\/?$/, "");

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (user?.userId) fetchFeed();
  }, [user?.userId]);

  const fetchFeed = async () => {
    try {
      const res = await api.get(`/Social/feed/${user?.userId}`);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- MEDIA HANDLERS ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.assets) setSelectedDoc(result.assets[0]);
  };

  const handleDownload = async (url: string) => {
    try {
      const fullUrl = FILE_BASE_URL + url;
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert("Error", "Don't know how to open this URL");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open document");
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedImage && !selectedDoc) return;
    
    setPosting(true);
    const formData = new FormData();
    formData.append("userId", user?.userId.toString() || "");
    formData.append("content", postContent.trim());

    if (selectedImage) {
      formData.append("image", {
        uri: selectedImage.uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);
    }

    if (selectedDoc) {
      formData.append("document", {
        uri: selectedDoc.uri,
        name: selectedDoc.name,
        type: selectedDoc.mimeType || 'application/pdf',
      } as any);
    }

    try {
      await api.post("/Social/posts", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCreatePostVisible(false);
      resetComposer();
      fetchFeed();
    } catch (e) {
      Alert.alert("Error", "Failed to share post.");
    } finally {
      setPosting(false);
    }
  };

  const resetComposer = () => {
    setPostContent("");
    setSelectedImage(null);
    setSelectedDoc(null);
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
        prev.map((p) => (p.postId === activePostId ? { ...p, comments: [...(p.comments || []), res.data] } : p))
      );
      setCommentText("");
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert("Error", "Failed to post comment.");
    }
  };

  const handleShare = async (post: any) => {
    try {
      const message = `${post.user?.fullName} shared on Khidma: \n\n"${post.content || post.jobTitle}"`;
      await Share.share({ message });
    } catch (error) {
      console.log("Share error", error);
    }
  };

  const handleMoreOptions = (post: any) => {
    const isOwner = post.userId === user?.userId;
    Alert.alert("Post Options", "", [
      { text: "Cancel", style: "cancel" },
      isOwner 
        ? { 
            text: "Delete Post", 
            style: "destructive", 
            onPress: async () => {
              try {
                await api.delete(`/Social/posts/${post.postId}?userId=${user?.userId}`);
                setPosts(prev => prev.filter(p => p.postId !== post.postId));
              } catch (e) { Alert.alert("Error", "Failed to delete."); }
            } 
          }
        : { text: "Report Post", onPress: () => Alert.alert("Reported", "Thank you.") }
    ]);
  };

  const handleInteraction = async (postId: number, reaction: string | null) => {
    setReactionPickerId(null);
    setPosts(prev => prev.map(p => {
      if (p.postId === postId) {
        const wasLiked = p.isLiked;
        const removing = reaction === null || (wasLiked && p.myReaction === reaction);
        return {
          ...p,
          isLiked: !removing,
          myReaction: removing ? null : reaction,
          likesCount: removing ? p.likesCount - 1 : (wasLiked ? p.likesCount : p.likesCount + 1)
        };
      }
      return p;
    }));
    try {
      await api.post(`/Social/posts/${postId}/react?userId=${user?.userId}&reaction=${encodeURIComponent(reaction || "")}`);
    } catch (e) { fetchFeed(); }
  };

  const renderPost = ({ item }: { item: any }) => {
    const isJobUpdate = item.type === 0 || item.type === 1;
    const currentEmoji = REACTION_OPTIONS.find(r => r.type === item.myReaction)?.emoji;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: item.user?.profileImageUrl || "https://via.placeholder.com/44" }} style={styles.postAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthorName}>{item.user?.fullName}</Text>
            <Text style={styles.postTimeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={() => handleMoreOptions(item)} style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.subtext} />
          </TouchableOpacity>
        </View>

        <View style={styles.postBody}>
          {item.content && <Text style={styles.postText}>{item.content}</Text>}
          
          {item.imageUrl && (
            <Image 
              source={{ uri: FILE_BASE_URL + item.imageUrl }} 
              style={styles.postImage} 
              resizeMode="cover" 
            />
          )}

          {/* ✅ FIXED: Trigger handleDownload when clicking CV/Document */}
          {item.documentUrl && (
            <TouchableOpacity 
              style={styles.documentPreview} 
              onPress={() => handleDownload(item.documentUrl)}
            >
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.documentNameText} numberOfLines={1}>{item.documentName || "View Document"}</Text>
                <Text style={styles.documentSubText}>Tap to open/download</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}

          {isJobUpdate && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate("JobDetails", { jobId: item.jobId })}
              style={styles.jobPreviewCard}
            >
              <View style={styles.jobTypeBadge}>
                <Ionicons name={item.type === 0 ? "briefcase" : "checkmark-circle"} size={14} color={item.type === 0 ? COLORS.primary : COLORS.success} />
                <Text style={[styles.jobTypeText, { color: item.type === 0 ? COLORS.primary : COLORS.success }]}>
                  {item.type === 0 ? "NEW JOB POSTED" : "HIRED"}
                </Text>
              </View>
              <Text style={styles.jobPreviewTitle}>{item.jobTitle}</Text>
              <View style={styles.viewJobBtn}>
                <Text style={styles.viewJobText}>View Project</Text>
                <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.engagementStats}>
          <View style={styles.statIcons}>
            <View style={[styles.miniIconCircle, { backgroundColor: '#FEE2E2', zIndex: 2 }]}><Ionicons name="heart" size={10} color="#EF4444" /></View>
            <Text style={styles.statSummaryText}>{item.likesCount || 0}</Text>
          </View>
          <TouchableOpacity onPress={() => setActivePostId(item.postId)}>
            <Text style={styles.statSummaryText}>{item.comments?.length || 0} comments</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionBar}>
          {reactionPickerId === item.postId && (
            <View style={styles.reactionPicker}>
              {REACTION_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.type} onPress={() => handleInteraction(item.postId, opt.type)} style={styles.pickerEmoji}>
                  <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleInteraction(item.postId, item.isLiked ? null : "Like")}
            onLongPress={() => setReactionPickerId(item.postId)}
          >
            {item.isLiked && item.myReaction !== "Like" ? <Text style={{ fontSize: 18 }}>{currentEmoji}</Text> : <Ionicons name={item.isLiked ? "heart" : "heart-outline"} size={20} color={item.isLiked ? "#EF4444" : COLORS.subtext} />}
            <Text style={[styles.actionLabel, item.isLiked && { color: COLORS.primary }]}>{item.myReaction || "Like"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setActivePostId(item.postId)}>
            <Ionicons name="chatbubble-outline" size={18} color={COLORS.subtext} />
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
            <Ionicons name="share-social-outline" size={18} color={COLORS.subtext} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.headerWrapper, { opacity: headerOpacity }]}>
        <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleIconBtn}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={styles.navTitle}>Community</Text>
            <TouchableOpacity onPress={() => setCreatePostVisible(true)} style={styles.circleIconBtn}><Ionicons name="add" size={28} color="#FFF" /></TouchableOpacity>
          </View>
          <View style={styles.headerBody}>
            <Text style={styles.headerTitle}>Network Insights</Text>
            <Text style={styles.headerSubtitle}>Stay updated with your professional circle</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId.toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchFeed(); }}
        ListEmptyComponent={loading ? <ActivityIndicator size="large" style={{marginTop: 50}} /> : null}
      />

      <Modal visible={createPostVisible} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 20 }]}>
            <TouchableOpacity onPress={() => { setCreatePostVisible(false); resetComposer(); }} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share an update</Text>
            <TouchableOpacity 
              onPress={handleCreatePost} 
              disabled={posting || (!postContent.trim() && !selectedImage && !selectedDoc)}
              style={[styles.postButton, posting && { opacity: 0.5 }]}
            >
              <Text style={styles.postButtonText}>{posting ? "..." : "Post"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={styles.modalUserArea}>
              <Image source={{ uri: user?.profileImageUrl || "https://via.placeholder.com/50" }} style={styles.modalAvatar} />
              <Text style={styles.modalUserName}>{user?.fullName}</Text>
            </View>

            <TextInput
              style={styles.richInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#94A3B8"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              autoFocus
            />

            {/* PREVIEWS */}
            {selectedImage && (
              <View style={styles.mediaPreviewBox}>
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeMediaBtn}><Ionicons name="close-circle" size={24} color="#EF4444" /></TouchableOpacity>
              </View>
            )}

            {selectedDoc && (
              <View style={styles.docPreviewBox}>
                <Ionicons name="document-attach" size={22} color={COLORS.primary} />
                <Text style={{ flex: 1, marginLeft: 10 }} numberOfLines={1}>{selectedDoc.name}</Text>
                <TouchableOpacity onPress={() => setSelectedDoc(null)}><Ionicons name="close" size={20} color={COLORS.subtext} /></TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.composerToolbar}>
            <Text style={styles.toolbarHint}>Add to your post</Text>
            <View style={styles.toolbarIcons}>
              <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage}><Ionicons name="image-outline" size={24} color={COLORS.primary} /></TouchableOpacity>
              <TouchableOpacity style={styles.toolbarBtn} onPress={pickDocument}><Ionicons name="document-text-outline" size={24} color="#F59E0B" /></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={activePostId !== null} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setActivePostId(null)}><Ionicons name="close" size={26} /></TouchableOpacity>
          </View>
          <FlatList
            data={activePost?.comments || []}
            keyExtractor={(item) => item.commentId.toString()}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image source={{ uri: item.user?.profileImageUrl || "https://via.placeholder.com/32" }} style={styles.commentAvatar} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{item.user?.fullName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ padding: 16 }}
          />
          <View style={[styles.commentInputArea, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput style={styles.commentInput} placeholder="Write a comment..." value={commentText} onChangeText={setCommentText} multiline />
            <TouchableOpacity onPress={handleComment} disabled={!commentText.trim()}><Ionicons name="send" size={24} color={commentText.trim() ? COLORS.primary : COLORS.subtext} /></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerWrapper: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', elevation: 8, zIndex: 100 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  circleIconBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  headerBody: { paddingLeft: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  listContainer: { padding: 16, paddingBottom: 100 },
  postCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  postAuthorName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  postTimeText: { fontSize: 12, color: COLORS.subtext },
  moreBtn: { padding: 4 },
  postBody: { marginBottom: 16 },
  postText: { fontSize: 15, color: "#334155", lineHeight: 22, marginBottom: 10 },
  postImage: { width: '100%', height: 220, borderRadius: 16, marginTop: 8, backgroundColor: '#F1F5F9' },
  documentPreview: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#F1F5F9', borderRadius: 12, marginTop: 10, gap: 12 },
  documentNameText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  documentSubText: { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  jobPreviewCard: { backgroundColor: COLORS.jobBg, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  jobTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  jobTypeText: { fontSize: 10, fontWeight: '800' },
  jobPreviewTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  viewJobBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewJobText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  engagementStats: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#F1F5F9', marginBottom: 8 },
  statIcons: { flexDirection: 'row', alignItems: 'center' },
  miniIconCircle: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  statSummaryText: { fontSize: 13, color: COLORS.subtext, fontWeight: '500', marginLeft: 8 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.subtext },
  reactionPicker: { position: 'absolute', bottom: 50, left: 0, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, padding: 8, gap: 10, elevation: 10 },
  pickerEmoji: { padding: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  postButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalUserArea: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  modalAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  modalUserName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  richInput: { padding: 16, fontSize: 18, color: COLORS.text, minHeight: 150, textAlignVertical: 'top' },
  mediaPreviewBox: { padding: 16, position: 'relative' },
  imagePreview: { width: '100%', height: 250, borderRadius: 16 },
  removeMediaBtn: { position: 'absolute', top: 24, right: 24 },
  docPreviewBox: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F1F5F9', margin: 16, borderRadius: 12 },
  composerToolbar: { borderTopWidth: 1, borderColor: '#F1F5F9', padding: 16, paddingBottom: 40 },
  toolbarHint: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  toolbarIcons: { flexDirection: 'row', gap: 20 },
  toolbarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBubble: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, padding: 12 },
  commentUser: { fontWeight: '700', fontSize: 13, marginBottom: 2 },
  commentText: { fontSize: 14, color: '#334155' },
  commentInputArea: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#F1F5F9' },
  commentInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, maxHeight: 100 }
});