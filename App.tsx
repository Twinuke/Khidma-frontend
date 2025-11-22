import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import SplashScreenComponent from './src/components/SplashScreen';
import Home from './src/pages/Home';
import Login from './src/pages/Login';
import PhoneNumberEntry from './src/pages/PhoneNumberEntry';
import RegistrationForm from './src/pages/RegistrationForm';
import EmailVerification from './src/pages/EmailVerification';
import Profile from './src/pages/Profile';
import Jobs from './src/pages/Jobs';
import JobDetails from './src/pages/JobDetails';
import CreateJob from './src/pages/CreateJob';
import MyJobs from './src/pages/MyJobs';
import Bids from './src/pages/Bids';
import Messages from './src/pages/Messages';
import Settings from './src/pages/Settings';
import Notifications from './src/pages/Notifications';
import Search from './src/pages/Search';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // load resources if needed
  }, []);

  const handleSplashFinish = () => {
    setIsReady(true);
  };

  if (!isReady) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="PhoneNumberEntry" screenOptions={{ headerShown: false }}>
        {/* Authentication Flow */}
        <Stack.Screen name="PhoneNumberEntry" component={PhoneNumberEntry} />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />
        <Stack.Screen name="RegistrationForm" component={RegistrationForm} />
        <Stack.Screen name="Login" component={Login} />
        
        {/* Main App Screens */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Jobs" component={Jobs} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="CreateJob" component={CreateJob} />
        <Stack.Screen name="MyJobs" component={MyJobs} />
        <Stack.Screen name="Bids" component={Bids} />
        <Stack.Screen name="Messages" component={Messages} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Search" component={Search} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
