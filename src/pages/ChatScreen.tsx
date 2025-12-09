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
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ✅ Import this
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useUser();
  const { connection, connectToChat } = useChat();
  const insets = useSafeAreaInsets(); // ✅ Get safe area insets

  // Params passed from navigation
  const { conversationId, otherUser } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!connection) connectToChat();
    fetchHistory();

    if (connection) {
      connection.invoke("JoinConversation", conversationId.toString());

      connection.on("ReceiveMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });

      return () => {
        connection.off("ReceiveMessage");
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
        parseInt(conversationId),
        user?.userId,
        text
      );
      setText("");
    } catch (e) {
      console.error(e);
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
          <Text style={styles.timeText}>
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
    // ✅ Replaced SafeAreaView with View + paddingTop to handle top inset manually
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser?.fullName || "Chat"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.messageId?.toString() + Math.random()}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ✅ Added dynamic paddingBottom to fix Android Nav Bar overlap */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? insets.bottom + 10
                  : Math.max(insets.bottom, 10),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
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
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  list: { padding: 16, paddingBottom: 20 },
  bubbleWrapper: { marginBottom: 12, flexDirection: "row" },
  myWrapper: { justifyContent: "flex-end" },
  otherWrapper: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: "#2563EB", borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: "#E2E8F0", borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16 },
  myText: { color: "#FFF" },
  otherText: { color: "#000" },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end", opacity: 0.7 },

  // Updated Input Container
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    // Padding bottom is now handled inline
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendBtn: { backgroundColor: "#2563EB", padding: 10, borderRadius: 20 },
});
