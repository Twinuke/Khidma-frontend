import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react'; // Added useCallback
import { View } from 'react-native'; // Added View

import SplashScreenComponent from './src/components/SplashScreen';
import { UserProvider, useUser } from './src/context/UserContext';

// --- Auth Screens ---
import EmailVerification from './src/pages/EmailVerification';
import Login from './src/pages/Login';
import PhoneNumberEntry from './src/pages/PhoneNumberEntry';
import RegistrationForm from './src/pages/RegistrationForm';

// --- App Screens ---
import { ChatProvider } from './src/context/ChatContext';
import Bids from './src/pages/Bids';
import ChatScreen from './src/pages/ChatScreen';
import CreateJob from './src/pages/CreateJob';
import Home from './src/pages/Home';
import JobBids from './src/pages/JobBids';
import JobDetails from './src/pages/JobDetails';
import Jobs from './src/pages/Jobs';
import Messages from './src/pages/Messages';
import MyJobs from './src/pages/MyJobs';
import Notifications from './src/pages/Notifications';
import Profile from './src/pages/Profile';
import Search from './src/pages/Search';
import Settings from './src/pages/Settings';

export type RootStackParamList = {
  PhoneNumberEntry: undefined;
  EmailVerification: { email: string; purpose?: 'register' | 'login' };
  RegistrationForm: { phoneNumber: string; email?: string };
  Login: { phoneNumber?: string; email?: string } | undefined;
  Home: undefined;
  Profile: undefined;
  Jobs: undefined;
  JobDetails: { jobId: number };
  CreateJob: undefined;
  MyJobs: undefined;
  Bids: undefined;
  Messages: undefined;
  Settings: undefined;
  Notifications: undefined;
  Search: undefined;
  JobBids: { jobId: number; jobTitle?: string };
};

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

// 1. Define Auth Flow
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
    <AppStack.Screen name="Home" component={Home} />
    <AppStack.Screen name="Profile" component={Profile} />
    <AppStack.Screen name="Jobs" component={Jobs} />
    <AppStack.Screen name="JobDetails" component={JobDetails} />
    <AppStack.Screen name="CreateJob" component={CreateJob} />
    <AppStack.Screen name="MyJobs" component={MyJobs} />
    <AppStack.Screen name="Bids" component={Bids} />
    <AppStack.Screen name="Messages" component={Messages} />
    <AppStack.Screen name="Settings" component={Settings} />
    <AppStack.Screen name="Notifications" component={Notifications} />
    <AppStack.Screen name="Search" component={Search} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="JobBids" component={JobBids} />
  </AppStack.Navigator>
);

// 3. Main Navigation Logic
const NavigationWrapper = () => {
  const { isLoading, isAuthenticated } = useUser();

  // --- FIX: Hide Native Splash Screen when loading is done ---
  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      // This tells the native app "We are ready, hide the logo"
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    // While checking token, show your custom splash component
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    // We attach onLayout here to ensure we hide the splash only after UI is ready to render
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