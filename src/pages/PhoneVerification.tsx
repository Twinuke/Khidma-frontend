import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CountryCode, isValidPhoneNumber } from 'libphonenumber-js';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackParamList } from '../../App';
import api from '../config/api';

type PhoneVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PhoneVerification'
>;

interface Country {
  name: string;
  code: CountryCode;
  dialCode: string;
}

const countries: Country[] = [
  { name: 'Lebanon', code: 'LB', dialCode: '+961' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'UAE', code: 'AE', dialCode: '+971' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'Jordan', code: 'JO', dialCode: '+962' },
  { name: 'Syria', code: 'SY', dialCode: '+963' },
];

export default function PhoneVerification() {
  const navigation = useNavigation<PhoneVerificationScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Lebanon default
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');

  // Animations
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

  // Format phone number for Lebanon
  const formatPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');

    if (selectedCountry.code === 'LB' && digits.length > 0) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
    }

    return digits;
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`;

    try {
      const isValid = isValidPhoneNumber(fullPhoneNumber, selectedCountry.code);
      if (!isValid) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
    } catch {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-phone', {
        phoneNumber: fullPhoneNumber,
      });

      if (response.data.message) {
        setVerifiedPhoneNumber(fullPhoneNumber);
        setStep('otp');
        // In development, show OTP in alert
        if (response.data.otp) {
          Alert.alert('OTP Sent', `Your OTP code is: ${response.data.otp}\n\n(This is shown only in development)`);
        } else {
          Alert.alert('OTP Sent', 'Please check your phone for the verification code');
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

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/confirm-otp', {
        phoneNumber: verifiedPhoneNumber,
        otp: otpCode,
      });

      if (response.data.message) {
        Alert.alert('Success', 'Phone number verified successfully!');
        // Navigate to registration form with verified phone number
        navigation.replace('RegistrationForm', { phoneNumber: verifiedPhoneNumber });
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

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setIsCountryPickerVisible(false);
      }}
    >
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDialCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContent}>
            <Text style={styles.title}>
              {step === 'phone' ? 'Verify Your Phone Number' : 'Enter Verification Code'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Enter your phone number to receive a verification code'
                : `We sent a 6-digit code to ${verifiedPhoneNumber}`}
            </Text>

            {step === 'phone' ? (
              <>
                <View style={styles.phoneContainer}>
                  {/* Country Dropdown */}
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => setIsCountryPickerVisible(true)}
                  >
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {/* Phone Number Input */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone number"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={15}
                    editable={!loading}
                  />
                </View>

                <View style={styles.countryInfo}>
                  <Text style={styles.countryInfoText}>
                    Selected: {selectedCountry.name} {selectedCountry.dialCode}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
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
                  style={styles.backButton}
                  onPress={() => {
                    setStep('phone');
                    setOtpCode('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {/* Country Picker Modal */}
        <Modal
          visible={isCountryPickerVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCountryPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <TouchableOpacity
                  onPress={() => setIsCountryPickerVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={countries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                style={styles.countryList}
              />
            </View>
          </View>
        </Modal>
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
    marginBottom: 40,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
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
  countryInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  countryInfoText: {
    fontSize: 14,
    color: '#666',
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
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: {
    fontSize: 16,
    color: '#333',
  },
  countryDialCode: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

