import { useCallback, useState } from 'react';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import * as RNSkia from '@shopify/react-native-skia';
import * as RNReanimated from 'react-native-reanimated';
import RNFontAwesome from '@expo/vector-icons/FontAwesome';
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator as RNActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import * as RNGestureHandler from 'react-native-gesture-handler';
import useUpload from '@/utils/useUpload';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'expo-router';

function MainComponent() {
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { signOut, isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const [upload] = useUpload();

  const skiaCanvasRef = RNSkia.useCanvasRef();
  const cachedStrokes = RNReanimated.useSharedValue([]);
  const currentStroke = RNReanimated.useSharedValue('');

  const clearCanvas = useCallback(() => {
    cachedStrokes.value = [];
  }, []);

  const saveCanvas = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Check authentication first
      if (!isAuthenticated) {
        router.replace('/expo-home');
        return;
      }

      // Check if there are any strokes to save
      if (cachedStrokes.value.length === 0) {
        setError('please draw something first');
        return;
      }

      setIsSaving(true);
      const snapshot = skiaCanvasRef.current?.makeImageSnapshot();
      if (snapshot) {
        const base64 = snapshot.encodeToBase64();
        if (base64) {
          const { url, error: uploadError } = await upload({
            base64: `data:image/png;base64,${base64}`,
          });

          if (uploadError) {
            throw new Error(uploadError);
          }

          const response = await fetch('/api/create-snapshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_url: url,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save snapshot');
          }

          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }

          router.push(
            `/enhance?id=${data.snapshot.id}&url=${encodeURIComponent(url)}`
          );
        } else {
          setError('Could not encode snapshot');
        }
      } else {
        setError('Could not create snapshot');
      }
    } catch (err) {
      console.error('Error saving canvas:', err);
      setError('something went wrong. please try again');
    } finally {
      setIsSaving(false);
    }
  }, [router, upload, cachedStrokes, isAuthenticated]);

  const cachedPicture = RNReanimated.useDerivedValue(
    () =>
      RNSkia.createPicture((canvas) => {
        const paint = RNSkia.Skia.Paint();
        paint.setStrokeCap(RNSkia.StrokeCap.Round);
        paint.setStyle(RNSkia.PaintStyle.Stroke);

        for (const cachedStroke of cachedStrokes.value) {
          const [stroke, details] = cachedStroke;
          const { strokeColor, strokeWidth } = details;

          paint.setColor(RNSkia.Skia.Color(strokeColor));
          paint.setStrokeWidth(strokeWidth);

          canvas.drawPath(stroke, paint);
        }
      }),
    [cachedStrokes]
  );

  const colors = [
    '#000000',
    '#FFC107',
    '#2196F3',
    '#4CAF50',
    '#F44336',
    '#9C27B0',
    '#FFFFFF',
  ];

  const panGesture = RNGestureHandler.Gesture.Pan()
    .onBegin((e) => {
      currentStroke.value = `M ${e.x} ${e.y} L ${e.x} ${e.y}`;
    })
    .onChange((e) => {
      currentStroke.value += ` L ${e.x} ${e.y}`;
    })
    .onFinalize(() => {
      cachedStrokes.value = [
        ...cachedStrokes.value,
        [
          RNSkia.Skia.Path.MakeFromSVGString(currentStroke.value),
          { strokeColor: selectedColor, strokeWidth },
        ],
      ];
      currentStroke.value = '';
    })
    .minPointers(1)
    .maxPointers(1)
    .minDistance(1);

  if (!isReady) {
    return (
      <RNView style={styles.loadingContainer}>
        <RNActivityIndicator color="#000000" />
      </RNView>
    );
  }

  return (
    <RNSafeAreaView style={styles.container}>
      <RNStatusBar style="dark" />

      <RNView style={styles.header}>
        {isAuthenticated && (
          <RNTouchableOpacity
            onPress={() => router.push('/gallery')}
            style={styles.backButton}
          >
            <RNText style={styles.backButtonText}>←</RNText>
          </RNTouchableOpacity>
        )}
        <RNText
          style={[
            styles.dateText,
            {
              flex: 1,
              textAlign: 'center',
              paddingHorizontal: 16,
            },
          ]}
        >
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </RNText>
      </RNView>

      <RNView style={styles.colorList}>
        {colors.map((color) => (
          <RNTouchableOpacity
            key={color}
            onPress={() => setSelectedColor(color)}
            style={[
              styles.colorButton,
              {
                backgroundColor: color,
                borderWidth: selectedColor === color ? 2 : 1,
                borderColor: color === '#FFFFFF' ? '#000000' : 'transparent',
              },
            ]}
          >
            {color === '#FFFFFF' && (
              <RNFontAwesome
                name="eraser"
                size={14}
                color="#000000"
                style={styles.eraserIcon}
              />
            )}
          </RNTouchableOpacity>
        ))}
      </RNView>

      <RNView style={styles.canvasContainer}>
        <RNGestureHandler.GestureDetector gesture={panGesture}>
          <RNSkia.Canvas ref={skiaCanvasRef} style={styles.canvas}>
            <RNSkia.Picture picture={cachedPicture} />
            <RNSkia.Path
              path={currentStroke}
              color={selectedColor}
              strokeWidth={strokeWidth}
              style="stroke"
              strokeCap="round"
            />
          </RNSkia.Canvas>
        </RNGestureHandler.GestureDetector>
      </RNView>

      <RNView style={styles.footer}>
        <RNTouchableOpacity
          onPress={saveCanvas}
          disabled={isSaving}
          style={[styles.button, styles.doneButton]}
        >
          <RNText style={styles.buttonText}>
            {isSaving ? '...' : isAuthenticated ? 'done' : 'sign in to save'}
          </RNText>
        </RNTouchableOpacity>

        <RNTouchableOpacity
          onPress={clearCanvas}
          style={[styles.button, styles.clearButton]}
        >
          <RNText style={styles.clearButtonText}>clear</RNText>
        </RNTouchableOpacity>
      </RNView>

      {error && <RNText style={styles.errorText}>{error}</RNText>}
    </RNSafeAreaView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
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
  dateText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    paddingTop: 16,
    color: '#86868B',
    letterSpacing: 0.5,
  },
  colorList: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  canvas: {
    flex: 1,
  },
  footer: {
    padding: 16,
    gap: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#000000',
  },
  clearButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
  },
  clearButtonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#000000',
  },
  errorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 8,
  },
  eraserIcon: {
    opacity: 0.6,
  },
});
export default MainComponent;
