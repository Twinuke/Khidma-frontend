import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import api from '../config/api';

type EmailVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EmailVerification'
>;

type EmailVerificationRouteProp = {
  key: string;
  name: 'EmailVerification';
  params: {
    email: string;
    purpose?: 'register' | 'login';
  };
};

export default function EmailVerification() {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const { email, purpose = 'register' } = route.params || {};

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailInput, setEmailInput] = useState(email || '');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (email) {
      handleRequestOtp();
    }
  }, []);

  const handleRequestOtp = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/request-email-otp', {
        email: emailInput,
        purpose: purpose,
      });

      if (response.data.message) {
        // In development, show OTP in alert
        if (response.data.otp) {
          Alert.alert('OTP Sent', `Your OTP code is: ${response.data.otp}\n\n(This is shown only in development)`);
        } else {
          Alert.alert('OTP Sent', 'Please check your email for the verification code');
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    if (!emailInput) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email-otp', {
        email: emailInput,
        otp: otpCode,
      });

      if (response.data.message) {
        Alert.alert('Success', 'Email verified successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (purpose === 'register') {
                navigation.replace('RegistrationForm', { phoneNumber: '', email: emailInput });
              } else {
                navigation.replace('Login', { email: emailInput });
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || 'Invalid OTP code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.post('/auth/resend-email-otp', {
        email: emailInput,
      });

      if (response.data.message) {
        if (response.data.otp) {
          Alert.alert('OTP Resent', `Your new OTP code is: ${response.data.otp}\n\n(This is shown only in development)`);
        } else {
          Alert.alert('OTP Resent', 'A new verification code has been sent to your email');
        }
        setOtpCode(''); // Clear current OTP
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContent}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              {email ? `We sent a 6-digit code to ${email}` : 'Enter your email to receive a verification code'}
            </Text>

            {!email && (
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            )}

            {email && (
              <View style={styles.emailInfo}>
                <Text style={styles.emailInfoText}>{emailInput}</Text>
              </View>
            )}

            {!email && (
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            )}

            {email && (
              <>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#999"
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? (
                    <ActivityIndicator color="#007AFF" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  otpInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
    fontWeight: '600',
  },
  emailInfo: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  emailInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});


