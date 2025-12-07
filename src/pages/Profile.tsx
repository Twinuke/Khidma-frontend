import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { User, useUser } from "../context/UserContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- LEBANON CITIES DATA ---
const LEBANESE_CITIES: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  Tripoli: { lat: 34.4367, lng: 35.8497 },
  "Sidon (Saida)": { lat: 33.5571, lng: 35.3729 },
  "Tyre (Sour)": { lat: 33.2705, lng: 35.1969 },
  Jounieh: { lat: 33.9697, lng: 35.6156 },
  "Byblos (Jbeil)": { lat: 34.123, lng: 35.6519 },
  Zahle: { lat: 33.8463, lng: 35.902 },
  Baalbek: { lat: 34.0058, lng: 36.2181 },
  Batroun: { lat: 34.2496, lng: 35.6643 },
  Aley: { lat: 33.8066, lng: 35.596 },
  Nabatieh: { lat: 33.3772, lng: 35.4833 },
  Zgharta: { lat: 34.398, lng: 35.894 },
};

const CITY_KEYS = Object.keys(LEBANESE_CITIES);

export default function Profile() {
  const navigation = useNavigation<any>();
  const { user, updateUser, isLoading, logout } = useUser();
  const mapRef = useRef<MapView>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location State
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLocationFixed, setIsLocationFixed] = useState(false);
  const [region, setRegion] = useState({
    latitude: 33.8938,
    longitude: 35.5018,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [pinCoords, setPinCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Initialize form
  useEffect(() => {
    if (user) {
      initializeForm(user);
    }
  }, [user, isEditing]);

  const initializeForm = (userData: User) => {
    setFormData({
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      profileBio: userData.profileBio,
      city: userData.city,
      profileImageUrl: userData.profileImageUrl,
      latitude: userData.latitude,
      longitude: userData.longitude,
    });

    if (userData.city) setSelectedCity(userData.city);
    if (userData.city === "Current Location") setIsLocationFixed(true);

    if (userData.latitude && userData.longitude) {
      setPinCoords({ lat: userData.latitude, lng: userData.longitude });
      setRegion({
        latitude: userData.latitude,
        longitude: userData.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }
    if (!formData.email?.trim() || !formData.email.includes("@")) {
      newErrors.email = "Valid email is required";
      valid = false;
    }
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "Phone number is required";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert("Check Fields", "Please fix the errors highlighted in red.");
      return;
    }

    setIsSaving(true);
    try {
      // ✅ FIX: Create a clean payload matching UserUpdateDto
      const cleanPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        profileBio: formData.profileBio,
        profileImageUrl: formData.profileImageUrl,
        city: selectedCity,
        latitude: pinCoords?.lat,
        longitude: pinCoords?.lng,
      };

      await updateUser(cleanPayload);
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Save Error:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to update profile.";
      Alert.alert("Error", typeof msg === "object" ? JSON.stringify(msg) : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "We need access to your photos.");
      return;
    }

    try {
      // ✅ FIX 1: Use ['images'] array (Fixes Deprecation Warning & Crash)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        // ✅ FIX 2: Quality 0.2 (Fixes 500/400 Error due to massive payload)
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData((prev) => ({ ...prev, profileImageUrl: base64Img }));
      }
    } catch (e) {
      console.log("Image Picker Error:", e);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleLocationPress = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
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
        setIsLocationFixed(true);

        if (mapRef.current) {
          mapRef.current.animateToRegion(
            { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            1000
          );
        }
      } catch (err) {
        Alert.alert("Error", "Could not fetch location.");
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
      if (mapRef.current) mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>User profile could not be loaded.</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => {
            logout();
          }}
        >
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderInput = (
    label: string,
    field: keyof User,
    placeholder: string,
    multiline = false,
    keyboardType: any = "default"
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          errors[field] && styles.inputError,
        ]}
        value={formData[field]?.toString()}
        onChangeText={(text) => {
          setFormData((prev) => ({ ...prev, [field]: text }));
          if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
        }}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={isEditing}
      />
      {errors[field] && (
        <Text style={styles.fieldErrorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <ScreenWrapper scrollable={true} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Profile" : "My Profile"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              setIsEditing(false); // Cancel
              setErrors({});
              if (user) initializeForm(user);
            } else {
              setIsEditing(true);
            }
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {(isEditing ? formData.profileImageUrl : user.profileImageUrl) ? (
              <Image
                source={{
                  uri: isEditing
                    ? formData.profileImageUrl
                    : user.profileImageUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {user.fullName?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}

            {isEditing && (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleImagePick}
              >
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {!isEditing && (
            <>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userRole}>
                {user.userType === 1 ? "Client" : "Freelancer"} •{" "}
                {user.city || "No Location"}
              </Text>
            </>
          )}
        </View>

        {/* Form Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Basic Information</Text>
          {renderInput("Full Name", "fullName", "John Doe")}
          {renderInput(
            "Email",
            "email",
            "john@example.com",
            false,
            "email-address"
          )}
          {renderInput("Phone", "phoneNumber", "+961 ...", false, "phone-pad")}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Details</Text>
          {renderInput("Bio", "profileBio", "Tell us about yourself...", true)}

          <Text style={styles.label}>Location</Text>
          {isEditing ? (
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.citySelectorText}>
                {selectedCity || "Select City"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.readOnlyText}>{user.city || "Not set"}</Text>
          )}

          {/* Helper for GPS */}
          {isEditing && (
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleLocationPress}
            >
              <Ionicons name="locate" size={18} color="#2563EB" />
              <Text style={styles.gpsButtonText}>Use Current Location</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map Preview (Visible if location set) */}
        {(selectedCity || pinCoords) && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              {pinCoords && (
                <Marker
                  coordinate={{
                    latitude: pinCoords.lat,
                    longitude: pinCoords.lng,
                  }}
                />
              )}
            </MapView>
          </View>
        )}

        {/* Action Buttons */}
        {isEditing ? (
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
            }}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* City Modal */}
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
            <ScrollView>
              {CITY_KEYS.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.cityOption}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text
                    style={[
                      styles.cityOptionText,
                      selectedCity === city && {
                        color: "#2563EB",
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  errorText: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: { color: "#FFF", fontWeight: "600" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  iconButton: { padding: 8 },
  editButton: { padding: 8 },
  editButtonText: { color: "#2563EB", fontWeight: "600", fontSize: 16 },

  content: { padding: 20, paddingBottom: 40 },

  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarPlaceholder: {
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { fontSize: 36, fontWeight: "700", color: "#FFF" },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 12,
  },
  userRole: { fontSize: 14, color: "#64748B", marginTop: 4 },

  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 6 },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1 },
  fieldErrorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  textArea: { height: 100, textAlignVertical: "top" },
  readOnlyText: { fontSize: 15, color: "#334155", paddingVertical: 4 },

  citySelector: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  citySelectorText: { color: "#0F172A", fontSize: 15 },
  gpsButton: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  gpsButtonText: { color: "#2563EB", fontWeight: "600", marginLeft: 6 },

  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: { width: "100%", height: "100%" },

  saveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: { backgroundColor: "#93C5FD" },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  logoutButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  logoutButtonText: { color: "#EF4444", fontSize: 16, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "60%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  cityOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cityOptionText: { fontSize: 16, color: "#334155" },
});
