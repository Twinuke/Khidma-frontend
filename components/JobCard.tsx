import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { MiniProfileSheet } from "../src/components/MiniProfileSheet";

export const JobCard = ({ job, onPress }: any) => {
  const [sheetVisible, setSheetVisible] = useState(false);

  const getTimeAgo = (date: string) => {
    if (!date) return "Just now";
    const now = new Date();
    const posted = new Date(date);
    const diff = Math.floor((now.getTime() - posted.getTime()) / 1000 / 60 / 60);
    if (diff < 1) return "Just now";
    if (diff < 24) return `${diff}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.card} 
        // ✅ FIX: Explicitly ignore the 'event' and pass 'job' (or nothing)
        // This prevents the "Synthetic Event" crash.
        onPress={() => onPress && onPress(job)}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.clientInfo} 
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.7}
          >
            <Image 
                source={{ 
                    uri: job.clientAvatar || `https://ui-avatars.com/api/?name=${job.clientName || 'Client'}` 
                }} 
                style={styles.avatar} 
            />
            <View>
              <Text style={styles.clientName} numberOfLines={1}>{job.clientName || "Unknown Client"}</Text>
              <Text style={styles.time}>{getTimeAgo(job.createdAt)}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>${job.budget}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.description} numberOfLines={3}>{job.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
                <Ionicons name="briefcase-outline" size={12} color="#64748B" />
                <Text style={styles.tagText}>{job.category || "General"}</Text>
            </View>
            <View style={styles.tag}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.tagText}>{job.location || "Remote"}</Text>
            </View>
          </View>
          
          <View style={styles.bidsInfo}>
             <Ionicons name="people-outline" size={14} color="#94A3B8" />
             <Text style={styles.bidsText}>{job.bidsCount || 0} bids</Text>
          </View>
        </View>
      </TouchableOpacity>

      <MiniProfileSheet
        visible={sheetVisible}
        userId={job.clientId} 
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  time: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "500",
  },
  bidsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  bidsText: {
      fontSize: 12,
      color: "#94A3B8",
      fontWeight: '500'
  }
});