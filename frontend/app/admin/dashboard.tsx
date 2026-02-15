import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type Tab = 'services' | 'offers' | 'bookings' | 'gallery';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [token, setToken] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Services
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    image_base64: '',
    enabled: true,
  });

  // Offers
  const [offers, setOffers] = useState([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    type: 'percentage',
    value: '',
    active: true,
  });

  // Bookings
  const [bookings, setBookings] = useState([]);

  // Gallery
  const [gallery, setGallery] = useState([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    description: '',
    image_base64: '',
  });

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [activeTab, token]);

  const loadToken = async () => {
    const savedToken = await AsyncStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
    } else {
      navigation.navigate('AdminLogin' as never);
    }
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchData = async () => {
    try {
      if (activeTab === 'services') {
        const response = await axios.get(`${API_URL}/api/services`);
        setServices(response.data);
      } else if (activeTab === 'offers') {
        const response = await axios.get(`${API_URL}/api/offers`);
        setOffers(response.data);
      } else if (activeTab === 'bookings') {
        const response = await axios.get(`${API_URL}/api/appointments`, getAuthHeaders());
        setBookings(response.data);
      } else if (activeTab === 'gallery') {
        const response = await axios.get(`${API_URL}/api/gallery`);
        setGallery(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('adminToken');
          navigation.navigate('Home' as never);
        },
      },
    ]);
  };

  // Service Functions
  const openServiceModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        duration: service.duration.toString(),
        category: service.category,
        image_base64: service.image_base64 || '',
        enabled: service.enabled,
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        image_base64: '',
        enabled: true,
      });
    }
    setShowServiceModal(true);
  };

  const saveService = async () => {
    try {
      const data = {
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
      };

      if (editingService) {
        await axios.put(
          `${API_URL}/api/services/${editingService.id}`,
          data,
          getAuthHeaders()
        );
      } else {
        await axios.post(`${API_URL}/api/services`, data, getAuthHeaders());
      }

      setShowServiceModal(false);
      fetchData();
      Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    }
  };

  const deleteService = async (id: string) => {
    Alert.alert('Delete Service', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/services/${id}`, getAuthHeaders());
            fetchData();
            Alert.alert('Success', 'Service deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete service');
          }
        },
      },
    ]);
  };

  const toggleService = async (id: string) => {
    try {
      await axios.put(`${API_URL}/api/services/${id}/toggle`, {}, getAuthHeaders());
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle service');
    }
  };

  // Offer Functions
  const openOfferModal = (offer: any = null) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        title: offer.title,
        description: offer.description,
        type: offer.type,
        value: offer.value?.toString() || '',
        active: offer.active,
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        title: '',
        description: '',
        type: 'percentage',
        value: '',
        active: true,
      });
    }
    setShowOfferModal(true);
  };

  const saveOffer = async () => {
    try {
      const data = {
        ...offerForm,
        value: offerForm.value ? parseFloat(offerForm.value) : null,
      };

      if (editingOffer) {
        await axios.put(
          `${API_URL}/api/offers/${editingOffer.id}`,
          data,
          getAuthHeaders()
        );
      } else {
        await axios.post(`${API_URL}/api/offers`, data, getAuthHeaders());
      }

      setShowOfferModal(false);
      fetchData();
      Alert.alert('Success', `Offer ${editingOffer ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving offer:', error);
      Alert.alert('Error', 'Failed to save offer');
    }
  };

  const deleteOffer = async (id: string) => {
    Alert.alert('Delete Offer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/offers/${id}`, getAuthHeaders());
            fetchData();
            Alert.alert('Success', 'Offer deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete offer');
          }
        },
      },
    ]);
  };

  // Gallery Functions
  const pickImage = async (isGallery: boolean = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (isGallery) {
        setGalleryForm({ ...galleryForm, image_base64: base64Image });
      } else {
        setServiceForm({ ...serviceForm, image_base64: base64Image });
      }
    }
  };

  const saveGalleryItem = async () => {
    try {
      await axios.post(`${API_URL}/api/gallery`, galleryForm, getAuthHeaders());
      setShowGalleryModal(false);
      setGalleryForm({ description: '', image_base64: '' });
      fetchData();
      Alert.alert('Success', 'Gallery item added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add gallery item');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    Alert.alert('Delete Image', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/gallery/${id}`, getAuthHeaders());
            fetchData();
            Alert.alert('Success', 'Image deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete image');
          }
        },
      },
    ]);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${id}`, { status }, getAuthHeaders());
      fetchData();
      Alert.alert('Success', 'Booking status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your business</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => setActiveTab('services')}
        >
          <Ionicons
            name="car-sport"
            size={20}
            color={activeTab === 'services' ? '#007AFF' : '#666'}
          />
          <Text
            style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}
          >
            Services
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.tabActive]}
          onPress={() => setActiveTab('offers')}
        >
          <Ionicons
            name="pricetag"
            size={20}
            color={activeTab === 'offers' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'offers' && styles.tabTextActive]}>
            Offers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'bookings' ? '#007AFF' : '#666'}
          />
          <Text
            style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}
          >
            Bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
          onPress={() => setActiveTab('gallery')}
        >
          <Ionicons
            name="images"
            size={20}
            color={activeTab === 'gallery' ? '#007AFF' : '#666'}
          />
          <Text
            style={[styles.tabText, activeTab === 'gallery' && styles.tabTextActive]}
          >
            Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Services Tab */}
        {activeTab === 'services' && (
          <View>
            {services.map((service: any) => (
              <View key={service.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{service.name}</Text>
                    <Text style={styles.cardSubtitle}>{service.category}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: service.enabled ? '#34C759' : '#FF3B30' },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {service.enabled ? 'Active' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>${service.price}</Text>
                  <Text style={styles.cardDuration}>{service.duration} min</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleService(service.id)}
                  >
                    <Ionicons
                      name={service.enabled ? 'eye-off' : 'eye'}
                      size={20}
                      color="#007AFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openServiceModal(service)}
                  >
                    <Ionicons name="create" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteService(service.id)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <View>
            {offers.map((offer: any) => (
              <View key={offer.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{offer.title}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: offer.active ? '#34C759' : '#FF3B30' },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {offer.active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>{offer.type}</Text>
                <Text style={styles.cardDescription}>{offer.description}</Text>
                {offer.value && (
                  <Text style={styles.offerValue}>
                    {offer.type === 'percentage' ? `${offer.value}% OFF` : `$${offer.value} OFF`}
                  </Text>
                )}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openOfferModal(offer)}
                  >
                    <Ionicons name="create" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteOffer(offer.id)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <View>
            {bookings.map((booking: any) => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{booking.customer_name}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          booking.status === 'confirmed'
                            ? '#34C759'
                            : booking.status === 'pending'
                            ? '#FF9500'
                            : '#666',
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>{booking.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>{booking.service_name}</Text>
                <Text style={styles.cardDescription}>
                  {booking.date} at {booking.time}
                </Text>
                <Text style={styles.cardInfo}>Phone: {booking.phone}</Text>
                <Text style={styles.cardInfo}>Email: {booking.email}</Text>
                {booking.notes && <Text style={styles.cardInfo}>Notes: {booking.notes}</Text>}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#34C759' }]}
                    onPress={() => updateBookingStatus(booking.id, 'confirmed')}
                  >
                    <Text style={styles.statusButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => updateBookingStatus(booking.id, 'completed')}
                  >
                    <Text style={styles.statusButtonText}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => updateBookingStatus(booking.id, 'cancelled')}
                  >
                    <Text style={styles.statusButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <View style={styles.galleryGrid}>
            {gallery.map((item: any) => (
              <View key={item.id} style={styles.galleryItem}>
                <Image
                  source={{ uri: item.image_base64 }}
                  style={styles.galleryImage}
                />
                <TouchableOpacity
                  style={styles.galleryDelete}
                  onPress={() => deleteGalleryItem(item.id)}
                >
                  <Ionicons name="trash" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'services') openServiceModal();
          else if (activeTab === 'offers') openOfferModal();
          else if (activeTab === 'gallery') setShowGalleryModal(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Service Modal */}
      <Modal visible={showServiceModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.modalInput}
                placeholder="Service Name"
                value={serviceForm.name}
                onChangeText={(text) => setServiceForm({ ...serviceForm, name: text })}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Category"
                value={serviceForm.category}
                onChangeText={(text) => setServiceForm({ ...serviceForm, category: text })}
              />
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Description"
                value={serviceForm.description}
                onChangeText={(text) => setServiceForm({ ...serviceForm, description: text })}
                multiline
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Price"
                value={serviceForm.price}
                onChangeText={(text) => setServiceForm({ ...serviceForm, price: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Duration (minutes)"
                value={serviceForm.duration}
                onChangeText={(text) => setServiceForm({ ...serviceForm, duration: text })}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(false)}>
                <Ionicons name="image" size={20} color="#007AFF" />
                <Text style={styles.imageButtonText}>
                  {serviceForm.image_base64 ? 'Change Image' : 'Add Image'}
                </Text>
              </TouchableOpacity>
              {serviceForm.image_base64 && (
                <Image source={{ uri: serviceForm.image_base64 }} style={styles.previewImage} />
              )}
              <TouchableOpacity style={styles.modalButton} onPress={saveService}>
                <Text style={styles.modalButtonText}>Save Service</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? 'Edit Offer' : 'Add Offer'}
              </Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.modalInput}
                placeholder="Offer Title"
                value={offerForm.title}
                onChangeText={(text) => setOfferForm({ ...offerForm, title: text })}
              />
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Description"
                value={offerForm.description}
                onChangeText={(text) => setOfferForm({ ...offerForm, description: text })}
                multiline
              />
              <Text style={styles.label}>Offer Type</Text>
              <View style={styles.radioGroup}>
                {['percentage', 'flat', 'banner', 'package'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioButton}
                    onPress={() => setOfferForm({ ...offerForm, type })}
                  >
                    <Ionicons
                      name={offerForm.type === type ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color="#007AFF"
                    />
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Value (optional, for discounts)"
                value={offerForm.value}
                onChangeText={(text) => setOfferForm({ ...offerForm, value: text })}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.modalButton} onPress={saveOffer}>
                <Text style={styles.modalButtonText}>Save Offer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gallery Modal */}
      <Modal visible={showGalleryModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Gallery Image</Text>
              <TouchableOpacity onPress={() => setShowGalleryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.modalInput}
                placeholder="Description (optional)"
                value={galleryForm.description}
                onChangeText={(text) => setGalleryForm({ ...galleryForm, description: text })}
              />
              <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(true)}>
                <Ionicons name="image" size={20} color="#007AFF" />
                <Text style={styles.imageButtonText}>
                  {galleryForm.image_base64 ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
              {galleryForm.image_base64 && (
                <Image source={{ uri: galleryForm.image_base64 }} style={styles.previewImage} />
              )}
              <TouchableOpacity
                style={[styles.modalButton, !galleryForm.image_base64 && { opacity: 0.5 }]}
                onPress={saveGalleryItem}
                disabled={!galleryForm.image_base64}
              >
                <Text style={styles.modalButtonText}>Add to Gallery</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardDuration: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    width: '48%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryDelete: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
