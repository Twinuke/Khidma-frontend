import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { View } from "react-native";

import Footer from "./src/components/Footer"; 
import SplashScreenComponent from "./src/components/SplashScreen";
import { ChatProvider } from "./src/context/ChatContext";
import { UserProvider, useUser } from "./src/context/UserContext";

// --- Auth Screens ---
import EmailVerification from "./src/pages/EmailVerification";
import Login from "./src/pages/Login";
import PhoneNumberEntry from "./src/pages/PhoneNumberEntry";
import RegistrationForm from "./src/pages/RegistrationForm";

// --- App Screens ---
import Bids from "./src/pages/Bids";
import ChatScreen from "./src/pages/ChatScreen";
import CreateJob from "./src/pages/CreateJob";
import Home from "./src/pages/Home";
import JobDetails from "./src/pages/JobDetails";
import Jobs from "./src/pages/Jobs";
import Messages from "./src/pages/Messages";
import MyJobs from "./src/pages/MyJobs";
import Notifications from "./src/pages/Notifications";
import Profile from "./src/pages/Profile";
import Search from "./src/pages/Search";
import Settings from "./src/pages/Settings";
import OnboardingScreen from "./src/pages/OnboardingScreen"; 

// --- New Feature Screens ---
import ClientJobDetails from "./src/pages/ClientJobDetails";
import ClientMyJobs from "./src/pages/ClientMyJobs";
import Connections from "./src/pages/Connections";
import SocialPage from "./src/pages/SocialPage";

export type RootStackParamList = {
  PhoneNumberEntry: undefined;
  EmailVerification: { email: string; purpose?: "register" | "login" };
  RegistrationForm: { phoneNumber: string; email?: string };
  Login: { phoneNumber?: string; email?: string } | undefined;
  MainTabs: undefined; 
  Home: undefined; 
  Profile: undefined;
  
  // ✅ ADDED THIS: The route for viewing other profiles
  UserProfile: { userId: number }; 

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
  Connections: undefined;
  OnboardingScreen: undefined; 
};

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// 1. Define Auth Flow (Public)
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="Login"
  >
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="RegistrationForm" component={RegistrationForm} />
    <AuthStack.Screen name="PhoneNumberEntry" component={PhoneNumberEntry} />
    <AuthStack.Screen name="EmailVerification" component={EmailVerification} />
  </AuthStack.Navigator>
);

// 2. Define Tab Navigator (The persistent footer)
const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <Footer {...props} />} 
    screenOptions={{ headerShown: false }}
    initialRouteName="Home"
  >
    <Tab.Screen name="Home" component={Home} />
    <Tab.Screen name="Connections" component={Connections} />
    <Tab.Screen name="SocialPage" component={SocialPage} />
    <Tab.Screen name="Messages" component={Messages} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

// 3. Define App Flow (Protected)
const AppNavigator = () => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="MainTabs" component={MainTabs} />
    <AppStack.Screen name="OnboardingScreen" component={OnboardingScreen} />

    {/* ✅ ADDED THIS: Register the UserProfile screen */}
    <AppStack.Screen name="UserProfile" component={Profile} />

    <AppStack.Screen name="Jobs" component={Jobs} />
    <AppStack.Screen name="JobDetails" component={JobDetails} />
    <AppStack.Screen name="CreateJob" component={CreateJob} />
    <AppStack.Screen name="MyJobs" component={MyJobs} />
    <AppStack.Screen name="Bids" component={Bids} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="Notifications" component={Notifications} />
    <AppStack.Screen name="Settings" component={Settings} />
    <AppStack.Screen name="Search" component={Search} />
    <AppStack.Screen name="ClientMyJobs" component={ClientMyJobs} />
    <AppStack.Screen name="ClientJobDetails" component={ClientJobDetails} />
  </AppStack.Navigator>
);

const NavigationWrapper = () => {
  const { isLoading, isAuthenticated } = useUser();

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