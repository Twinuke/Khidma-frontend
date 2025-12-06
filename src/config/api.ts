import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ MAKE SURE THIS IP IS CORRECT (Your PC's IP)
const SERVER_URL = "http://192.168.1.104:5257"; 

export const API_BASE_URL = `${SERVER_URL}/api`;
export const HUB_URL = `${SERVER_URL}/chatHub`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ This interceptor automatically adds the token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;