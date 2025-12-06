import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

// ✅ User Definition
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

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        // We don't need setAuthToken here because the interceptor in api.ts handles it
        const response = await api.get(`/Users/${userId}`);
        setUser(response.data);
      }
    } catch (error) {
      console.log('Session Load Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // ✅ Save to Storage (Interceptor will pick it up)
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', user.userId.toString());
      
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (payload: any) => {
    try {
      const response = await api.post('/auth/register', payload);
      
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userId', user.userId.toString());
        
        setUser(user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    setUser(null); // This triggers App.tsx to switch to Auth Stack automatically
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
        } catch (e) { console.log("Refresh failed", e); }
    }
  }

  return (
    <UserContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};