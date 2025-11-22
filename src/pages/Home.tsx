import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleLogout = () => {
    // TODO: Clear auth token and navigate to login
    navigation.replace('Login');
  };

  const navigationItems = [
    { name: 'Profile', screen: 'Profile' as const },
    { name: 'Jobs', screen: 'Jobs' as const },
    { name: 'Create Job', screen: 'CreateJob' as const },
    { name: 'My Jobs', screen: 'MyJobs' as const },
    { name: 'Bids', screen: 'Bids' as const },
    { name: 'Messages', screen: 'Messages' as const },
    { name: 'Notifications', screen: 'Notifications' as const },
    { name: 'Search', screen: 'Search' as const },
    { name: 'Settings', screen: 'Settings' as const },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Khidma</Text>
        <Text style={styles.subtitle}>You are successfully logged in!</Text>
        
        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          {navigationItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.navButton}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.navButtonText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
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
  navigationSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  navButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
