import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type JobsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Jobs'>;

export default function Jobs() {
  const navigation = useNavigation<JobsScreenNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Browse Jobs</Text>
        <Text style={styles.placeholder}>Jobs listing page content will be added here</Text>
        <Text style={styles.subtitle}>Browse available freelance jobs and opportunities</Text>
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
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
});


