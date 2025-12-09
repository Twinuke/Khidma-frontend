import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";

export default function Messages() {
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (user) fetchConversations();
    }, [user])
  );

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
        data={conversations}
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
              <Text style={styles.name}>{item.otherUser.fullName}</Text>
              <Text style={styles.msg} numberOfLines={1}>
                {item.lastMessage?.content || "Start chatting..."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // ✅ Standardized Header Styles
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
  name: { fontSize: 16, fontWeight: "600" },
  msg: { color: "#64748B", marginTop: 2 },
});
