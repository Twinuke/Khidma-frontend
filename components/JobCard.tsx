import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { Job } from "../src/types/job";

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  // Determine Category Icon & Color
  const getCategoryTheme = () => {
    const cat = (job.category || "").toLowerCase();
    if (cat.includes("dev")) return { icon: "code-slash", color: "#3B82F6", bg: "#EFF6FF" };
    if (cat.includes("design")) return { icon: "brush", color: "#EC4899", bg: "#FDF2F8" };
    if (cat.includes("market")) return { icon: "trending-up", color: "#8B5CF6", bg: "#F5F3FF" };
    return { icon: "briefcase", color: "#64748B", bg: "#F1F5F9" };
  };

  const theme = getCategoryTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.container}
      onPress={() => onPress(job)}
    >
      <View style={styles.contentContainer}>
        {/* Header: Icon + Title + Time */}
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
            <Ionicons name={theme.icon as any} size={20} color={theme.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.clientName}>
                {job.client?.fullName || "Verified Client"}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.timeText}>{formatTime(job.createdAt)}</Text>
            </View>
          </View>
          
          {/* Price Tag */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${Number(job.budget).toLocaleString()}</Text>
          </View>
        </View>

        {/* Description Snippet */}
        <Text style={styles.description} numberOfLines={2}>
          {job.description}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer: Badges + Action */}
        <View style={styles.footer}>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{job.experienceLevel}</Text>
            </View>
            {job.isRemote && (
              <View style={[styles.badge, styles.remoteBadge]}>
                <Ionicons name="globe-outline" size={10} color="#059669" style={{marginRight: 4}} />
                <Text style={styles.remoteText}>Remote</Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 16,
    // Modern Soft Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 1)", // Subtle border
  },
  contentContainer: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 4, letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  clientName: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#CBD5E1", marginHorizontal: 6 },
  timeText: { fontSize: 12, color: "#94A3B8" },
  
  priceTag: {
    backgroundColor: "#F0FDF4", // Light Green
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  priceText: { color: "#166534", fontWeight: "700", fontSize: 14 },

  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 16,
  },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginBottom: 16 },

  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badges: { flexDirection: "row", gap: 8 },
  badge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  remoteBadge: { backgroundColor: "#ECFDF5", borderColor: "#D1FAE5", flexDirection: "row", alignItems: "center" },
  remoteText: { fontSize: 12, color: "#059669", fontWeight: "600" },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  actionText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
});