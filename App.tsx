import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import Login from './src/pages/Login';
import Home from './src/pages/Home';
import PhoneNumberEntry from './src/pages/PhoneNumberEntry';
import SplashScreenComponent from './src/components/SplashScreen';

export type RootStackParamList = {
  PhoneNumberEntry: undefined;
  Login: { phoneNumber?: string } | undefined;
  Home: undefined;
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
        <Stack.Screen name="PhoneNumberEntry" component={PhoneNumberEntry} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
