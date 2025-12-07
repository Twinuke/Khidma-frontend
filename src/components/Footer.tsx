import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Footer() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  const getColor = (pageName: string) => {
    return route.name === pageName ? '#2563EB' : '#94A3B8';
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Home */}
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Home')}>
        <Ionicons name={route.name === 'Home' ? "home" : "home-outline"} size={24} color={getColor('Home')} />
        <Text style={[styles.label, { color: getColor('Home') }]}>Home</Text>
      </TouchableOpacity>

      {/* 2. Connections (Replaced the List/Jobs icon) */}
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Connections')}>
        <Ionicons name={route.name === 'Connections' ? "people" : "people-outline"} size={24} color={getColor('Connections')} />
        <Text style={[styles.label, { color: getColor('Connections') }]}>Network</Text>
      </TouchableOpacity>

      {/* 3. Community (Social) */}
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('SocialPage')}>
        <Ionicons name={route.name === 'SocialPage' ? "earth" : "earth-outline"} size={24} color={getColor('SocialPage')} />
        <Text style={[styles.label, { color: getColor('SocialPage') }]}>Community</Text>
      </TouchableOpacity>

      {/* 4. Chat */}
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Messages')}>
        <Ionicons name={route.name === 'Messages' ? "chatbubbles" : "chatbubbles-outline"} size={24} color={getColor('Messages')} />
        <Text style={[styles.label, { color: getColor('Messages') }]}>Chat</Text>
      </TouchableOpacity>

      {/* 5. Profile */}
      <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('Profile')}>
        <Ionicons name={route.name === 'Profile' ? "person" : "person-outline"} size={24} color={getColor('Profile')} />
        <Text style={[styles.label, { color: getColor('Profile') }]}>Profile</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 20, // High elevation for shadow on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 }, // Negative height for top shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },
});