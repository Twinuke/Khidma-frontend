import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenWrapper } from "../components/ScreenWrapper";
import api from "../config/api";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function VerifyResetPassword() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // Extract token from route params (deep link query param)
  const token: string | undefined = route.params?.token;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const verify = async () => {
    if (!token) {
      setLoading(false);
      setErrorMsg("Missing token. Please use the link from your email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.get("/auth/password-reset/verify", { params: { token } });
      navigation.reset({
        index: 0,
        routes: [{ name: "ChangePassword", params: { token } }],
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Verification failed. The link may have expired.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verify();
    } else {
      setLoading(false);
      setErrorMsg("Missing token. Please use the link from your email.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ScreenWrapper scrollable={true}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Verifying</Text>
          <Text style={styles.subtitle}>
            Please wait while we verify your request
          </Text>
        </View>

        <View style={styles.form}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.helpText}>Verifying link…</Text>
            </View>
          ) : errorMsg ? (
            <>
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={verify}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.helpText}>Verified.</Text>
            </>
          )}
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, justifyContent: "center" },
  headerContainer: { marginBottom: 32, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "#64748B", textAlign: "center" },
  form: { width: "100%" },
  center: { alignItems: "center" },
  helpText: { marginTop: 12, color: "#64748B", fontWeight: "600" },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { color: "#991B1B", fontWeight: "600" },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: { alignSelf: "center", marginTop: 24 },
  backText: { color: "#2563EB", fontWeight: "600" },
});


