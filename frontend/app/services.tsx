import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ServicesScreen() {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services?enabled_only=true`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Services</Text>
        <Text style={styles.headerSubtitle}>Choose your perfect detailing package</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {services.map((service: any) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => navigation.navigate('ServiceDetail' as never, { service } as never)}
          >
            {service.image_base64 ? (
              <Image
                source={{ uri: service.image_base64 }}
                style={styles.serviceImage}
              />
            ) : (
              <View style={styles.servicePlaceholder}>
                <Ionicons name="car-sport" size={48} color="#CCC" />
              </View>
            )}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>
              <View style={styles.serviceFooter}>
                <View>
                  <Text style={styles.servicePrice}>${service.price}</Text>
                  <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => navigation.navigate('ServiceDetail' as never, { service } as never)}
                >
                  <Text style={styles.bookButtonText}>Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  servicePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    padding: 16,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
