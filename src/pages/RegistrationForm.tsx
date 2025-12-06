import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useUser } from '../context/UserContext';

const mapUserTypeForApi = (value: 'Freelancer' | 'Client') => {
  return value === 'Client' ? 1 : 0;
};

export default function RegistrationForm() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { register } = useUser();

  // Get initial values from navigation params
  const initialPhone = route.params?.phoneNumber || '';
  const initialEmail = route.params?.email || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [profileBio, setProfileBio] = useState(''); // Restored Bio
  const [userType, setUserType] = useState<'Freelancer' | 'Client'>('Freelancer');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Email, Password, Phone).');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName,
        email,
        password,
        phoneNumber,
        profileBio, // Sending Bio to backend
        userType: mapUserTypeForApi(userType),
      };

      console.log("Registering with:", payload);
      await register(payload);
      // App.tsx handles navigation on auth state change
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable={true}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>Final step to join Khidma</Text>
        </View>

        {/* User Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeBtn, userType === 'Freelancer' && styles.typeBtnActive]}
            onPress={() => setUserType('Freelancer')}
          >
            <Text style={[styles.typeText, userType === 'Freelancer' && styles.typeTextActive]}>Freelancer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, userType === 'Client' && styles.typeBtnActive]}
            onPress={() => setUserType('Client')}
          >
            <Text style={[styles.typeText, userType === 'Client' && styles.typeTextActive]}>Client</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+961 00 000000"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Retype password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Bio (Optional)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell us about your skills..."
          value={profileBio}
          onChangeText={setProfileBio}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  header: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  
  typeSelector: { flexDirection: 'row', marginBottom: 24, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  typeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  typeText: { fontWeight: '600', color: '#64748B' },
  typeTextActive: { color: '#2563EB' },

  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  bioInput: { minHeight: 80 },

  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#2563EB', fontWeight: '600' },
});