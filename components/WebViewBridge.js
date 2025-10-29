import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Share } from 'react-native';

const WebViewBridge = ({ 
  url = 'https://loveappneo.vibz.world',
  onLoadStart,
  onLoadEnd,
  onError,
  style,
  ...props 
}) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

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
      console.log('React Native WebView bridge initialized');
      
      // Prevent default behavior that might interfere
      true;
    })();
  `;

  // Handle messages from the WebView
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data);

      if (data.type === 'share') {
        await handleShare(data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
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

      console.log('Sharing with options:', shareOptions);

      const result = await Share.share(shareOptions);
      
      // Send result back to WebView
      const response = {
        type: 'shareResult',
        success: true,
        action: result.action,
        activityType: result.activityType || null
      };

      console.log('Share result:', response);
      sendMessageToWebView(response);

    } catch (error) {
      console.error('Share error:', error);
      
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
    console.error('WebView error:', nativeEvent);
    setLoading(false);
    onError?.(nativeEvent);
    
    Alert.alert(
      'Connection Error',
      'Failed to load the app. Please check your internet connection.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, style]}>
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
});

export default WebViewBridge;