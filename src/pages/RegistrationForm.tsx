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
import api, { setAuthToken } from '../config/api';

type RegistrationFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RegistrationForm'
>;

type RegistrationFormRouteProp = {
  key: string;
  name: 'RegistrationForm';
  params: {
    phoneNumber: string;
    email?: string;
  };
};

// Map UI value -> backend enum value
// Make sure this matches your C# enum:
// public enum UserType { Freelancer = 0, Client = 1 }
const mapUserTypeForApi = (value: 'Freelancer' | 'Client') => {
  switch (value) {
    case 'Freelancer':
      return 0;
    case 'Client':
      return 1;
    default:
      return 0;
  }
};

export default function RegistrationForm() {
  const navigation = useNavigation<RegistrationFormScreenNavigationProp>();
  const route = useRoute<RegistrationFormRouteProp>();
  const phoneNumber = route.params?.phoneNumber || '';
  const routeEmail = route.params?.email || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(routeEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'Freelancer' | 'Client'>('Freelancer');
  const [profileBio, setProfileBio] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleRegister = async () => {
    // Validation
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password,
        phoneNumber,
        userType: mapUserTypeForApi(userType), // 👈 FIX HERE
        profileBio: profileBio || undefined,
      });

      if (response.data?.token) {
        await setAuthToken(response.data.token);
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Home'),
          },
        ]);
      } else {
        Alert.alert('Error', 'Registration succeeded but no token returned.');
      }
    } catch (error: any) {
      console.log('REGISTER ERROR ====================');
      console.log('response data:', error?.response?.data);
      console.log('status:', error?.response?.status);
      console.log('full error:', JSON.stringify(error, null, 2));

      // Try to show backend validation message if exists
      const backendMessage =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        'Failed to create account. Please try again.';

      Alert.alert('Registration Failed', backendMessage);
    } finally {
      setLoading(false);
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContent}>
            <Text style={styles.title}>Complete Your Registration</Text>
            <Text style={styles.subtitle}>Fill in your details to create your account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />

            <View style={styles.phoneInfo}>
              <Text style={styles.phoneInfoLabel}>Verified Phone:</Text>
              <Text style={styles.phoneInfoText}>{phoneNumber}</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>I am a: *</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'Freelancer' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('Freelancer')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'Freelancer' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Freelancer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'Client' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('Client')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'Client' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Client
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Profile Bio (Optional)"
              placeholderTextColor="#999"
              value={profileBio}
              onChangeText={setProfileBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
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
  },
  innerContent: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
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
  bioInput: {
    minHeight: 100,
    paddingTop: 16,
  },
  phoneInfo: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  userTypeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userTypeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
