import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type JobDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JobDetails'>;

type JobDetailsRouteProp = {
  key: string;
  name: 'JobDetails';
  params: {
    jobId: number;
  };
};

export default function JobDetails() {
  const navigation = useNavigation<JobDetailsScreenNavigationProp>();
  const route = useRoute<JobDetailsRouteProp>();
  const { jobId } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Job Details</Text>
        <Text style={styles.placeholder}>Job details page content will be added here</Text>
        <Text style={styles.subtitle}>Job ID: {jobId || 'N/A'}</Text>
        <Text style={styles.description}>Full job description, requirements, and bid information</Text>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
});


