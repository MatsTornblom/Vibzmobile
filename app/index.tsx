import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import PlatformWebView from '@/components/PlatformWebView';
import { useNotificationContext } from '@/contexts/NotificationContext';

const START_PAGE_URL = 'https://loveappneo.vibz.world';

export default function BrowserScreen() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/poppins-regular.ttf'),
  });

  const webViewRef = useRef<any>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const { url } = useLocalSearchParams<{ url?: string }>();
  const notificationContext = useNotificationContext();
  const [showFirstInstallBanner, setShowFirstInstallBanner] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const [currentUrl, setCurrentUrl] = useState(() => {
    if (notificationContext.notificationNavigationUrl) {
      if (__DEV__) console.log('[Browser] Initializing with notification URL:', notificationContext.notificationNavigationUrl);
      return notificationContext.notificationNavigationUrl;
    }
    if (url && typeof url === 'string') {
      if (__DEV__) console.log('[Browser] Initializing with deep link URL:', url);
      return decodeURIComponent(url);
    }
    return START_PAGE_URL;
  });

  useEffect(() => {
    if (notificationContext.notificationNavigationUrl) {
      if (__DEV__) console.log('[Browser] Notification URL changed, updating to:', notificationContext.notificationNavigationUrl);
      setCurrentUrl(notificationContext.notificationNavigationUrl);
    } else if (url && typeof url === 'string') {
      const decodedUrl = decodeURIComponent(url);
      if (__DEV__) console.log('[Browser] Deep link URL changed, updating to:', decodedUrl);
      setCurrentUrl(decodedUrl);
    }
  }, [url, notificationContext.notificationNavigationUrl]);

  useEffect(() => {
    if (notificationContext.firstInstallDetected) {
      setShowFirstInstallBanner(true);

      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowFirstInstallBanner(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationContext.firstInstallDetected]);

  const formatUrl = (inputUrl: string): string => {
    if (!inputUrl.trim()) return '';

    let cleanUrl = inputUrl.trim();

    if (!cleanUrl.includes('.') || (cleanUrl.includes(' ') && cleanUrl.split(' ').length > 1)) {
      return `https://www.google.com/search?q=${encodeURIComponent(cleanUrl)}`;
    }

    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');

    if (!cleanUrl.includes('://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    return cleanUrl;
  };

  const handleNavigate = () => {
    const formattedUrl = formatUrl(urlInput);
    if (formattedUrl) {
      setCurrentUrl(formattedUrl);
      setShowUrlModal(false);
      Keyboard.dismiss();
    }
  };

  const handleCancel = () => {
    setShowUrlModal(false);
    Keyboard.dismiss();
  };

  const handleLongPress = () => {
    setUrlInput(currentUrl);
    setShowUrlModal(true);
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      handleLongPress();
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const dismissBanner = () => {
    Animated.timing(bannerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFirstInstallBanner(false);
    });
  };

  return (
    <View style={styles.container}>
      {showFirstInstallBanner && (
        <Animated.View style={[styles.firstInstallBanner, { opacity: bannerOpacity }]}>
          <Text style={[styles.bannerText, fontsLoaded && { fontFamily: 'Poppins-Regular' }]}>
            You got the app! Go spread Vibz!
          </Text>
        </Animated.View>
      )}

      <View
        style={styles.hiddenTrigger}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      <PlatformWebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        allowsBackForwardNavigationGestures={true}
        notificationContext={notificationContext}
      />

      <Modal
        visible={showUrlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Navigate to URL</Text>

                <TextInput
                  style={styles.input}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="Enter URL or search query"
                  placeholderTextColor="#8E8E93"
                  autoFocus={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleNavigate}
                />

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.goButton]}
                    onPress={handleNavigate}
                  >
                    <Text style={styles.goButtonText}>Go</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  firstInstallBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff5cf',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerText: {
    color: '#DC2727',
    fontSize: Math.min(width * 0.05, 24),
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: Math.min(width * 0.065, 32),
  },
  hiddenTrigger: {
    position: 'absolute',
    top: '45%',
    left: 0,
    width: 40,
    height: '10%',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  webView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  goButton: {
    backgroundColor: '#007AFF',
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});