import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      Alert.alert('Success', 'Your message has been sent! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contact Us</Text>
            <Text style={styles.headerSubtitle}>Get in touch with our team</Text>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <View style={styles.contactCard}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>123 Main Street, City, State 12345</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Ionicons name="call" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>(555) 123-4567</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Ionicons name="mail" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>info@cardetailing.com</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Hours</Text>
                <Text style={styles.contactValue}>Mon-Fri: 8AM - 6PM</Text>
                <Text style={styles.contactValue}>Sat-Sun: 9AM - 5PM</Text>
              </View>
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send us a message</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Your Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Your Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Your Message *"
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
