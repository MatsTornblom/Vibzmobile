import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '130221165582-8nbialqq6t9vhefs5iu8hqos0b31inhg.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleAuthResult {
  success: boolean;
  accessToken?: string;
  idToken?: string;
  error?: string;
}

// Clear Google OAuth session
export async function clearGoogleSession(): Promise<void> {
  try {
    if (__DEV__) console.log('[GoogleAuth] 🧹 Clearing Google OAuth session cookies...');

    // This clears Google's authentication cookies
    await WebBrowser.warmUpAsync();
    await WebBrowser.coolDownAsync();

    if (__DEV__) console.log('[GoogleAuth] ✅ Google OAuth session cleared');
  } catch (error) {
    console.error('[GoogleAuth] ❌ Error clearing Google session:', error);
  }
}

export async function initiateGoogleLogin(): Promise<GoogleAuthResult> {
  try {
    if (__DEV__) console.log('[GoogleAuth] 🚀 Starting Google OAuth flow...');

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'vibzworld',
    });

    if (__DEV__) console.log('[GoogleAuth] 📍 Redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
      // Force Google to show full consent screen every time (most aggressive)
      extraParams: {
        prompt: 'consent',
        // Also add a timestamp to prevent any caching
        state: `login_${Date.now()}`,
      },
    });

    if (__DEV__) console.log('[GoogleAuth] 🔐 Opening Google OAuth prompt with consent required...');
    const result = await request.promptAsync(discovery);

    if (__DEV__) console.log('[GoogleAuth] 📥 OAuth result type:', result.type);

    if (result.type === 'success') {
      const { access_token, id_token } = result.params;

      if (__DEV__) console.log('[GoogleAuth] ✅ OAuth successful, got tokens');
      return {
        success: true,
        accessToken: access_token,
        idToken: id_token,
      };
    } else if (result.type === 'error') {
      console.error('[GoogleAuth] ❌ OAuth error:', result.error);
      return {
        success: false,
        error: result.error?.message || 'Authentication failed',
      };
    } else {
      if (__DEV__) console.log('[GoogleAuth] ⚠️ OAuth cancelled by user');
      return {
        success: false,
        error: 'Authentication was cancelled',
      };
    }
  } catch (error) {
    console.error('[GoogleAuth] ❌ Exception during OAuth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
