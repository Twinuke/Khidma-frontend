import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// ✅ FIX: Use Legacy FileSystem to support readAsStringAsync
// @ts-ignore
import * as FileSystem from "expo-file-system/legacy";

import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher"; 
import * as Linking from "expo-linking";
import React, { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
  Switch
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import api from "../config/api";
import { User, useUser } from "../context/UserContext";

// Enable animations
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height } = Dimensions.get("window");

// --- Interfaces ---
interface AiProfileData {
  selectedDomains: string;
  selectedSkills: string;
  selectedTools: string;
  workStyle: string;
  confidenceLevel: string;
}

interface UserProfileStats {
  completedJobs: number;
  averageRating: number;
  successRate: number;
}

const LEBANESE_CITIES: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  Tripoli: { lat: 34.4367, lng: 35.8497 },
  "Sidon (Saida)": { lat: 33.5571, lng: 35.3729 },
  "Tyre (Sour)": { lat: 33.2705, lng: 35.1969 },
  Jounieh: { lat: 33.9697, lng: 35.6156 },
  "Byblos (Jbeil)": { lat: 34.123, lng: 35.6519 },
  Zahle: { lat: 33.8463, lng: 35.902 },
  Baalbek: { lat: 34.0058, lng: 36.2181 },
};
const CITY_KEYS = Object.keys(LEBANESE_CITIES);

export default function Profile() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user: contextUser, updateUser, logout } = useUser();
  
  // ✅ LOGIC: Determine Target User (Self vs Other)
  const paramUserId = route.params?.userId;
  const isOwnProfile = !paramUserId || (contextUser && Number(paramUserId) === contextUser.userId);
  const targetUserId = isOwnProfile ? contextUser?.userId : Number(paramUserId);

  const mapRef = useRef<MapView>(null);
  
  // Start Opacity at 1 to prevent "White Screen" if animation fails
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const sheetAnim = useRef(new Animated.Value(height)).current;

  // Global State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Direct Add State
  const [isAddingLinkedin, setIsAddingLinkedin] = useState(false);
  const [tempLinkedin, setTempLinkedin] = useState("");
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isViewingCv, setIsViewingCv] = useState(false);

  // Data State
  const [displayUser, setDisplayUser] = useState<Partial<User> | null>(null);
  const [aiProfile, setAiProfile] = useState<AiProfileData | null>(null);
  const [stats, setStats] = useState<UserProfileStats>({ completedJobs: 0, averageRating: 0, successRate: 0 });

  // Form State (Only for editing self)
  const [formData, setFormData] = useState<Partial<User>>({});

  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const [selectedCity, setSelectedCity] = useState<string>("");
  const [region, setRegion] = useState({ latitude: 33.8938, longitude: 35.5018, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (targetUserId) {
        fetchFullProfile(targetUserId);
        fetchAiProfile(targetUserId);
      }
    }, [targetUserId])
  );

  const fetchFullProfile = async (id: number) => {
    try {
      const res = await api.get(`/Users/profile/${id}`);
      if (res.data) {
        setStats({
          completedJobs: res.data.completedJobs,
          averageRating: res.data.averageRating,
          successRate: res.data.successRate
        });
        
        const userData = res.data.user;
        // Clean Image URL
        if (userData.profileImageUrl && typeof userData.profileImageUrl === "string" && userData.profileImageUrl.includes("?t=")) {
            userData.profileImageUrl = userData.profileImageUrl.split("?t=")[0];
        }

        setDisplayUser(userData);

        if (isOwnProfile) {
            initializeForm(userData);
        }

        if (userData.city) setSelectedCity(userData.city);
        if (userData.latitude && userData.longitude) {
            setPinCoords({ lat: userData.latitude, lng: userData.longitude });
            setRegion({ latitude: userData.latitude, longitude: userData.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }
      }
    } catch (e) {
      console.log("Error fetching profile stats", e);
    } finally {
      // Ensure content fades in even if there's a minor error
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  };

  const fetchAiProfile = async (id: number) => {
    try {
      const res = await api.get(`/Onboarding/${id}`);
      if (res.data) setAiProfile(res.data);
    } catch (e: any) { 
      // ✅ FIX: Silently ignore 404 (User hasn't set up AI profile yet)
      if (e.response && e.response.status === 404) return;
      console.log("AI Profile fetch error", e); 
    }
  };

  const initializeForm = (userData: User) => {
    setFormData({
      fullName: userData.fullName,
      jobTitle: userData.jobTitle,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      profileBio: userData.profileBio,
      city: userData.city,
      profileImageUrl: userData.profileImageUrl,
      latitude: userData.latitude,
      longitude: userData.longitude,
      hourlyRate: userData.hourlyRate,
      isAvailable: userData.isAvailable ?? true,
      languages: userData.languages,
      linkedinUrl: userData.linkedinUrl,
      cvUrl: userData.cvUrl,
    });
  };

  const getSafePayload = (overrides: Partial<User> = {}) => {
    const base = formData;
    return { 
        ...base, 
        ...overrides, 
        city: selectedCity, 
        latitude: pinCoords?.lat, 
        longitude: pinCoords?.lng 
    };
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;
    if (!formData.fullName?.trim()) { Alert.alert("Error", "Name required"); return; }
    
    setIsSaving(true);
    try {
      const payload = getSafePayload();
      await api.put(`/Users/${contextUser?.userId}`, payload);
      await updateUser(payload);
      
      Alert.alert("Success", "Profile updated.");
      setIsEditing(false);
      fetchFullProfile(contextUser!.userId);
    } catch (e: any) { 
        Alert.alert("Error", e.response?.data?.title || "Could not save profile."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const openLinkedinLink = () => {
    if (!displayUser?.linkedinUrl) return;
    let url = displayUser.linkedinUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open link"));
  };

  const saveLinkedinDirectly = async () => {
      if (!isOwnProfile || !tempLinkedin.trim()) return;
      try {
          const payload = getSafePayload({ linkedinUrl: tempLinkedin });
          await api.put(`/Users/${contextUser?.userId}`, payload);
          await updateUser({ linkedinUrl: tempLinkedin });
          
          setIsAddingLinkedin(false);
          setTempLinkedin("");
          fetchFullProfile(contextUser!.userId);
          Alert.alert("Success", "LinkedIn connected!");
      } catch (e) {
          Alert.alert("Error", "Failed to save LinkedIn URL");
      }
  };

  const handleCvUpload = async () => {
    if (!isOwnProfile) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.size && asset.size > 10 * 1024 * 1024) {
            Alert.alert("File Too Large", "Please upload a PDF smaller than 10MB.");
            return;
        }

        setIsUploadingCv(true);
        let fileUri = asset.uri;

        // Android Content URI Handling
        // @ts-ignore
        if (fileUri.startsWith("content://") && FileSystem.cacheDirectory) {
            try {
                // @ts-ignore
                const dest = FileSystem.cacheDirectory + (asset.name || "temp.pdf");
                // @ts-ignore
                await FileSystem.copyAsync({ from: fileUri, to: dest });
                fileUri = dest;
            } catch (err) {
                console.log("Copy failed", err);
            }
        }

        // @ts-ignore
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: "base64" });
        const dataUri = `data:application/pdf;base64,${base64}`;

        if (isEditing) {
            setFormData(prev => ({ ...prev, cvUrl: dataUri }));
            Alert.alert("Attached", "PDF attached. Don't forget to click 'Save Changes'.");
        } else {
            const payload = getSafePayload({ cvUrl: dataUri });
            await api.put(`/Users/${contextUser?.userId}`, payload);
            await updateUser({ cvUrl: dataUri });
            fetchFullProfile(contextUser!.userId);
            Alert.alert("Success", "CV Uploaded and Saved!");
        }
      }
    } catch (err: any) {
      console.log("Upload Error:", err);
      Alert.alert("Upload Failed", "Could not upload PDF.");
    } finally {
        setIsUploadingCv(false);
    }
  };

  const handleViewCv = async () => {
    if (!displayUser?.cvUrl) return;
    setIsViewingCv(true);
    try {
        const base64Data = displayUser.cvUrl.includes(",") 
            ? displayUser.cvUrl.split(",")[1] 
            : displayUser.cvUrl;

        // @ts-ignore
        const fileUri = FileSystem.cacheDirectory + 'User_Resume.pdf';
        
        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: "base64" });

        if (Platform.OS === 'android') {
            // @ts-ignore
            const contentUri = await FileSystem.getContentUriAsync(fileUri);
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                flags: 1, // Grant Read Permission
                type: 'application/pdf',
            });
        } else {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
                dialogTitle: 'Resume'
            });
        }
    } catch (error) {
        console.log("View CV Error:", error);
        Alert.alert("Error", "Could not open the PDF. Ensure you have a PDF viewer.");
    } finally {
        setIsViewingCv(false);
    }
  };

  const handlePhotoOption = async (option: "camera" | "gallery" | "remove") => {
    setPhotoModalVisible(false);
    if (!isOwnProfile) return;
    setTimeout(async () => {
      if (option === "remove") {
        setFormData(prev => ({ ...prev, profileImageUrl: null as any }));
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true };
      try {
        const result = option === "camera" 
          ? await ImagePicker.launchCameraAsync(opts) 
          : await ImagePicker.launchImageLibraryAsync(opts);

        if (!result.canceled && result.assets?.[0].base64) {
          setFormData(prev => ({ ...prev, profileImageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` }));
        }
      } catch (e) { Alert.alert("Error", "Photo selection failed."); }
    }, 400);
  };

  // --- Render Helpers ---
  const TagGroup = ({ title, tags, color }: any) => {
    if (!tags) return null;
    const items = tags.split(",").filter((i: string) => i.trim());
    if (items.length === 0) return null;
    return (
      <View style={styles.tagGroup}>
        <Text style={styles.tagTitle}>{title}</Text>
        <View style={styles.tagContainer}>
          {items.map((t: string, i: number) => (
            <View key={i} style={[styles.tag, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
              <Text style={[styles.tagText, { color }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const InfoItem = ({ icon, label, value }: any) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconBox]}>
        <Ionicons name={icon} size={18} color={"#64748B"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue]}>{value || "Not Set"}</Text>
      </View>
    </View>
  );

  // Loading State
  if (!displayUser) {
      return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
  }

  const activeImage = isEditing ? formData.profileImageUrl : displayUser.profileImageUrl;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* --- HEADER --- */}
        <LinearGradient colors={["#0F172A", "#1E293B", "#334155"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>{isEditing ? "Edit Profile" : "Profile"}</Text>
                
                {isOwnProfile ? (
                    <TouchableOpacity 
                        style={styles.navBtn} 
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            if (isEditing) initializeForm(contextUser!);
                            setIsEditing(!isEditing);
                            setIsAddingLinkedin(false);
                        }}
                    >
                        <Ionicons name={isEditing ? "close" : "create-outline"} size={22} color="#FFF" />
                    </TouchableOpacity>
                ) : <View style={{width: 40}} />}
            </View>

            <View style={styles.headerContent}>
                <View style={styles.avatarContainer}>
                    {activeImage ? (
                        <Image source={{ uri: activeImage }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarInitials}>{displayUser.fullName?.[0] || "?"}</Text>
                        </View>
                    )}
                    {isEditing && (
                        <TouchableOpacity style={styles.editPhotoBtn} onPress={() => setPhotoModalVisible(true)}>
                            <Ionicons name="camera" size={16} color="#0F172A" />
                        </TouchableOpacity>
                    )}
                </View>

                {isEditing ? (
                    <>
                      <TextInput style={styles.inputNameDark} value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} placeholder="Full Name" placeholderTextColor="rgba(255,255,255,0.5)" />
                      <TextInput style={styles.inputHeadlineDark} value={formData.jobTitle} onChangeText={t => setFormData({ ...formData, jobTitle: t })} placeholder="Job Title" placeholderTextColor="rgba(255,255,255,0.5)" />
                    </>
                ) : (
                    <>
                      <Text style={styles.nameDark}>{displayUser.fullName}</Text>
                      {displayUser.jobTitle && <Text style={styles.headlineDark}>{displayUser.jobTitle}</Text>}
                    </>
                )}

                <View style={styles.metaRow}>
                    <View style={styles.roleBadgeDark}>
                        <Text style={styles.roleTextDark}>{displayUser.userType === 1 ? "Client" : "Freelancer"}</Text>
                    </View>
                    <View style={styles.dotSeparator} />
                    <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.7)" /> 
                    <Text style={styles.locationDark}> {displayUser.city || "Remote"}</Text>
                </View>

                <View style={styles.statsRowDark}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumDark}>{stats.averageRating || "N/A"}</Text>
                        <Text style={styles.statLabelDark}>Rating</Text>
                    </View>
                    <View style={styles.statDividerDark} />
                    <View style={styles.stat}>
                        <Text style={styles.statNumDark}>{stats.completedJobs}</Text>
                        <Text style={styles.statLabelDark}>Jobs</Text>
                    </View>
                    <View style={styles.statDividerDark} />
                    <View style={styles.stat}>
                        {isEditing ? (
                           <View style={{flexDirection:'row', alignItems:'center'}}>
                             <Text style={{color:'white', fontSize:12, marginRight:5}}>$</Text>
                             <TextInput value={formData.hourlyRate?.toString()} onChangeText={t => setFormData({...formData, hourlyRate: Number(t)})} placeholder="20" keyboardType="numeric" style={{color:'white', borderBottomWidth:1, borderColor:'white', width:30, textAlign:'center'}} />
                           </View>
                        ) : (
                           <Text style={styles.statNumDark}>${displayUser.hourlyRate || "0"}</Text>
                        )}
                        <Text style={styles.statLabelDark}>Hourly</Text>
                    </View>
                </View>
            </View>
        </LinearGradient>

        <Animated.View style={[styles.bodyContainer, { opacity: fadeAnim }]}>
            
            {/* Availability */}
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={[styles.statusDot, { backgroundColor: (isEditing ? formData.isAvailable : displayUser.isAvailable) ? '#22C55E' : '#EF4444' }]} />
                        <Text style={styles.sectionHeaderMb0}> Availability</Text>
                    </View>
                    {isEditing ? (
                        <Switch value={formData.isAvailable} onValueChange={v => setFormData({...formData, isAvailable: v})} trackColor={{ false: "#E2E8F0", true: "#BBF7D0" }} thumbColor={formData.isAvailable ? "#22C55E" : "#94A3B8"} />
                    ) : (
                        <Text style={{ color: displayUser.isAvailable ? '#16A34A' : '#DC2626', fontWeight:'600'}}>{displayUser.isAvailable ? "Available" : "Busy"}</Text>
                    )}
                </View>
            </View>

            {/* Resources */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Professional Resources</Text>
                
                {/* LinkedIn */}
                <View style={styles.resourceRow}>
                    <View style={styles.resourceIcon}><Ionicons name="logo-linkedin" size={20} color="#0077B5" /></View>
                    <View style={{flex:1}}>
                        <Text style={styles.resourceLabel}>LinkedIn Profile</Text>
                        {isEditing ? (
                            <TextInput 
                                style={styles.inputCompact} 
                                value={formData.linkedinUrl} 
                                onChangeText={t => setFormData({...formData, linkedinUrl: t})} 
                                placeholder="https://linkedin.com/in/..." 
                            />
                        ) : (
                            <View>
                                {displayUser.linkedinUrl ? (
                                    <TouchableOpacity onPress={openLinkedinLink}>
                                        <Text style={[styles.resourceValue, styles.linkText]}>View Profile</Text>
                                    </TouchableOpacity>
                                ) : (
                                    isAddingLinkedin && isOwnProfile ? (
                                        <View style={styles.directAddRow}>
                                            <TextInput 
                                                style={[styles.inputCompact, {flex:1, marginTop:0}]} 
                                                value={tempLinkedin} 
                                                onChangeText={setTempLinkedin}
                                                placeholder="Paste URL..."
                                            />
                                            <TouchableOpacity onPress={saveLinkedinDirectly} style={styles.directSaveBtn}><Ionicons name="checkmark" size={18} color="white" /></TouchableOpacity>
                                            <TouchableOpacity onPress={() => setIsAddingLinkedin(false)} style={styles.directCancelBtn}><Ionicons name="close" size={18} color="#64748B" /></TouchableOpacity>
                                        </View>
                                    ) : (
                                        isOwnProfile ? (
                                            <TouchableOpacity onPress={() => setIsAddingLinkedin(true)} style={styles.directAddBtn}>
                                                <Ionicons name="add-circle-outline" size={16} color="#2563EB" />
                                                <Text style={styles.directAddText}>Connect LinkedIn</Text>
                                            </TouchableOpacity>
                                        ) : <Text style={styles.resourceValue}>Not Connected</Text>
                                    )
                                )}
                            </View>
                        )}
                    </View>
                </View>
                
                <View style={styles.divider} />

                {/* CV */}
                <View style={styles.resourceRow}>
                    <View style={styles.resourceIcon}><Ionicons name="document-text" size={20} color="#EF4444" /></View>
                    <View style={{flex:1}}>
                        <Text style={styles.resourceLabel}>Resume / CV</Text>
                        {isEditing ? (
                            <View style={{flexDirection:'row', alignItems:'center', marginTop:4}}>
                                {formData.cvUrl ? (
                                    <View style={styles.cvChip}>
                                        <Text style={styles.cvChipText}>PDF Attached</Text>
                                        <TouchableOpacity onPress={() => setFormData({...formData, cvUrl: null as any})}><Ionicons name="close-circle" size={18} color="#EF4444" style={{marginLeft:6}} /></TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.uploadCvBtn} onPress={handleCvUpload}>
                                        <Ionicons name="cloud-upload-outline" size={16} color="#2563EB" />
                                        <Text style={styles.uploadCvText}>Upload PDF</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View>
                                {displayUser.cvUrl ? (
                                    <Text style={styles.resourceValue}>Resume Available</Text>
                                ) : (
                                    isOwnProfile ? (
                                        <TouchableOpacity style={styles.directAddBtn} onPress={handleCvUpload} disabled={isUploadingCv}>
                                            {isUploadingCv ? (
                                                <ActivityIndicator size="small" color="#2563EB" />
                                            ) : (
                                                <>
                                                    <Ionicons name="cloud-upload-outline" size={16} color="#2563EB" />
                                                    <Text style={styles.directAddText}>Upload PDF</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    ) : <Text style={styles.resourceValue}>No Resume</Text>
                                )}
                            </View>
                        )}
                    </View>
                    {!isEditing && displayUser.cvUrl && (
                        <TouchableOpacity style={styles.viewCvBtn} onPress={handleViewCv} disabled={isViewingCv}>
                            {isViewingCv ? <ActivityIndicator size="small" color="#64748B"/> : <Text style={styles.viewCvText}>View</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* About */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>About Me</Text>
                {isEditing ? (
                    <TextInput style={styles.textArea} multiline value={formData.profileBio} onChangeText={t => setFormData({...formData, profileBio: t})} placeholder="Describe your background..." />
                ) : (
                    <Text style={styles.bioText}>{displayUser.profileBio || "No biography added yet."}</Text>
                )}
            </View>

            {/* Tech Stack */}
            {!isEditing && aiProfile && (
                <View style={styles.section}>
                    <View style={styles.aiHeader}>
                        <Text style={styles.sectionHeader}>Tech Stack</Text>
                        {aiProfile.confidenceLevel ? <View style={styles.confidenceBadge}><Text style={styles.confidenceText}>{aiProfile.confidenceLevel}</Text></View> : null}
                    </View>
                    <TagGroup title="Expertise" tags={aiProfile.selectedDomains} color="#0F172A" />
                    <TagGroup title="Skills" tags={aiProfile.selectedSkills} color="#2563EB" />
                    <TagGroup title="Tools" tags={aiProfile.selectedTools} color="#059669" />
                </View>
            )}

            {/* Contact */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Contact</Text>
                {isEditing ? (
                    <View style={styles.infoStack}>
                        <TextInput style={styles.inputField} value={formData.email} onChangeText={t => setFormData({...formData, email: t})} placeholder="Email" />
                        <TextInput style={styles.inputField} value={formData.phoneNumber} onChangeText={t => setFormData({...formData, phoneNumber: t})} placeholder="Phone" />
                    </View>
                ) : (
                    <View style={styles.infoStack}>
                        <InfoItem icon="mail-outline" label="Email" value={displayUser.email} />
                        <InfoItem icon="call-outline" label="Phone" value={displayUser.phoneNumber} />
                    </View>
                )}
            </View>

            {/* Location */}
            <View style={styles.section}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.sectionHeader}>Location</Text>
                    {isEditing && (
                         <TouchableOpacity onPress={() => setCityModalVisible(true)}><Text style={{color: '#2563EB', fontWeight: '600'}}>Change City</Text></TouchableOpacity>
                    )}
                </View>
                <View style={styles.mapContainer}>
                    <MapView ref={mapRef} style={styles.map} region={region} scrollEnabled={false} zoomEnabled={false}>
                        {pinCoords && <Marker coordinate={{ latitude: pinCoords.lat, longitude: pinCoords.lng }} />}
                    </MapView>
                </View>
            </View>

            {/* Actions (Only show Logout/Save if it's YOUR profile) */}
            {isOwnProfile && (
                isEditing ? (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                )
            )}
            <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* --- MODALS --- */}
      <Modal visible={photoModalVisible} transparent onRequestClose={() => setPhotoModalVisible(false)}>
         <TouchableWithoutFeedback onPress={() => setPhotoModalVisible(false)}><View style={styles.modalBackdrop} /></TouchableWithoutFeedback>
         <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Profile Photo</Text>
            <TouchableOpacity style={styles.sheetItem} onPress={() => handlePhotoOption("camera")}>
                <Ionicons name="camera-outline" size={24} color="#0F172A" style={{marginRight:15}}/>
                <Text style={styles.sheetText}>Take a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={() => handlePhotoOption("gallery")}>
                <Ionicons name="images-outline" size={24} color="#0F172A" style={{marginRight:15}}/>
                <Text style={styles.sheetText}>Choose from Gallery</Text>
            </TouchableOpacity>
            {(formData.profileImageUrl || displayUser.profileImageUrl) && (
                <TouchableOpacity style={styles.sheetItem} onPress={() => handlePhotoOption("remove")}>
                    <Ionicons name="trash-outline" size={24} color="#DC2626" style={{marginRight:15}}/>
                    <Text style={[styles.sheetText, { color: '#DC2626' }]}>Remove Photo</Text>
                </TouchableOpacity>
            )}
         </Animated.View>
      </Modal>

      <Modal visible={cityModalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.cityModal}>
              <View style={styles.cityHeader}>
                  <Text style={styles.cityTitle}>Select City</Text>
                  <TouchableOpacity onPress={() => setCityModalVisible(false)}><Ionicons name="close-circle" size={30} color="#CBD5E1" /></TouchableOpacity>
              </View>
              <ScrollView>
                  {CITY_KEYS.map(city => (
                      <TouchableOpacity key={city} style={styles.cityRow} onPress={() => { setCityModalVisible(false); setSelectedCity(city); }}>
                          <Text style={[styles.cityText, selectedCity === city && { color: '#2563EB', fontWeight: 'bold' }]}>{city}</Text>
                          {selectedCity === city && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },
  headerGradient: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  navBar: { paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  navTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
  headerContent: { alignItems: 'center', paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: '#FFF' },
  editPhotoBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFF', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.2, elevation: 5 },
  nameDark: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 2, textAlign: 'center' },
  headlineDark: { fontSize: 16, marginBottom: 10, textAlign: 'center', fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  inputNameDark: { fontSize: 22, fontWeight: '700', color: '#FFF', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.3)', minWidth: 200, textAlign: 'center', marginBottom: 8 },
  inputHeadlineDark: { fontSize: 16, color: '#FFF', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.3)', minWidth: 250, textAlign: 'center', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  roleBadgeDark: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleTextDark: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 8 },
  locationDark: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  statsRowDark: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingVertical: 14, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stat: { alignItems: 'center', minWidth: 60 },
  statNumDark: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statLabelDark: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase' },
  statDividerDark: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.1)' },
  bodyContainer: { paddingHorizontal: 20, marginTop: 24 },
  section: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#64748B", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionHeaderMb0: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  bioText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  textArea: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, height: 100, textAlignVertical: 'top', fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  langText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  confidenceBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#DCFCE7' },
  confidenceText: { fontSize: 12, color: '#16A34A', fontWeight: '700' },
  tagGroup: { marginBottom: 12 },
  tagTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 13, fontWeight: '600' },
  infoStack: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 12, color: '#94A3B8' },
  infoValue: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  inputField: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  mapContainer: { height: 160, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  map: { width: '100%', height: '100%' },
  saveBtn: { backgroundColor: '#0F172A', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#FEF2F2', padding: 18, borderRadius: 16, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 24 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  sheetText: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  cityModal: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#F8FAFC' },
  cityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cityTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  cityText: { fontSize: 16, color: '#334155' },
  
  resourceRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  resourceIcon: { marginRight: 12, marginTop: 2, width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  resourceLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  resourceValue: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  linkText: { color: '#2563EB', textDecorationLine: 'underline' },
  inputCompact: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  uploadCvBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  uploadCvText: { color: '#2563EB', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  cvChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  cvChipText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  viewCvBtn: { justifyContent: 'center', paddingLeft: 10 },
  viewCvText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  directAddBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  directAddText: { color: '#2563EB', fontWeight: '600', marginLeft: 6, fontSize: 14 },
  directAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  directSaveBtn: { backgroundColor: '#2563EB', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  directCancelBtn: { backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});