module.exports = {
  expo: {
    name: "Vibz World",
    slug: "vibz-app-browser",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vibzworld",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    ios: {
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "cover",
        backgroundColor: "#ffffff"
      },
      supportsTablet: true,
      bundleIdentifier: "com.example.browserapp", // ⚠️ Check: Ensure this matches your real iOS Bundle ID
      associatedDomains: [
        "applinks:loveappneo.vibz.world",
        "applinks:lovenote.vibz.world",
        "applinks:vibes.vibz.world",
        "applinks:app.vibz.world",
        "applinks:love.vibz.world",
        "applinks:vibzworld.onelink.me"
      ],
      infoPlist: {
        UIBackgroundModes: ["remote-notification"]
      }
    },
    androidStatusBar: {
      hidden: true
    },
    android: {
      package: "world.vibz.browserapp",
      googleServicesFile: "./google-services.json",
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "cover",
        backgroundColor: "#ffffff"
      },
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: ["RECEIVE_BOOT_COMPLETED", "POST_NOTIFICATIONS"],
      
      // ✅ CORRECTED INTENT FILTERS START HERE
      intentFilters: [
        // 1. General Website Links (No Path Restriction)
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "loveappneo.vibz.world" },
            { scheme: "https", host: "lovenote.vibz.world" },
            { scheme: "https", host: "openinapp.vibz.world" }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        
        // 2. AppsFlyer OneLink (With Path Restriction)
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { 
              scheme: "https", 
              host: "vibzworld.onelink.me", 
              pathPrefix: "/rzzM" 
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },

        // 3. Custom URI Schemes (Legacy/Deep Link Support)
        {
          action: "VIEW",
          data: [
            { scheme: "vibzworld" },
            { scheme: "exp+vibz-app-browser" }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
      // ✅ END OF INTENT FILTERS
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-splash-screen",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#ffffff",
          sounds: []
        }
      ],
      [
        "expo-secure-store",
        {
          faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        }
      ],
      [
        "react-native-appsflyer",
        {
          strictMode: false
        }
      ]
    ],
    notification: {
      icon: "./assets/images/icon.png",
      color: "#ffffff"
    },
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "ce90583c-10a8-472b-9014-799a41fc00bb"
      }
    },
    owner: "matstblom"
  }
};