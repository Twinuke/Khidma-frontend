import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
  Modal,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CONFIGURATION ---
const API_BASE_URL = "http://192.168.1.103:5257/api"; 

const { width } = Dimensions.get('window');

// --- LEBANON CITIES DATA ---
const LEBANESE_CITIES: Record<string, { lat: number; lng: number }> = {
  'Beirut': { lat: 33.8938, lng: 35.5018 },
  'Tripoli': { lat: 34.4367, lng: 35.8497 },
  'Sidon (Saida)': { lat: 33.5571, lng: 35.3729 },
  'Tyre (Sour)': { lat: 33.2705, lng: 35.1969 },
  'Jounieh': { lat: 33.9697, lng: 35.6156 },
  'Byblos (Jbeil)': { lat: 34.1230, lng: 35.6519 },
  'Zahle': { lat: 33.8463, lng: 35.9020 },
  'Baalbek': { lat: 34.0058, lng: 36.2181 },
  'Batroun': { lat: 34.2496, lng: 35.6643 },
  'Aley': { lat: 33.8066, lng: 35.5960 },
  'Nabatieh': { lat: 33.3772, lng: 35.4833 },
  'Zgharta': { lat: 34.3980, lng: 35.8940 },
};

const CITY_KEYS = Object.keys(LEBANESE_CITIES);

// --- TYPES ---
interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profileBio?: string;
  profileImageUrl?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  userType?: number; 
}

export default function Profile() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null); 
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null); 
  
  // Location State
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isLocationFixed, setIsLocationFixed] = useState(false); 
  const [region, setRegion] = useState({
    latitude: 33.8938, 
    longitude: 35.5018,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  // UI State
  const [modalVisible, setModalVisible] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const currentUserId = 1; // TODO: Get dynamically
      
      const token = await AsyncStorage.getItem('authToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.get(`${API_BASE_URL}/Users/${currentUserId}`, config);
      
      const data: UserProfile = response.data;
      setUserData(data);
      
      setFullName(data.fullName);
      setEmail(data.email);
      // Fix: Ensure phone is string or empty
      setPhone(data.phoneNumber || ''); 
      setBio(data.profileBio || '');
      
      if (data.profileImageUrl) {
        const img = data.profileImageUrl.startsWith('http') || data.profileImageUrl.startsWith('data:') 
          ? data.profileImageUrl 
          : `data:image/jpeg;base64,${data.profileImageUrl}`;
        setProfileImage(img);
      }
      
      if (data.city) {
        setSelectedCity(data.city);
        // If city is "Current Location", we assume it was set via GPS and lock it
        if (data.city === "Current Location") setIsLocationFixed(true);
      }
      
      if (data.latitude && data.longitude) {
        setPinCoords({ lat: data.latitude, lng: data.longitude });
        setRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleCameraPress = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera access is needed to change your profile photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImage(asset.uri); // Show immediate preview
      if (asset.base64) {
        // Store base64 to send to backend on Save
        setProfileImageBase64(asset.base64);
      }
    }
  };

  const handleLocationPress = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      setLoading(true);
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        setPinCoords({ lat: latitude, lng: longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        setSelectedCity("Current Location"); 
        setIsLocationFixed(true); // LOCK EDITING

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }

      } catch (err) {
        Alert.alert("Error", "Could not fetch location. Please select manually.");
        setModalVisible(true);
      } finally {
        setLoading(false);
      }
    } else {
      setIsLocationFixed(false);
      setModalVisible(true);
    }
  };

  const handleCitySelect = (city: string) => {
    setModalVisible(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCity(city);
    setIsLocationFixed(false);

    const coords = LEBANESE_CITIES[city];
    if (coords) {
      setPinCoords(coords);
      const newRegion = {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing Info', 'Name and Email are required.');
      return;
    }
    if (email && !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!userData) {
      Alert.alert('Error', 'User data not loaded');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...userData,
        fullName,
        email,
        phoneNumber: phone,
        profileBio: bio,
        city: selectedCity,
        latitude: pinCoords?.lat,
        longitude: pinCoords?.lng,
        // If we have a new base64 image, send it. Otherwise keep existing URL/string.
        profileImageUrl: profileImageBase64 || userData.profileImageUrl, 
      };

      const token = await AsyncStorage.getItem('authToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      await axios.put(`${API_BASE_URL}/Users/${userData.userId}`, payload, config);

      // Success - Go back to Home which will auto-refresh via useFocusEffect
      navigation.goBack();

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.title || error.message || 'Update failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !userData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header - Compact */}
        <View style={styles.headerContainer}>
          <LinearGradient
              colors={['#0F172A', '#1E293B']}
              style={styles.headerGradient}
          >
            <SafeAreaView style={styles.safeHeader}>
              <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                  <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 36 }} /> 
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color="#CBD5E1" />
                )}
                
                {/* Camera Button - Fixed Visibility */}
                <TouchableOpacity style={styles.cameraBtn} onPress={handleCameraPress} activeOpacity={0.8}>
                  <View style={styles.cameraIconBg}>
                    <Ionicons name="camera" size={18} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarName}>{fullName || 'User Name'}</Text>
              <Text style={styles.avatarSub}>Update your details below</Text>
            </View>

            {/* Personal Info Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="John Doe"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="john@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+961 70 000000"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#94A3B8" style={[styles.inputIcon, { marginTop: 12 }]} />
                  <TextInput
                    style={[styles.input, { height: 100, paddingTop: 12 }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us a bit about yourself..."
                    multiline
                  />
                </View>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.sectionSub}>
                {isLocationFixed ? "Location locked by GPS." : "Tap to select your city or check GPS."}
              </Text>

              <TouchableOpacity 
                style={styles.citySelector} 
                onPress={handleLocationPress}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.pinIconBox}>
                    <Ionicons name="location" size={20} color={isLocationFixed ? "#10B981" : "#2563EB"} />
                  </View>
                  <Text style={[styles.citySelectorText, !selectedCity && { color: '#94A3B8' }]}>
                    {selectedCity || 'Set Location'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {selectedCity ? (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={undefined} 
                    region={region}
                    scrollEnabled={!isLocationFixed} // LOCK IF FIXED
                    zoomEnabled={true}
                    onRegionChangeComplete={(r) => {
                      if (!isLocationFixed) {
                        setPinCoords({ lat: r.latitude, lng: r.longitude });
                      }
                    }}
                  >
                    {pinCoords && (
                      <Marker
                        coordinate={{ latitude: pinCoords.lat, longitude: pinCoords.lng }}
                        title={selectedCity}
                        pinColor={isLocationFixed ? "#10B981" : "#ef4444"}
                        description={isLocationFixed ? "Fixed GPS Location" : "Drag map to adjust"}
                      />
                    )}
                  </MapView>
                  
                  {!isLocationFixed && (
                    <View style={styles.mapOverlay}>
                        <Text style={styles.mapOverlayText}>Drag map to adjust pin</Text>
                    </View>
                  )}
                  
                  {isLocationFixed && (
                    <View style={[styles.mapOverlay, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.mapOverlayText}>Exact GPS Location</Text>
                    </View>
                  )}
                </View>
              ) : null}
            </View>

            <View style={{ height: 100 }} />

          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* City Selection Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select City</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {CITY_KEYS.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={styles.cityOption}
                    onPress={() => handleCitySelect(city)}
                  >
                    <Text style={[
                      styles.cityOptionText, 
                      selectedCity === city && { color: '#2563EB', fontWeight: '700' }
                    ]}>{city}</Text>
                    {selectedCity === city && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: 10, 
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  safeHeader: {
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 5, 
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -30, 
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // overflow: 'hidden', // Removed so camera button can pop out slightly if needed
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Match container
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
  cameraIconBg: {
    backgroundColor: '#2563EB',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF', // Thick white border to separate from image
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  avatarSub: {
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  pinIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  citySelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapOverlayText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityOptionText: {
    fontSize: 16,
    color: '#334155',
  },
});