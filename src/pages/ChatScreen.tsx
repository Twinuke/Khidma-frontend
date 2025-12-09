import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext"; // ✅ Ensure this import

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  // ✅ 1. Get 'refreshCounts' from UserContext instead
  const { user, refreshCounts } = useUser();

  const {
    connection,
    connectToChat,
    // refreshUnreadCount, // ❌ REMOVED: This no longer exists in ChatContext
    setActiveConversationId,
  } = useChat();

  const insets = useSafeAreaInsets();

  const { conversationId, otherUser: paramOtherUser } = route.params;
  const [otherUser, setOtherUser] = useState(paramOtherUser);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

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
      // Backend: Mark as read
      await api.put(`/Chat/read/${conversationId}/${user?.userId}`);

      // ✅ Frontend: Refresh Global Badge (UserContext)
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
      <View
        style={[
          styles.bubbleWrapper,
          isMe ? styles.myWrapper : styles.otherWrapper,
        ]}
      >
        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
        >
          <Text
            style={[styles.msgText, isMe ? styles.myText : styles.otherText]}
          >
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? { color: "#E2E8F0" } : null]}>
            {new Date(item.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser?.fullName || "Chat"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) =>
            item.messageId?.toString() || Math.random().toString()
          }
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToBottom}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  list: { padding: 16, paddingBottom: 20 },
  bubbleWrapper: { marginBottom: 12, flexDirection: "row" },
  myWrapper: { justifyContent: "flex-end" },
  otherWrapper: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: "#2563EB", borderBottomRightRadius: 2 },
  otherBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  msgText: { fontSize: 15, lineHeight: 22 },
  myText: { color: "#FFF" },
  otherText: { color: "#1E293B" },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
    opacity: 0.7,
    color: "#64748B",
  },
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: "#2563EB", padding: 10, borderRadius: 20 },
});
