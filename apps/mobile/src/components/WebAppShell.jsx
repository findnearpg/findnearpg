import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

function getBaseAppUrl() {
  return process.env.EXPO_PUBLIC_BASE_URL || process.env.EXPO_PUBLIC_APP_URL || '';
}

function sameOrigin(urlA, urlB) {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    return a.origin === b.origin;
  } catch {
    return false;
  }
}

export default function WebAppShell() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const baseAppUrl = useMemo(() => getBaseAppUrl(), []);

  const handleNativeBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleNativeBack);
    return () => sub.remove();
  }, [handleNativeBack]);

  if (!baseAppUrl) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.messageWrap}>
          <Text style={styles.title}>Missing mobile configuration</Text>
          <Text style={styles.subtitle}>
            Set `EXPO_PUBLIC_BASE_URL` or `EXPO_PUBLIC_APP_URL` in `apps/mobile/.env`.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.messageWrap}>
          <Text style={styles.title}>Could not load web app</Text>
          <Text style={styles.subtitle}>Check internet connection and server availability.</Text>
          <Pressable
            style={styles.button}
            onPress={() => {
              setHasError(false);
              setReloadKey((x) => x + 1);
            }}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ uri: baseAppUrl }}
        startInLoadingState
        setBuiltInZoomControls={false}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0f8f8b" />
          </View>
        )}
        onNavigationStateChange={(state) => {
          setCanGoBack(Boolean(state.canGoBack));
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (sameOrigin(request.url, baseAppUrl)) return true;
          Linking.openURL(request.url).catch(() => {});
          return false;
        }}
        onError={() => setHasError(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  messageWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#073735',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5d5c',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#0f8f8b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
