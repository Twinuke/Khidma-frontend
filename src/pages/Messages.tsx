import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // ✅ Import Gradient
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../config/api";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

export default function Messages() {
  const { user } = useUser();
  const { connection, onlineUsers } = useChat(); // ✅ Get onlineUsers
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchConversations();
    }, [user?.userId])
  );

  useEffect(() => {
    if (!connection) return;
    const handleMessage = () => {
      // Refresh silently to avoid UI refresh indicator
      fetchConversations(true);
    };
    connection.on("ReceiveMessage", handleMessage);
    return () => { connection.off("ReceiveMessage", handleMessage); };
  }, [connection]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get(`/Chat/my/${user?.userId}`);
      setConversations(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const openChat = (conversationId: number, otherUser: any) => {
    navigation.navigate("ChatScreen", { conversationId, otherUser });
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ✅ UNIFIED GRADIENT HEADER */}
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
              <Text style={styles.headerTitle}>Messages</Text>
              <View style={{ width: 40 }} /> 
            </View>
        </LinearGradient>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
            placeholder="Search conversations..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item: any) => item.conversationId.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={fetchConversations}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No messages yet</Text>
            </View>
        }
        renderItem={({ item }) => {
            // ✅ Check if this user is online
            const isOnline = onlineUsers.includes(item.otherUser.userId);

            return (
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => openChat(item.conversationId, item.otherUser)}
                    activeOpacity={0.7}
                >
                    {/* Avatar with Online Dot */}
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: item.otherUser.profileImageUrl || "https://via.placeholder.com/100" }} 
                            style={styles.avatar} 
                        />
                        {isOnline && <View style={styles.onlineDot} />}
                    </View>

                    <View style={styles.content}>
                        <View style={styles.rowTop}>
                            <Text style={styles.name}>{item.otherUser.fullName}</Text>
                            <Text style={styles.time}>
                                {new Date(item.lastMessage?.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>

                        <View style={styles.rowBottom}>
                            <Text
                            style={[
                                styles.msg,
                                item.unreadCount > 0 ? styles.msgUnread : null,
                            ]}
                            numberOfLines={1}
                            >
                            {item.lastMessage?.senderId === user?.userId ? "You: " : ""}
                            {item.lastMessage?.content || "Start chatting..."}
                            </Text>
                            
                            {item.unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                {item.unreadCount > 99 ? "99+" : item.unreadCount}
                                </Text>
                            </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Header
  headerShadow: {
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
    backgroundColor: "#0F172A"
  },
  headerGradient: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
      width: 40, height: 40,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  // Search
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#0F172A" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  item: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    marginBottom: 12,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#64748B", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9"
  },
  
  // Avatar & Status
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F1F5F9" },
  onlineDot: {
      position: 'absolute', bottom: 2, right: 2,
      width: 14, height: 14, borderRadius: 7,
      backgroundColor: "#22C55E", // Green
      borderWidth: 2, borderColor: "#FFF"
  },

  content: { flex: 1, justifyContent: 'center' },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  
  name: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  time: { fontSize: 12, color: "#94A3B8" },
  
  msg: { color: "#64748B", fontSize: 14, flex: 1, marginRight: 8 },
  msgUnread: { color: "#0F172A", fontWeight: "700" },

  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 22, height: 22,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },

  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { marginTop: 10, fontSize: 16, color: "#64748B", fontWeight: '600' }
});