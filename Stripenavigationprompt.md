Intercept Stripe checkout URLs in WebView and open in system browser

In the app's WebView component (the one that loads our web app), I need to intercept any navigation to Stripe's checkout page and open it in the device's native browser instead of inside the WebView. Stripe checkout doesn't work properly inside a WebView.

What to do:

Find the WebView component that loads our web app (it loads URLs from vibz.world domains).
Add onShouldStartLoadWithRequest to the WebView that checks if the URL contains checkout.stripe.com. If it does, open the URL using Linking.openURL() from react-native and return false to prevent the WebView from loading it. For all other URLs, return true.
Make sure to import Linking from react-native.
This needs to work on both iOS and Android.
Example of the logic:

import { Linking } from 'react-native';

// On the WebView component:
onShouldStartLoadWithRequest={(request) => {
  if (request.url.includes('checkout.stripe.com')) {
    Linking.openURL(request.url);
    return false;
  }
  return true;
}}
Context: After the user completes payment on Stripe, Stripe redirects to profile.vibz.world/success. We already have deep linking / universal links configured for vibz.world domains, so the OS will automatically route the user back into the app after payment.

Do not change anything else about the WebView configuration. Only add the Stripe URL interception.