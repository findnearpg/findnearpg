import * as React from 'react';
import RNIonicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import * as RNReanimated from 'react-native-reanimated';
import { useRouter, useSearchParams } from 'expo-router';
import { Image as RNImage } from 'expo-image';
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  StyleSheet as RNStyleSheet,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';

function MainComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const imageUrl = searchParams.get('url');

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState(null);

  const spinValue = RNReanimated.useSharedValue(0);

  React.useEffect(() => {
    if (loading) {
      spinValue.value = 0;
      spinValue.value = RNReanimated.withRepeat(
        RNReanimated.withTiming(360, {
          duration: 1000,
          easing: RNReanimated.Easing.linear,
        }),
        -1
      );
    } else {
      spinValue.value = 0;
    }
  }, [loading]);

  const animatedStyle = RNReanimated.useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinValue.value}deg` }],
    };
  });

  const handleEnhance = async () => {
    if (!description.trim()) {
      setError('please enter a description');
      return;
    }

    if (!imageUrl) {
      setError('no image provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/modify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'failed to enhance image');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setEnhancedImageUrl(data.enhanced_url);
    } catch (err) {
      console.error('Error enhancing image:', err);
      setError(err.message || 'failed to enhance image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!enhancedImageUrl || !id) {
      setError('no enhanced image to save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/update-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          enhanced_image_url: enhancedImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'failed to save enhanced image');
      }

      router.push('/gallery');
    } catch (err) {
      console.error('Error saving enhanced image:', err);
      setError(err.message || 'failed to save enhanced image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RNKeyboardAvoidingView
      behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <RNSafeAreaView style={styles.safeArea}>
        <RNStatusBar style="dark" />

        <RNView style={styles.header}>
          <RNTouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <RNText style={styles.backButtonText}>←</RNText>
          </RNTouchableOpacity>
        </RNView>

        <RNScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <RNView style={styles.content}>
            <RNView style={styles.imageContainer}>
              <RNImage
                source={{ uri: enhancedImageUrl || imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </RNView>

            <RNView style={styles.inputContainer}>
              <RNText style={styles.inputLabel}>what did you draw?</RNText>
              <RNTextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="a smiling sun"
                placeholderTextColor="rgba(0,0,0,0.3)"
                multiline={false}
              />
            </RNView>

            {error && <RNText style={styles.errorText}>{error}</RNText>}

            <RNView style={styles.buttonContainer}>
              <RNTouchableOpacity
                onPress={enhancedImageUrl ? handleSave : handleEnhance}
                disabled={loading}
                style={styles.primaryButton}
              >
                {loading ? (
                  <RNReanimated.default.View style={animatedStyle}>
                    <RNIonicons
                      name="reload-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                  </RNReanimated.default.View>
                ) : (
                  <RNText style={styles.primaryButtonText}>
                    {enhancedImageUrl ? 'save' : 'make it real'}
                  </RNText>
                )}
              </RNTouchableOpacity>

              <RNTouchableOpacity
                onPress={() => router.push('/gallery')}
                style={styles.galleryButton}
              >
                <RNText style={styles.galleryButtonText}>go to gallery</RNText>
              </RNTouchableOpacity>
            </RNView>
          </RNView>
        </RNScrollView>
      </RNSafeAreaView>
    </RNKeyboardAvoidingView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 100,
    marginBottom: 80,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 7,
  },
  primaryButtonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  galleryButtonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    color: '#000000',
  },
  errorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
});
export default MainComponent;
