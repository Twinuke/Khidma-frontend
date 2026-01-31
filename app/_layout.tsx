import React, { useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ChatProvider } from "../src/context/ChatContext";
import { UserProvider } from "../src/context/UserContext";

// ✅ Import the custom animated splash screen component
import SplashScreenComponent from "../src/components/SplashScreen";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // ✅ State to track if the splash screen animation is finished
  const [appIsReady, setAppIsReady] = useState(false);

  // ✅ Show the animated splash screen until onFinish is called
  if (!appIsReady) {
    return (
      <SplashScreenComponent onFinish={() => setAppIsReady(true)} />
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <ChatProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
        </ChatProvider>
      </UserProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}