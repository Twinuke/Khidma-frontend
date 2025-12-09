import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../config/api";

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
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // ✅ New Badge Counts
  unreadNotifications: number;
  pendingRequests: number;
  refreshCounts: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userId = await AsyncStorage.getItem("userId");

      if (token && userId) {
        const response = await api.get(`/Users/${userId}`);
        setUser(response.data);
        fetchBadges(userId); // Fetch counts immediately
      }
    } catch (error) {
      console.log("Session Load Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Global Fetch for Badges
  const fetchBadges = async (userId: string | number) => {
    try {
      // 1. Notifications
      const notifRes = await api.get(`/Notifications/user/${userId}`);
      const unread = notifRes.data.filter((n: any) => !n.isRead).length;
      setUnreadNotifications(unread);

      // 2. Pending Requests
      const reqRes = await api.get(`/Social/requests/${userId}`);
      setPendingRequests(reqRes.data.length);
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
      setUser(user);
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
        setUser(user);
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
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      const payload = { ...user, ...updatedData };
      await api.put(`/Users/${user.userId}`, payload);
      setUser(payload);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    if (user?.userId) {
      try {
        const response = await api.get(`/Users/${user.userId}`);
        setUser(response.data);
        fetchBadges(user.userId); // Also refresh badges
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
