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

export async function initiateGoogleLogin(): Promise<GoogleAuthResult> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'vibzworld',
    });

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      const { access_token, id_token } = result.params;

      return {
        success: true,
        accessToken: access_token,
        idToken: id_token,
      };
    } else if (result.type === 'error') {
      return {
        success: false,
        error: result.error?.message || 'Authentication failed',
      };
    } else {
      return {
        success: false,
        error: 'Authentication was cancelled',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
