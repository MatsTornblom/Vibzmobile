import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Alert, Share } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { initiateGoogleLogin } from '../utils/googleAuth';

interface PlatformWebViewProps {
  source: { uri: string };
  style?: any;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onNavigationStateChange?: (navState: any) => void;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
  scalesPageToFit?: boolean;
  bounces?: boolean;
  allowsBackForwardNavigationGestures?: boolean;
  ref?: React.RefObject<any>;
}

// Web-specific WebView component using iframe with complete fullscreen support
const WebWebView = React.forwardRef<any, PlatformWebViewProps>(
  ({ source, style, onLoadStart, onLoadEnd, onError, onNavigationStateChange, ...props }, ref) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = React.useState(source.uri);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => ({
      reload: () => {
        if (iframeRef.current) {
          setLoading(true);
          setError(null);
          iframeRef.current.src = currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_reload=' + Date.now();
        }
      },
      goBack: () => {
        console.log('Go back functionality limited in web iframe');
      },
      goForward: () => {
        console.log('Go forward functionality limited in web iframe');
      },
    }));

    const enterFullscreen = async () => {
      try {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any)?.mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else if ((containerRef.current as any)?.msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
      }
    };

    const handleLoad = () => {
      setLoading(false);
      setError(null);
      onLoadEnd?.();

      enterFullscreen();

      onNavigationStateChange?.({
        url: currentUrl,
        canGoBack: false,
        canGoForward: false,
        loading: false,
      });
    };

    const handleLoadStart = () => {
      setLoading(true);
      setError(null);
      onLoadStart?.();
    };

    const handleError = () => {
      setLoading(false);
      setError('This website cannot be displayed in the browser due to security restrictions. Try opening it in a new tab.');
      onError?.({ nativeEvent: { description: 'Failed to load page - X-Frame-Options restriction' } });
    };

    const openInNewTab = () => {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    };

    React.useEffect(() => {
      setCurrentUrl(source.uri);
      setLoading(true);
      setError(null);
    }, [source.uri]);

    if (error) {
      return (
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa' }, style]}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#dc3545', marginBottom: 12, textAlign: 'center' }}>
            Cannot Display Website
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            {error}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <button
              onClick={openInNewTab}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Open in New Tab
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </View>
        </View>
      );
    }

    return (
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          ...style 
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            color: '#fff',
            zIndex: 1,
          }}>
            <div style={{
              width: 50,
              height: 50,
              border: '4px solid #333',
              borderTop: '4px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: 20,
            }} />
            <div style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Loading website...</div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 300 }}>
              Will automatically enter fullscreen mode for immersive browsing
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={source.uri}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: loading ? 'none' : 'block',
          }}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation allow-top-navigation-by-user-activation"
          allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; vr; xr-spatial-tracking; fullscreen"
          loading="lazy"
          title="Web Browser Content"
          allowFullScreen
        />
      </div>
    );
  }
);

// Main PlatformWebView component
const PlatformWebView = React.forwardRef<any, PlatformWebViewProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(webViewRef.current);
      } else {
        (ref as React.MutableRefObject<any>).current = webViewRef.current;
      }
    }
  }, [ref]);

  const sendMessageToWebView = (message: any) => {
    if (webViewRef.current) {
      console.log('[Native App] Sending message to WebView:', message);
      const script = `
        (function() {
          console.log('[WebView] Received message from native:', ${JSON.stringify(JSON.stringify(message))});
          window.dispatchEvent(new MessageEvent('message', {
            data: ${JSON.stringify(message)}
          }));
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleShare = async (shareData: any) => {
    try {
      console.log('[Native App] handleShare called with:', shareData);
      const { url, title, text } = shareData;

      if (!url) {
        console.error('[Native App] Share error: URL is required');
        sendMessageToWebView({
          type: 'shareResult',
          success: false,
          error: 'URL is required for sharing'
        });
        return;
      }

      const shareOptions = {
        title: title || 'Check this out!',
        message: text ? `${text}\n\n${url}` : url,
        url: url,
      };

      console.log('[Native App] Calling Share.share with:', shareOptions);
      const result = await Share.share(shareOptions);
      console.log('[Native App] Share result:', result);

      sendMessageToWebView({
        type: 'shareResult',
        success: true,
        action: result.action,
        activityType: result.activityType || null
      });

    } catch (error) {
      console.error('[Native App] Share error:', error);
      sendMessageToWebView({
        type: 'shareResult',
        success: false,
        error: error instanceof Error ? error.message : 'Share failed'
      });
    }
  };

  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      console.log('[Native App] Received message:', event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[Native App] Parsed message:', data);

      if (data.type === 'GOOGLE_LOGIN_REQUEST') {
        const result = await initiateGoogleLogin();

        if (result.success && webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.postMessage({
              type: 'GOOGLE_LOGIN_SUCCESS',
              accessToken: '${result.accessToken}',
              idToken: '${result.idToken}'
            }, '*');
            true;
          `);
        } else if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            window.postMessage({
              type: 'GOOGLE_LOGIN_ERROR',
              error: '${result.error || 'Login failed'}'
            }, '*');
            true;
          `);
        }
      } else if (data.type === 'share') {
        console.log('[Native App] Processing share request');
        await handleShare(data);
      } else {
        console.log('[Native App] Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[Native App] Error handling WebView message:', error);
      sendMessageToWebView({
        type: 'shareResult',
        success: false,
        error: 'Failed to parse message: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const injectedJavaScript = `
    (function() {
      console.log('[WebView] Initializing bridge...');
      window.isReactNativeWebView = true;

      // Store the native postMessage function
      const nativePostMessage = window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView);

      // Override with our wrapper
      window.ReactNativeWebView = {
        postMessage: nativePostMessage
      };

      window.requestGoogleLogin = function() {
        console.log('[WebView] requestGoogleLogin called');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GOOGLE_LOGIN_REQUEST'
        }));
      };

      window.shareContent = function(shareData) {
        console.log('[WebView] shareContent called with:', shareData);
        try {
          const message = JSON.stringify({
            type: 'share',
            url: shareData.url,
            title: shareData.title,
            text: shareData.text
          });
          console.log('[WebView] Sending message:', message);
          window.ReactNativeWebView.postMessage(message);
        } catch (error) {
          console.error('[WebView] Error in shareContent:', error);
        }
      };

      console.log('[WebView] VibzWorld WebView Bridge Initialized');
      console.log('[WebView] window.isReactNativeWebView:', window.isReactNativeWebView);
      console.log('[WebView] window.shareContent:', typeof window.shareContent);
    })();
    true;
  `;

  if (Platform.OS === 'web') {
    return <WebWebView {...props} ref={ref} />;
  }

  // For mobile platforms, use react-native-webview with OAuth support
  return (
    <WebView
      {...props}
      ref={webViewRef}
      userAgent="VibzWorldApp/1.0"
      onMessage={handleWebViewMessage}
      injectedJavaScript={injectedJavaScript}
    />
  );
});

export default PlatformWebView;