import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { UserProvider, useUser } from './src/context/UserContext';
import { ChatProvider } from './src/context/ChatContext';
import SplashScreenComponent from './src/components/SplashScreen';

// --- Auth Screens ---
import Login from './src/pages/Login';
import PhoneNumberEntry from './src/pages/PhoneNumberEntry';
import EmailVerification from './src/pages/EmailVerification';
import RegistrationForm from './src/pages/RegistrationForm';

// --- App Screens ---
import Home from './src/pages/Home';
import Profile from './src/pages/Profile';
import Jobs from './src/pages/Jobs';
import JobDetails from './src/pages/JobDetails';
import CreateJob from './src/pages/CreateJob';
import MyJobs from './src/pages/MyJobs'; // Kept for legacy/freelancer usage if needed
import Bids from './src/pages/Bids';
import Messages from './src/pages/Messages';
import Settings from './src/pages/Settings';
import Notifications from './src/pages/Notifications';
import Search from './src/pages/Search';
import ChatScreen from './src/pages/ChatScreen';

// --- New Feature Screens (Social & Client Dashboard) ---
import SocialPage from './src/pages/SocialPage';
import ClientMyJobs from './src/pages/ClientMyJobs';
import ClientJobDetails from './src/pages/ClientJobDetails';

// Define the param list for TypeScript safety (Optional but good practice)
export type RootStackParamList = {
  PhoneNumberEntry: undefined;
  EmailVerification: { email: string; purpose?: 'register' | 'login' };
  RegistrationForm: { phoneNumber: string; email?: string };
  Login: { phoneNumber?: string; email?: string } | undefined;
  Home: undefined;
  Profile: undefined;
  Jobs: undefined;
  JobDetails: { jobId: number; jobData?: any; hasPlacedBid?: boolean };
  CreateJob: undefined;
  MyJobs: undefined;
  Bids: undefined;
  Messages: undefined;
  Settings: undefined;
  Notifications: undefined;
  Search: undefined;
  ChatScreen: { conversationId: number; otherUser: any };
  SocialPage: undefined;
  ClientMyJobs: undefined;
  ClientJobDetails: { jobId: number };
};

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

// 1. Define Auth Flow (Public)
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="RegistrationForm" component={RegistrationForm} />
    <AuthStack.Screen name="PhoneNumberEntry" component={PhoneNumberEntry} />
    <AuthStack.Screen name="EmailVerification" component={EmailVerification} />
  </AuthStack.Navigator>
);

// 2. Define App Flow (Protected)
const AppNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    {/* Main Tabs / Dashboard */}
    <AppStack.Screen name="Home" component={Home} />
    
    {/* Core Features */}
    <AppStack.Screen name="Profile" component={Profile} />
    <AppStack.Screen name="Jobs" component={Jobs} />
    <AppStack.Screen name="JobDetails" component={JobDetails} />
    <AppStack.Screen name="CreateJob" component={CreateJob} />
    <AppStack.Screen name="MyJobs" component={MyJobs} />
    <AppStack.Screen name="Bids" component={Bids} />
    <AppStack.Screen name="Messages" component={Messages} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="Notifications" component={Notifications} />
    <AppStack.Screen name="Settings" component={Settings} />
    <AppStack.Screen name="Search" component={Search} />

    {/* ✅ NEW Screens */}
    <AppStack.Screen name="SocialPage" component={SocialPage} />
    <AppStack.Screen name="ClientMyJobs" component={ClientMyJobs} />
    <AppStack.Screen name="ClientJobDetails" component={ClientJobDetails} />
  </AppStack.Navigator>
);

// 3. Main Navigation Logic
const NavigationWrapper = () => {
  const { isLoading, isAuthenticated } = useUser();

  // Hide the native splash screen once we know the auth state
  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </View>
  );
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <NavigationWrapper />
      </ChatProvider>
    </UserProvider>
  );
}