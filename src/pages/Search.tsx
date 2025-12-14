import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../config/api";
import { useUser } from "../context/UserContext";
import { JobCard } from "../../components/JobCard";

export default function Search() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"foryou" | "browse">("foryou");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [activeTab, searchQuery]); // Re-fetch when tab changes or search typed

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "foryou" && !searchQuery) {
        // ✅ CALL AI ENDPOINT
        response = await api.get(`/AiJobs/recommended/${user?.userId || 0}`);
        setJobs(response.data);
      } else {
        // ✅ STANDARD SEARCH
        response = await api.get("/Jobs/search", { params: { query: searchQuery } });
        setJobs(response.data.data || []);
      }
    } catch (error) {
      console.log("Search error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Explore Jobs</Text>
      
      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput 
          style={styles.input} 
          placeholder="Search for jobs, skills..." 
          value={searchQuery}
          onChangeText={(t) => { setSearchQuery(t); setActiveTab("browse"); }} 
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "foryou" && styles.activeTab]} 
          onPress={() => { setActiveTab("foryou"); setSearchQuery(""); }}
        >
          <Ionicons name="sparkles" size={16} color={activeTab === "foryou" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "foryou" && styles.activeTabText]}>For You</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === "browse" && styles.activeTab]} 
          onPress={() => setActiveTab("browse")}
        >
          <Ionicons name="grid" size={16} color={activeTab === "browse" ? "#FFF" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "browse" && styles.activeTabText]}>Browse All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Job List with Header */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.jobId.toString()}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={() => navigation.navigate("JobDetails", { jobId: item.jobId })} 
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No jobs found.</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {loading && !refreshing && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A", marginBottom: 16 },
  
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: "#0F172A" },

  tabs: { flexDirection: "row", gap: 12 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  activeTab: { backgroundColor: "#0F172A" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "white" },

  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 10, color: "#94A3B8", fontSize: 16 },
  loader: { position: "absolute", bottom: 50, alignSelf: "center" }
});