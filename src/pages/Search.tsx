import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RootStackParamList } from "../../App";

type SearchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Search"
>;

export default function Search() {
  const navigation = useNavigation<SearchScreenNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.placeholder}>
          Search page content will be added here
        </Text>
        <Text style={styles.subtitle}>
          Search for jobs, freelancers, and services
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
  },
});
