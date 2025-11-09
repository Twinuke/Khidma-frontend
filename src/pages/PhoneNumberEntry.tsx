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
} from 'react-native';
import { RootStackParamList } from '../../App';

type PhoneNumberEntryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PhoneNumberEntry'
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

export default function PhoneNumberEntry() {
  const navigation = useNavigation<PhoneNumberEntryScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Lebanon default
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // ✅ Lebanon: XX XXX XXX
  const formatPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');

    if (selectedCountry.code === 'LB' && digits.length > 0) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
    }

    return digits;
  };

  const handleContinue = async () => {
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
      // Navigate directly to registration form with phone number
      navigation.replace('RegistrationForm', { phoneNumber: fullPhoneNumber });
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
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>Enter Your Phone Number</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>

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
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Continue'}</Text>
          </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40, textAlign: 'center' },
  phoneContainer: { flexDirection: 'row', marginBottom: 16, gap: 12 },
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
  countryCode: { fontSize: 16, fontWeight: '600', color: '#333', marginRight: 8 },
  dropdownArrow: { fontSize: 10, color: '#666' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryInfo: { marginBottom: 24, alignItems: 'center' },
  countryInfoText: { fontSize: 14, color: '#666' },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 24, color: '#666' },
  countryList: { maxHeight: 400 },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryName: { fontSize: 16, color: '#333' },
  countryDialCode: { fontSize: 16, color: '#666', fontWeight: '500' },
});
