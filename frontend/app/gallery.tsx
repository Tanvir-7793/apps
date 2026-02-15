import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');
const imageWidth = (width - 48) / 2;

export default function GalleryScreen() {
  const [gallery, setGallery] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/gallery`);
      setGallery(response.data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGallery();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Work</Text>
        <Text style={styles.headerSubtitle}>Gallery of our best detailing jobs</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.galleryGrid}>
          {gallery.map((item: any, index: number) => (
            <View key={item.id} style={styles.galleryItem}>
              <Image
                source={{ uri: item.image_base64 }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
              {item.description && (
                <View style={styles.descriptionOverlay}>
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
        {gallery.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No gallery images yet</Text>
          </View>
        )}
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
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  galleryItem: {
    width: imageWidth,
    height: imageWidth,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  descriptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  descriptionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
