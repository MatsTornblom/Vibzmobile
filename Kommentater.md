20212021

Några kommentarer:

GOOGLE LOG IN:

I nuläge rensas alla auktorisaions cookies med CookieManager.clearAll(). 
Det är det enda sätta att helt logga ut en användare ur google. 
Det negative med det är att appliaktionen inte kommer ihåg vilka konton som varit inloggade tidigare (account picker).
Det gick inte att kolla tillrätta med, här är hela konversationen om det:
https://claude.ai/share/57af3192-39f4-4360-9ec6-5dacc301746b
Man får leva med att gamla anvöända konton inte dyker upp.



LÄNKNING OCH DEFERRED DEEP LINKING:

Så hÄr ska länkning odh deferred deep linking funka:

1. The user clicks the link in a mobil app (for example Messanger) that looks like: https://lovenote.vibz.world/shareId
2. If the vibz mobile app is installed it should launch and then launce https://lovenote.vibz.world/shareId in its webview component.
3. If the vibz mobil app is not installed it should launce the https://lovenote.vibz.world/shareId. The will show tow buttons "accept message" and "install the Vibz app"
4. If the user clicks "accept message" the user stays in the web application
5. If the user clicks "install the Vibz app" the user should be sent to the app store, install the app, be sent to the app with the https://lovenote.vibz.world/shareId and the app should launce https://lovenote.vibz.world/shareId in its webview component


Här är en lngre beskrivning av samma funtkionalitet:

Intended Scenario Flow
User clicks a link in a mobile app (e.g., Messenger): The link is a standard web URL, like https://lovenote.vibz.world/shareId.

If the Vibz mobile app is installed:

The operating system (iOS via Universal Links, Android via App Links) intercepts the https://lovenote.vibz.world/shareId URL.
Instead of opening in the browser, the system launches your Vibz mobile app.
Your mobile app receives the full web URL (https://lovenote.vibz.world/shareId) as a deep link.
Your mobile app then loads this full web URL within its internal webview component. The user sees the same web content, but now within your app.
If the Vibz mobile app is NOT installed:

The operating system cannot find an installed app to handle the https://lovenote.vibz.world/shareId URL.
The link opens in the user's default mobile browser.
Your web app (https://lovenote.vibz.world/shareId) is displayed, showing the message and the two buttons: "Accept message" and "Install the Vibz app."
If the user clicks "Accept message" (on the web app):

The user remains in the mobile browser, interacting with your web application.
If the user clicks "Install the Vibz app" (on the web app):

Your web app redirects the user to an AppsFlyer OneLink URL.
The AppsFlyer OneLink detects that the app is not installed and redirects the user to the appropriate app store (Google Play or Apple App Store).
The user installs the Vibz mobile app.
Upon the first launch of the app after installation, the AppsFlyer SDK (integrated into your mobile app) retrieves the original deep link value.
Crucially, this deep link value will be the full web URL (https://lovenote.vibz.world/shareId) that was passed to the OneLink.
Your mobile app then loads this full web URL within its internal webview component, presenting the user with the content they initially wanted to see.
What the Web App Needs to Do
Your web app's primary role is to serve the content and intelligently direct users to the mobile app if they choose.

Serve Content: Continue to serve the https://lovenote.vibz.world/:shareId page as it currently does.

"Accept Message" Button: This button should simply allow the user to continue viewing the content within the web browser. No special deep linking logic is needed here.

"Install the Vibz App" Button (handleOpenInApp in src/components/AcceptanceOverlay.tsx):

Modify the generateOneLink call: The deep_link_value passed to the AppsFlyer OneLink must be the full window.location.href (the complete URL of the current web page), not just the shareId path. This ensures the mobile app receives the exact URL it needs to load in its webview.

What the Mobile App Needs to Do (with Bolt.new)
Your mobile app, when analyzed by Bolt.new, should demonstrate the following capabilities:

AppsFlyer SDK Integration:

Dependency: Include the AppsFlyer SDK in your mobile app's package.json (for React Native/Expo) or native build files.
Initialization: Initialize the AppsFlyer SDK early in your app's lifecycle (e.g., in your App.tsx or equivalent entry point) with your AppsFlyer Dev Key and App ID.
Universal Links (iOS) / App Links (Android) Configuration:

Purpose: To allow the mobile app to intercept and open https://lovenote.vibz.world/* URLs directly when the app is installed.
iOS:
Configure Associated Domains in your Xcode project capabilities (e.g., applinks:lovenote.vibz.world).
Ensure your apple-app-site-association file is correctly hosted on https://lovenote.vibz.world/.well-known/apple-app-site-association.
Android:
Add an intent-filter to your AndroidManifest.xml that declares your app can handle https://lovenote.vibz.world/* URLs. Include android:autoVerify="true".
Ensure your assetlinks.json file is correctly hosted on https://lovenote.vibz.world/.well-known/assetlinks.json.
Deep Link Handling Logic (to load in Webview):

Purpose: To receive the incoming URL (either from a direct Universal/App Link or a deferred deep link from AppsFlyer) and load it into a webview.
Implementation:
Listen for incoming links: Use the Linking API (for React Native) to get the initial URL that launched the app, and to listen for subsequent incoming URLs while the app is running.
AppsFlyer Conversion Data: Implement the AppsFlyer SDK's conversion data listener (e.g., onConversionData or onAppOpenAttribution). This listener will provide the deep_link_value (which will be the full web URL) after a deferred install.
Webview Component: Integrate a webview component (e.g., react-native-webview) into your app.
Load URL: When an incoming URL is detected (from Linking or AppsFlyer), extract the full URL and pass it as the source.uri prop to your webview component.
By following these steps, your mobile app will seamlessly integrate with your web app's content, providing a robust and user-friendly experience for both existing and new users.

