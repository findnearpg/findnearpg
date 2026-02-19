import { useState, useCallback, useEffect } from 'react';
import * as RNReanimated from 'react-native-reanimated';
import { useRouter, useSearchParams } from 'expo-router';
import RNFontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator as RNActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';

function MainComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const snapshotUrl = searchParams.get('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [currentImageURL, setCurrentImageURL] = useState(snapshotUrl);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEnhanceOrView = useCallback(() => {
    if (snapshot?.enhanced_image_url) {
      setCurrentImageURL(snapshot.enhanced_image_url);
    } else {
      router.push(`/enhance?id=${id}&url=${encodeURIComponent(snapshotUrl)}`);
    }
  }, [id, snapshotUrl, snapshot]);

  const handleDelete = useCallback(async () => {
    if (!id || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await fetch('/api/delete-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete snapshot');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      router.replace('/gallery');
    } catch (err) {
      console.error('Error deleting snapshot:', err);
      setError(err.message);
      setIsDeleting(false);
    }
  }, [id, isDeleting]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggleImage = useCallback(() => {
    setCurrentImageURL(
      currentImageURL === snapshotUrl
        ? snapshot?.enhanced_image_url
        : snapshotUrl
    );
  }, [currentImageURL, snapshotUrl, snapshot?.enhanced_image_url]);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/get-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch snapshot');
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setSnapshot(data.snapshot);
      } catch (err) {
        console.error('Error fetching snapshot:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [id]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <RNSafeAreaView style={styles.container}>
      <RNStatusBar style="dark" />

      <RNView style={styles.header}>
        <RNTouchableOpacity onPress={handleBack} style={styles.backButton}>
          <RNText style={styles.backButtonText}>←</RNText>
        </RNTouchableOpacity>
        <RNTouchableOpacity
          onPress={handleDelete}
          style={styles.deleteButton}
          disabled={isDeleting}
        >
          <RNFontAwesome name="trash" size={24} color="#000000" />
        </RNTouchableOpacity>
      </RNView>

      {snapshot?.created_at && (
        <RNView style={styles.dateContainer}>
          <RNText style={styles.dateText}>
            {formatDate(snapshot.created_at)}
          </RNText>
        </RNView>
      )}

      <RNView style={styles.imageContainer}>
        {currentImageURL ? (
          <RNReanimated.default.Image
            source={{ uri: currentImageURL }}
            style={styles.image}
            resizeMode="contain"
            sharedTransitionTag={id ? id.toString() : ''}
          />
        ) : (
          <RNView style={styles.noImageContainer}>
            <RNText style={styles.errorText}>Image not available</RNText>
          </RNView>
        )}
      </RNView>

      <RNView style={styles.footer}>
        <RNView style={styles.buttonGroup}>
          <RNTouchableOpacity
            onPress={handleEnhanceOrView}
            disabled={loading}
            style={styles.iconButton}
          >
            <RNFontAwesome
              name={snapshot?.enhanced_image_url ? 'image' : 'magic'}
              size={20}
              color="#000000"
            />
          </RNTouchableOpacity>
          <RNTouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleImage}
            disabled={!snapshot?.enhanced_image_url}
          >
            <RNFontAwesome
              name="pencil"
              size={20}
              color={snapshot?.enhanced_image_url ? '#000000' : '#CCCCCC'}
            />
          </RNTouchableOpacity>
        </RNView>
      </RNView>

      {(loading || isDeleting) && (
        <RNView style={styles.loadingOverlay}>
          <RNActivityIndicator color="#000000" />
        </RNView>
      )}
    </RNSafeAreaView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  deleteButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 32,
    color: '#000000',
  },
  imageContainer: {
    flex: 1,
    margin: 0,
    marginTop: -20,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...RNStyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#86868B',
    letterSpacing: 0.5,
  },
});

export default MainComponent;
