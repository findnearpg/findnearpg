import { Image as RNImage } from 'expo-image';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import {
  View as RNView,
  Text as RNText,
  StyleSheet as RNStyleSheet,
  TouchableOpacity as RNTouchableOpacity
} from 'react-native';
import { useUser } from '@/utils/useUser';
import { useRouter } from 'expo-router';

export default function MainComponent() {
  const router = useRouter();
  const { data: user, loading } = useUser();

  const navigateToCanvas = () => {
    router.push('/canvas');
  };

  return (
    <RNSafeAreaView style={styles.container}>
      <RNStatusBar style="dark" />

      <RNImage
        source={{
          uri: 'https://ucarecdn.com/4d5374d7-d157-42a9-b660-99a9cd04f65c/-/format/auto/',
        }}
        accessibilityLabel={'pink bubbles'}
        style={[
          styles.floatingImage,
          { top: '10%', left: '5%', transform: [{ rotate: '-10deg' }] },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/d321f7b8-50cc-4ae5-8f0a-5d1378556cf1/-/format/auto/',
        }}
        accessibilityLabel={'landscape'}
        style={[
          styles.floatingImage,
          { top: '20%', right: '5%', transform: [{ rotate: '10deg' }] },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/09661b8d-5a1c-4023-9dc4-9a0af77f990b/-/format/auto/',
        }}
        accessibilityLabel={'happy sun'}
        style={[
          styles.floatingImage,
          { bottom: '35%', left: '5%', transform: [{ rotate: '-10deg' }] },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/c9ab61bb-a851-499d-ba9e-10e4b3f177cf/-/format/auto/',
        }}
        accessibilityLabel={'pink landscape'}
        style={[
          styles.floatingImage,
          { bottom: '40%', right: '-2%', transform: [{ rotate: '-8deg' }] },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/af93b004-374e-4339-9756-9ceb6eb9341f/-/format/auto/',
        }}
        accessibilityLabel={'grass letter G'}
        style={[
          styles.floatingImage,
          {
            position: 'absolute',
            bottom: '-5%',
            left: '-8%',
            transform: [{ rotate: '8deg' }],
          },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/86a3392f-741d-4844-bf87-96fa5f6d5802/-/format/auto/',
        }}
        accessibilityLabel={'dragon on a rock'}
        style={[
          styles.floatingImage,
          {
            position: 'absolute',
            bottom: '62%',
            left: '-10%',
          },
        ]}
      />
      <RNView style={styles.titleContainer}>
        <RNText style={styles.titleOuter}>
          d<RNText style={styles.titleInner}>Ai</RNText>ly sketch
        </RNText>
      </RNView>

      <RNView style={styles.bottomContainer}>
        <RNView style={styles.buttonContainer}>
          <RNTouchableOpacity onPress={navigateToCanvas} style={styles.button}>
            <RNText style={styles.buttonText}>start</RNText>
          </RNTouchableOpacity>
        </RNView>
      </RNView>
    </RNSafeAreaView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: 50,
  },
  floatingImage: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  titleOuter: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 24,
    color: '#b5b5b5',
    letterSpacing: 1.2,
  },
  titleInner: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 24,
    color: '#000000',
    letterSpacing: 1.2,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: '80%',
    backgroundColor: '#000000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 7,
  },
  buttonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: '1.1',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
