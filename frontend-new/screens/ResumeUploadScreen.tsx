import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Resume } from '../types/job';

type ResumeUploadScreenProps = {
  navigation: any;
};

const ResumeUploadScreen = ({ navigation }: ResumeUploadScreenProps) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setIsLoading(true);
        const mockParsedResume: Resume = {
          id: '1',
          userId: user?.uid || '',
          fileUrl: pickedFile.uri,
          parsedData: {
            name: 'John Doe',
            email: 'john@example.com',
            location: {
              city: 'San Francisco',
              state: 'CA',
            },
            education: [
              {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                institution: 'University of California',
                graduationDate: '2020-05',
              },
            ],
            experience: [
              {
                title: 'Software Engineer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                startDate: '2020-06',
                endDate: '2023-12',
                description: 'Developed and maintained web applications...',
              },
            ],
            skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          },
          lastUpdated: new Date().toISOString(),
        };

        setResume(mockParsedResume);
        setIsLoading(false);
        Alert.alert('Success', 'Resume parsed successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;

    setIsLoading(true);
    try {
      // TODO: Implement resume saving
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Resume saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.title, isDark && styles.textDark]}>
            Upload Your Resume
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textDark]}>
            We'll automatically extract your information and use it to apply for jobs
          </Text>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickDocument}
            disabled={isLoading}
          >
            <Text style={styles.uploadButtonText}>
              {resume ? 'Change Resume' : 'Select Resume'}
            </Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f4511e" />
              <Text style={[styles.loadingText, isDark && styles.textDark]}>
                {resume ? 'Saving...' : 'Parsing Resume...'}
              </Text>
            </View>
          )}

          {resume && (
            <View style={styles.resumePreview}>
              <Text style={[styles.previewTitle, isDark && styles.textDark]}>
                Parsed Information
              </Text>
              <View style={styles.previewSection}>
                <Text style={[styles.previewLabel, isDark && styles.textDark]}>Name</Text>
                <Text style={[styles.previewValue, isDark && styles.textDark]}>
                  {resume.parsedData.name}
                </Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={[styles.previewLabel, isDark && styles.textDark]}>Location</Text>
                <Text style={[styles.previewValue, isDark && styles.textDark]}>
                  {`${resume.parsedData.location.city}, ${resume.parsedData.location.state}`}
                </Text>
              </View>
              <View style={styles.previewSection}>
                <Text style={[styles.previewLabel, isDark && styles.textDark]}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {resume.parsedData.skills.map((skill, index) => (
                    <View
                      key={index}
                      style={[styles.skillTag, isDark && styles.skillTagDark]}
                    >
                      <Text style={[styles.skillText, isDark && styles.textDark]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {resume && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>Save Resume</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resumePreview: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewSection: {
    marginBottom: 15,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  previewValue: {
    fontSize: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  skillTagDark: {
    backgroundColor: '#333',
  },
  skillText: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textDark: {
    color: '#fff',
  },
});

export default ResumeUploadScreen; 