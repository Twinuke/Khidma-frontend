import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { MiniProfileSheet } from "../components/MiniProfileSheet";

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { user, refreshCounts } = useUser();
  const { connection, connectToChat, setActiveConversationId } = useChat();

  const { conversationId, otherUser: paramOtherUser } = route.params;
  const [otherUser, setOtherUser] = useState(paramOtherUser);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [miniProfileVisible, setMiniProfileVisible] = useState(false);

  // ✅ Mark messages as read when entering screen
  useEffect(() => {
    if (conversationId && user?.userId) {
      markAsRead();
      setActiveConversationId(conversationId);
    }
    return () => {
      setActiveConversationId(null);
    };
  }, [conversationId, user?.userId]);

  const markAsRead = async () => {
    try {
      await api.put(`/Chat/read/${conversationId}/${user?.userId}`);
      refreshCounts();
    } catch (e) {
      console.log("Error marking read:", e);
    }
  };

  useEffect(() => {
    if (!otherUser && conversationId) {
      fetchConversationDetails();
    }
  }, [conversationId]);

  const fetchConversationDetails = async () => {
    try {
      const res = await api.get(`/Chat/${conversationId}`);
      const conv = res.data;
      const friend = conv.user1Id === user?.userId ? conv.user2 : conv.user1;
      setOtherUser(friend);
    } catch (e) {
      console.log("Error fetching conversation details:", e);
    }
  };

  useEffect(() => {
    if (!connection) connectToChat();
    fetchHistory();

    if (connection) {
      connection
        .invoke("JoinConversation", conversationId.toString())
        .catch((err) => console.error("Join Conversation Error:", err));

      const handleReceiveMessage = (msg: any) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      };

      connection.on("ReceiveMessage", handleReceiveMessage);

      return () => {
        connection.off("ReceiveMessage", handleReceiveMessage);
      };
    }
  }, [connection, conversationId]);

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/Chat/${conversationId}/messages`);
      setMessages(response.data);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !connection) return;
    try {
      await connection.invoke(
        "SendMessage",
        Number(conversationId),
        user?.userId,
        text
      );
      setText("");
    } catch (e) {
      console.error("Send Error:", e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.userId;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.otherWrapper]}>
        {!isMe && (
           <TouchableOpacity 
              onPress={() => otherUser?.userId && setMiniProfileVisible(true)}
              activeOpacity={0.7}
           >
             <Image 
                source={{ uri: otherUser?.profileImageUrl || "https://via.placeholder.com/40" }} 
                style={styles.messageAvatar} 
             />
           </TouchableOpacity>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.msgText, isMe ? styles.myText : styles.otherText]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? { color: "rgba(255,255,255,0.7)" } : { color: "#94A3B8" }]}>
            {new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ✅ 1. Consistent Gradient Header */}
      <View style={styles.headerShadow}>
        <LinearGradient
            colors={["#0F172A", "#1E293B", "#334155"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
        >
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.userInfo}
                    onPress={() => otherUser?.userId && setMiniProfileVisible(true)}
                    activeOpacity={0.7}
                >
                    <Image 
                        source={{ uri: otherUser?.profileImageUrl || "https://via.placeholder.com/100" }} 
                        style={styles.headerAvatar} 
                    />
                    <View>
                        <Text style={styles.headerTitle}>{otherUser?.fullName || "Chat"}</Text>
                        <Text style={styles.headerStatus}>{otherUser?.jobTitle || "Online"}</Text>
                    </View>
                </TouchableOpacity>

                {/* Optional: Add a call button or menu later */}
                <View style={{ width: 40 }} /> 
            </View>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loadingHistory ? (
           <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color="#2563EB" />
           </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.messageId?.toString() || Math.random().toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* ✅ 2. Modern Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={!text.trim()}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Mini Profile Sheet */}
      <MiniProfileSheet
        visible={miniProfileVisible}
        userId={otherUser?.userId || null}
        onClose={() => setMiniProfileVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Header Styles (Matching JobDetails/Profile)
  headerShadow: {
      borderBottomLeftRadius: 24, 
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
      backgroundColor: "#0F172A"
  },
  headerGradient: {
      paddingHorizontal: 16,
      paddingBottom: 20,
  },
  headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  backBtn: {
      width: 40, height: 40,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20
  },
  userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginLeft: 12
  },
  headerAvatar: {
      width: 44, height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
      marginRight: 10
  },
  headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF'
  },
  headerStatus: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2
  },

  // List & Bubble Styles
  list: { padding: 16, paddingBottom: 20 },
  bubbleWrapper: { marginBottom: 12, flexDirection: "row", alignItems: 'flex-end' },
  myWrapper: { justifyContent: "flex-end" },
  otherWrapper: { justifyContent: "flex-start" },
  messageAvatar: {
      width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 2,
      backgroundColor: '#CBD5E1'
  },
  bubble: { maxWidth: "75%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: "#FFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E2E8F0" },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  myText: { color: "#FFF" },
  otherText: { color: "#1E293B" },
  
  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },

  // Input Styles
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 15,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sendBtn: {
      width: 44, height: 44,
      backgroundColor: "#2563EB",
      borderRadius: 22,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: "#2563EB",
      shadowOpacity: 0.3,
      shadowOffset: {width: 0, height: 2},
      elevation: 4
  },
});