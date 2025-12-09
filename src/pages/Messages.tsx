import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useChat } from "../context/ChatContext"; // ✅ Import ChatContext
import { useUser } from "../context/UserContext";

export default function Messages() {
  const { user } = useUser();
  const { connection } = useChat(); // ✅ Get the signalR connection
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (user) fetchConversations();
    }, [user])
  );

  // ✅ Real-time listener: Update list if a message comes in while viewing this screen
  useEffect(() => {
    if (!connection) return;

    const handleMessage = () => {
      // For simplicity, we just re-fetch to get updated counts and last messages
      fetchConversations();
    };

    connection.on("ReceiveMessage", handleMessage);

    return () => {
      connection.off("ReceiveMessage", handleMessage);
    };
  }, [connection]);

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/Chat/my/${user?.userId}`);
      setConversations(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const openChat = (conversationId: number, otherUser: any) => {
    navigation.navigate("ChatScreen", { conversationId, otherUser });
  };

  // Filter local search results
  const filteredConversations = conversations.filter((c) =>
    c.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Standardized Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Search users..."
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item: any) => item.conversationId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => openChat(item.conversationId, item.otherUser)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.otherUser.fullName[0]}
              </Text>
            </View>
            <View style={styles.content}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.otherUser.fullName}</Text>
              </View>

              <View style={styles.rowBottom}>
                <Text
                  style={[
                    styles.msg,
                    // Highlight text if unread
                    item.unreadCount > 0 && styles.msgUnread,
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage?.content || "Start chatting..."}
                </Text>
              </View>
            </View>

            {/* ✅ NOTIFICATION BADGE */}
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#CBD5E1"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        )}
      />
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
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerTitle: {
    flex: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  headerRight: { flex: 1, alignItems: "flex-end" },
  iconBtn: { padding: 4 },
  searchBox: {
    flexDirection: "row",
    margin: 16,
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
    alignItems: "center",
  },
  input: { flex: 1, marginLeft: 10 },
  item: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#2563EB" },
  content: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  rowBottom: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  msg: { color: "#64748B", fontSize: 14 },
  msgUnread: { color: "#0F172A", fontWeight: "600" }, // Darker text for unread msgs

  // ✅ Badge Styles
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
});
