import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
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
          // ✅ Removed TouchableWithoutFeedback to fix scrolling bug
          <View style={[styles.container, style]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
