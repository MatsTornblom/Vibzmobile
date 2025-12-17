import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Dimensions, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Share } from 'react-native';
import { useFonts } from 'expo-font';

const WebViewBridge = ({
  url = 'https://loveappneo.vibz.world',
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props
}) => {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/poppins-regular.ttf'),
  });

  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // JavaScript to inject into the WebView
  const injectedJavaScript = `
    (function() {
      // Set flag to indicate we're in React Native WebView
      window.isReactNativeWebView = true;
      window.ReactNativeWebView = {
        postMessage: function(message) {
          window.ReactNativeWebView.postMessage(message);
        }
      };
      
      // Debug logging
      if (__DEV__) console.log('React Native WebView bridge initialized');
      
      // Prevent default behavior that might interfere
      true;
    })();
  `;

  // Handle messages from the WebView
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (__DEV__) console.log('Received message from WebView:', data);

      if (data.type === 'share') {
        await handleShare(data);
      }
    } catch (error) {
      if (__DEV__) console.error('Error parsing WebView message:', error);
      sendMessageToWebView({
        type: 'shareResult',
        success: false,
        error: 'Failed to parse message'
      });
    }
  };

  // Handle native sharing
  const handleShare = async (shareData) => {
    try {
      const { url, title, text } = shareData;
      
      // Prepare share content
      const shareOptions = {
        title: title || 'Check this out!',
        message: text ? `${text}\n\n${url}` : url,
        url: url, // iOS specific
      };

      if (__DEV__) console.log('Sharing with options:', shareOptions);

      const result = await Share.share(shareOptions);
      
      // Send result back to WebView
      const response = {
        type: 'shareResult',
        success: true,
        action: result.action,
        activityType: result.activityType || null
      };

      if (__DEV__) console.log('Share result:', response);
      sendMessageToWebView(response);

    } catch (error) {
      if (__DEV__) console.error('Share error:', error);
      
      // Send error back to WebView
      sendMessageToWebView({
        type: 'shareResult',
        success: false,
        error: error.message
      });
    }
  };

  // Send message to WebView
  const sendMessageToWebView = (message) => {
    if (webViewRef.current) {
      const script = `
        window.dispatchEvent(new MessageEvent('message', {
          data: ${JSON.stringify(message)}
        }));
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Handle WebView load events
  const handleLoadStart = () => {
    setLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    if (__DEV__) console.error('WebView error:', nativeEvent);
    setLoading(false);
    onError?.(nativeEvent);

    setShowErrorBanner(true);

    Animated.timing(bannerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const dismissErrorBanner = () => {
    Animated.timing(bannerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowErrorBanner(false);
    });
  };

  return (
    <View style={[styles.container, style]}>
      {showErrorBanner && (
        <Animated.View style={[styles.errorBanner, { opacity: bannerOpacity }]}>
          <TouchableOpacity onPress={dismissErrorBanner} style={styles.bannerTouchable}>
            <Text style={[styles.bannerText, fontsLoaded && { fontFamily: 'Poppins-Regular' }]}>
              No network my friend.... Mr Vibz says let go of the phone and give someone near you a physical vibe instead. Maybe you'll get lucky...
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        {...props}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorBanner: {
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
  bannerTouchable: {
    width: '100%',
  },
  bannerText: {
    color: '#DC2727',
    fontSize: Math.min(width * 0.05, 24),
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: Math.min(width * 0.065, 32),
  },
});

export default WebViewBridge;