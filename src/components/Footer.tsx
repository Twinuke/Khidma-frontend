import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../context/UserContext"; // ✅ Import UserContext

export default function Footer({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadNotifications, pendingRequests } = useUser(); // ✅ Use global counts

  const getColor = (pageName: string) => {
    const activeRouteName = state.routes[state.index].name;
    return activeRouteName === pageName ? "#2563EB" : "#94A3B8";
  };

  const handlePress = (routeName: string) => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeName,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderBadge = (count: number) => {
    if (count <= 0) return null;
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Platform.OS === "android"
              ? insets.bottom
              : Platform.OS === "ios"
              ? 24
              : 12,
        },
      ]}
    >
      {/* 1. Home */}
      <TouchableOpacity style={styles.tab} onPress={() => handlePress("Home")}>
        <View>
          <Ionicons
            name={getColor("Home") === "#2563EB" ? "home" : "home-outline"}
            size={24}
            color={getColor("Home")}
          />
          {/* Show badge if unread notifications exist (General Alert) */}
          {renderBadge(unreadNotifications)}
        </View>
        <Text style={[styles.label, { color: getColor("Home") }]}>Home</Text>
      </TouchableOpacity>

      {/* 2. Connections */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handlePress("Connections")}
      >
        <View>
          <Ionicons
            name={
              getColor("Connections") === "#2563EB"
                ? "people"
                : "people-outline"
            }
            size={24}
            color={getColor("Connections")}
          />
          {/* Show badge for pending requests */}
          {renderBadge(pendingRequests)}
        </View>
        <Text style={[styles.label, { color: getColor("Connections") }]}>
          Network
        </Text>
      </TouchableOpacity>

      {/* 3. Community */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handlePress("SocialPage")}
      >
        <Ionicons
          name={
            getColor("SocialPage") === "#2563EB" ? "earth" : "earth-outline"
          }
          size={24}
          color={getColor("SocialPage")}
        />
        <Text style={[styles.label, { color: getColor("SocialPage") }]}>
          Community
        </Text>
      </TouchableOpacity>

      {/* 4. Chat */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handlePress("Messages")}
      >
        <Ionicons
          name={
            getColor("Messages") === "#2563EB"
              ? "chatbubbles"
              : "chatbubbles-outline"
          }
          size={24}
          color={getColor("Messages")}
        />
        <Text style={[styles.label, { color: getColor("Messages") }]}>
          Chat
        </Text>
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handlePress("Profile")}
      >
        <Ionicons
          name={getColor("Profile") === "#2563EB" ? "person" : "person-outline"}
          size={24}
          color={getColor("Profile")}
        />
        <Text style={[styles.label, { color: getColor("Profile") }]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: { alignItems: "center", justifyContent: "center", flex: 1 },
  label: { fontSize: 9, marginTop: 4, fontWeight: "600" },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { color: "#FFF", fontSize: 9, fontWeight: "bold" },
});
