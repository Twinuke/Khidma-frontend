import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** * If true (default), wraps content in a ScrollView.
   * Set to false for screens like Maps or flat lists that handle their own scrolling.
   */
  scrollable?: boolean;
  /**
   * Extra padding for the keyboard avoidance view.
   * Useful if you have a custom header or tab bar.
   */
  keyboardOffset?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  scrollable = true,
  keyboardOffset = 0,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={keyboardOffset}
      >
        {scrollable ? (
          <ScrollView
            style={[styles.container, style]}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, style]}>{children}</View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // Change this to match your app theme
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Adds breathing room at the bottom
  },
});
