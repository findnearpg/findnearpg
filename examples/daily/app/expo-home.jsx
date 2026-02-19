import { useState, useCallback } from 'react';
import RNFontAwesome from '@expo/vector-icons/FontAwesome';
import * as RNBottomSheet from '@gorhom/bottom-sheet';
import { Image as RNImage } from 'expo-image';
import { StatusBar as RNStatusBar } from 'expo-status-bar';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import * as RNLinking from 'expo-linking';
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator as RNActivityIndicator,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { useUser } from '@/utils/useUser';
import { useAuth } from '@/utils/useAuth';
import { useRouter } from 'expo-router';

function MainComponent() {
  const { signIn, signUp, signOut, isAuthenticated, isReady } = useAuth();
  const { data: user, loading } = useUser();
  const [error, setError] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signIn({ redirect: false });
      setError(null);
    } catch (err) {
      setError('unable to sign in');
      console.error('Sign in error:', err);
    }
  };

  const handleSignUp = async () => {
    try {
      await signUp({ redirect: false });
      setError(null);
    } catch (err) {
      setError('unable to create account');
      console.error('Sign up error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setError(null);
    } catch (err) {
      setError('unable to sign out');
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteAccountPress = () => {
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await signOut();
      setError(null);
      setDeleteConfirmVisible(false);
    } catch (err) {
      setError('Unable to delete account');
      console.error('Delete account error:', err);
    }
  };

  const navigateToGallery = () => {
    router.push('/gallery');
  };

  const handlePrivacyPolicy = () => {
    RNLinking.openURL('https://drawdaily.created.app');
    setMenuVisible(false);
  };

  const handleTitlePress = () => {
    if (isAuthenticated) {
      router.push('/');
    }
  };

  const renderBackdrop = useCallback(
    (props) => (
      <RNBottomSheet.BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  if (!isReady) {
    return (
      <RNView style={styles.container}>
        <RNActivityIndicator color="#000000" />
      </RNView>
    );
  }

  if (!isAuthenticated) {
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
            { bottom: '30%', left: '5%', transform: [{ rotate: '-10deg' }] },
          ]}
        />
        <RNImage
          source={{
            uri: 'https://ucarecdn.com/c9ab61bb-a851-499d-ba9e-10e4b3f177cf/-/format/auto/',
          }}
          accessibilityLabel={'pink landscape'}
          style={[
            styles.floatingImage,
            { bottom: '30%', right: '-2%', transform: [{ rotate: '-8deg' }] },
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
          <RNTouchableOpacity onPress={handleTitlePress}>
            <RNText style={styles.titleOuter}>
              d<RNText style={styles.titleInner}>Ai</RNText>ly sketch
            </RNText>
          </RNTouchableOpacity>
        </RNView>

        <RNView style={styles.bottomContainer}>
          <RNView style={styles.buttonContainer}>
            <RNTouchableOpacity onPress={handleSignUp} style={styles.button}>
              <RNText style={styles.buttonText}>sign up</RNText>
            </RNTouchableOpacity>

            <RNTouchableOpacity onPress={handleSignIn} style={styles.buttonAlt}>
              <RNText style={styles.buttonAltText}>log in</RNText>
            </RNTouchableOpacity>
          </RNView>

          {error && <RNText style={styles.errorText}>{error}</RNText>}
        </RNView>
      </RNSafeAreaView>
    );
  }

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
          { bottom: '25%', left: '5%', transform: [{ rotate: '-10deg' }] },
        ]}
      />
      <RNImage
        source={{
          uri: 'https://ucarecdn.com/c9ab61bb-a851-499d-ba9e-10e4b3f177cf/-/format/auto/',
        }}
        accessibilityLabel={'pink landscape'}
        style={[
          styles.floatingImage,
          { bottom: '20%', right: '-2%', transform: [{ rotate: '-8deg' }] },
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
      <RNTouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={[
          styles.menuButton,
          {
            top: '7%',
            right: '5%',
            transform: [{ rotate: '-10deg' }],
          },
        ]}
      >
        <RNView style={{ transform: [{ rotate: '10deg' }] }}>
          <RNFontAwesome name="shield" size={24} color="#000000" />
        </RNView>
      </RNTouchableOpacity>
      <RNView style={styles.content}>
        <RNView style={styles.welcomeContainer}>
          <RNView style={styles.headerRow}>
            <RNText style={styles.welcomeText}>
              welcome{user?.name ? `, ${user.name}` : ''}!
            </RNText>
          </RNView>
        </RNView>

        <RNView style={styles.buttonContainer}>
          <RNTouchableOpacity onPress={navigateToGallery} style={styles.button}>
            <RNText style={styles.buttonText}>go to gallery</RNText>
          </RNTouchableOpacity>

          <RNTouchableOpacity onPress={handleSignOut} style={styles.buttonAlt}>
            <RNText style={styles.buttonAltText}>sign out</RNText>
          </RNTouchableOpacity>
        </RNView>

        <RNView style={styles.deleteButtonContainer}>
          <RNTouchableOpacity
            onPress={handleDeleteAccountPress}
            style={styles.buttonDanger}
          >
            <RNText style={styles.buttonDangerText}>delete account</RNText>
          </RNTouchableOpacity>
        </RNView>

        {error && <RNText style={styles.errorText}>{error}</RNText>}
      </RNView>

      {menuVisible && (
        <RNTouchableOpacity
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        />
      )}

      <RNBottomSheet.default
        index={menuVisible ? 0 : -1}
        snapPoints={['25%']}
        enablePanDownToClose
        onClose={() => setMenuVisible(false)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backdropComponent={renderBackdrop}
      >
        <RNBottomSheet.BottomSheetView style={styles.menuContent}>
          <RNTouchableOpacity
            onPress={handlePrivacyPolicy}
            style={styles.menuItem}
          >
            <RNText style={styles.menuItemTextNeutral}>Privacy Policy</RNText>
          </RNTouchableOpacity>
        </RNBottomSheet.BottomSheetView>
      </RNBottomSheet.default>

      <RNBottomSheet.default
        index={privacyPolicyVisible ? 0 : -1}
        snapPoints={['80%']}
        enablePanDownToClose
        onClose={() => setPrivacyPolicyVisible(false)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backdropComponent={renderBackdrop}
      >
        <RNBottomSheet.BottomSheetView style={styles.privacyPolicyContent}>
          <RNText style={styles.privacyPolicyTitle}>Privacy Policy</RNText>
        </RNBottomSheet.BottomSheetView>
      </RNBottomSheet.default>

      <RNBottomSheet.default
        index={deleteConfirmVisible ? 0 : -1}
        snapPoints={['25%']}
        enablePanDownToClose
        onClose={() => setDeleteConfirmVisible(false)}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backdropComponent={renderBackdrop}
      >
        <RNBottomSheet.BottomSheetView style={styles.confirmContent}>
          <RNText style={styles.confirmTitle}>are you sure?</RNText>
          <RNText style={{ marginBottom: 20, color: 'white' }}>
            (all drawings and ai enhanced drawings will be deleted)
          </RNText>
          <RNView style={styles.confirmButtons}>
            <RNTouchableOpacity
              onPress={() => setDeleteConfirmVisible(false)}
              style={styles.confirmButtonCancel}
            >
              <RNText style={styles.confirmButtonCancelText}>no</RNText>
            </RNTouchableOpacity>
            <RNTouchableOpacity
              onPress={handleConfirmDelete}
              style={styles.confirmButtonDelete}
            >
              <RNText style={styles.confirmButtonDeleteText}>yes</RNText>
            </RNTouchableOpacity>
          </RNView>
        </RNBottomSheet.BottomSheetView>
      </RNBottomSheet.default>
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
    gap: 10,
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
  buttonAlt: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    letterSpacing: '1.1',
  },
  buttonAltText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#000000',
    letterSpacing: '1.1',
  },
  buttonDanger: {
    width: '80%',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 7,
  },
  buttonDangerText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: '1.1',
  },
  errorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FF0000',
    marginTop: 20,
    textAlign: 'center',
  },
  welcomeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
  },
  emailText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#86868B',
    marginBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 24,
    color: '#000000',
    marginBottom: 8,
  },
  emailText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#86868B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetBackground: {
    backgroundColor: '#1D1D1F',
  },
  bottomSheetIndicator: {
    backgroundColor: '#424245',
  },
  menuContent: {
    padding: 16,
  },
  menuItem: {
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  menuItemTextNeutral: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  privacyPolicyContent: {
    padding: 20,
    flex: 1,
  },
  privacyPolicyTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  privacyPolicyScroll: {
    flex: 1,
  },
  privacyPolicyText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  confirmContent: {
    paddingTop: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    marginBottom: 25,
  },
  confirmButtonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 7,
    backgroundColor: '#424245',
  },
  confirmButtonCancelText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1.1,
  },
  confirmButtonDelete: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
  },
  confirmButtonDeleteText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1.1,
  },
  deleteButtonContainer: {
    width: '80%',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
});

export default MainComponent;
