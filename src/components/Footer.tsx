import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs"; // Import types for TabBar
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Import Safe Area

// Change props to accept BottomTabBarProps
export default function Footer({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets(); // Get safe area insets

  // Helper to determine active color
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
        <Ionicons
          name={getColor("Home") === "#2563EB" ? "home" : "home-outline"}
          size={24}
          color={getColor("Home")}
        />
        <Text style={[styles.label, { color: getColor("Home") }]}>Home</Text>
      </TouchableOpacity>

      {/* 2. Connections */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handlePress("Connections")}
      >
        <Ionicons
          name={
            getColor("Connections") === "#2563EB" ? "people" : "people-outline"
          }
          size={24}
          color={getColor("Connections")}
        />
        <Text style={[styles.label, { color: getColor("Connections") }]}>
          Network
        </Text>
      </TouchableOpacity>

      {/* 3. Community (Social) */}
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
    // Padding bottom is now handled dynamically via inline styles using 'insets'
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: "600",
  },
});
