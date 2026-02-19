import { useState, useCallback, useEffect } from 'react';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import {
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator as RNActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'expo-router';

function MainComponent() {
    const { signOut } = useAuth();
    const router = useRouter();
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      async function fetchSnapshots() {
        try {
          const response = await fetch("/api/list-snapshots", { method: "POST" });
          if (!response.ok) {
            throw new Error(`Failed to fetch snapshots: ${response.status}`);
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setSnapshots(data.snapshots);
        } catch (err) {
          console.error("Error fetching snapshots:", err);
          setError(typeof err === "string" ? err : "Failed to load snapshots");
        } finally {
          setLoading(false);
        }
      }
  
      fetchSnapshots();
    }, []);
  
    const navigateToCanvas = useCallback(() => {
      router.push("/canvas");
    }, []);
  
    const navigateToHome = useCallback(() => {
      router.push("/expo-home");
    }, []);
  
    const openSnapshot = useCallback(({ id, url }) => {
      router.push(`/snapshot?id=${id}&url=${url}`);
    }, []);
  
    if (loading) {
      return (
        <RNSafeAreaView style={styles.container}>
          <RNView style={styles.loadingContainer}>
            <RNActivityIndicator color="#000000" />
            <RNText style={styles.loadingText}>loading...</RNText>
          </RNView>
        </RNSafeAreaView>
      );
    }
  
    return (
      <RNSafeAreaView style={styles.container}>
        <RNStatusBar style="dark" />
        <RNView style={styles.header}>
          <RNTouchableOpacity onPress={navigateToHome}>
            <RNText style={styles.titleOuter}>
              d<RNText style={styles.titleInner}>Ai</RNText>ly
            </RNText>
          </RNTouchableOpacity>
          <RNTouchableOpacity onPress={navigateToCanvas} style={styles.addButton}>
            <RNText style={styles.addButtonText}>+</RNText>
          </RNTouchableOpacity>
        </RNView>
  
        {error && (
          <RNView style={styles.errorContainer}>
            <RNText style={styles.errorText}>{error}</RNText>
          </RNView>
        )}
  
        <RNScrollView>
          <RNView style={styles.gridContainer}>
            {snapshots.map((snapshot, index) => (
              <RNTouchableOpacity
                key={snapshot.id}
                style={styles.imageContainer}
                onPress={() =>
                  openSnapshot({ id: snapshot.id, url: snapshot.image_url })
                }
              >
                <RNImage
                  source={{ uri: snapshot.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </RNTouchableOpacity>
            ))}
          </RNView>
        </RNScrollView>
      </RNSafeAreaView>
    );
  }
  
  const styles = RNStyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    loadingText: {
      fontFamily: "IBM Plex Mono",
      fontSize: 14,
      color: "#000000",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    titleOuter: {
      fontFamily: "mono",
      fontSize: 36,
      color: "#b5b5b5",
    },
    titleInner: {
      fontFamily: "mono",
      fontSize: 36,
      color: "#000000",
    },
    addButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    addButtonText: {
      fontFamily: "IBM Plex Mono",
      fontSize: 36,
      color: "#000000",
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 16,
      gap: 2,
    },
    imageContainer: {
      width: `${(100 / 8).toFixed(2)}%`,
      aspectRatio: 1,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    errorContainer: {
      padding: 16,
    },
    errorText: {
      fontFamily: "IBM Plex Mono",
      fontSize: 14,
      color: "#FF0000",
      textAlign: "center",
    },
  });
  
  
  
  export default MainComponent;
