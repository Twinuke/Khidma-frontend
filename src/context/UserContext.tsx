import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../config/api";

// ✅ FIX: Added missing professional fields to match Backend
export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profileBio?: string;
  profileImageUrl?: string;
  city?: string;
  userType?: number;
  balance?: number;
  latitude?: number;
  longitude?: number;
  
  // ✅ ADDED THIS: Fixes the TypeScript error in Profile.tsx
  createdAt?: string; 

  // Professional Fields
  jobTitle?: string;
  hourlyRate?: number;
  isAvailable?: boolean;
  languages?: string;
  socialLinks?: string;
  cvUrl?: string;
  linkedinUrl?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Badge Counts
  unreadNotifications: number;
  pendingRequests: number;
  unreadChatCount: number;
  refreshCounts: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const processUserImage = (userData: User) => {
  if (
    userData &&
    userData.profileImageUrl &&
    typeof userData.profileImageUrl === "string" &&
    userData.profileImageUrl.startsWith("http")
  ) {
    return {
      ...userData,
      profileImageUrl: `${userData.profileImageUrl}?t=${new Date().getTime()}`,
    };
  }
  return userData;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Badge States
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");

      if (token && userId) {
        const response = await api.get(`/Users/${userId}`);
        setUser(processUserImage(response.data));
        fetchBadges(userId);
      }
    } catch (error) {
      console.log("Session Load Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBadges = async (userId: string | number) => {
    try {
      const notifRes = await api.get(`/Notifications/user/${userId}`);
      const unread = notifRes.data.filter((n: any) => !n.isRead).length;
      setUnreadNotifications(unread);

      const reqRes = await api.get(`/Social/requests/${userId}`);
      setPendingRequests(reqRes.data.length);

      const chatRes = await api.get(`/Chat/my/${userId}`);
      const totalChats = chatRes.data.reduce((sum: number, chat: any) => {
        return sum + (chat.unreadCount || 0);
      }, 0);
      setUnreadChatCount(totalChats);
    } catch (e) {
      console.log("Badge fetch error", e);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userId", user.userId.toString());
      setUser(processUserImage(user));
      fetchBadges(user.userId);
    } catch (error) {
      throw error;
    }
  };

  const register = async (payload: any) => {
    try {
      const response = await api.post("/auth/register", payload);
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userId", user.userId.toString());
        setUser(processUserImage(user));
        fetchBadges(user.userId);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userId");
    setUser(null);
    setUnreadNotifications(0);
    setPendingRequests(0);
    setUnreadChatCount(0);
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      // 1. Send update to server
      const payload = { ...user, ...updatedData };
      await api.put(`/Users/${user.userId}`, payload);

      // 2. Fetch the latest profile from server to ensure we have the correct Image URL
      await refreshUser();
    } catch (error) {
      console.error("Update User Error", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (user?.userId) {
      try {
        const response = await api.get(`/Users/${user.userId}`);
        setUser(processUserImage(response.data));
        fetchBadges(user.userId);
      } catch (e) {
        console.log("Refresh failed", e);
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        unreadNotifications,
        pendingRequests,
        unreadChatCount,
        refreshCounts: () => fetchBadges(user?.userId || 0),
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};