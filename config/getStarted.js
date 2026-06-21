import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyC-Jzil5XppludN18cpjrKRcDAhJqmFcAw",
  authDomain: "pulsepoint-plugin.firebaseapp.com",
  databaseURL: "https://pulsepoint-plugin-default-rtdb.firebaseio.com",
  projectId: "pulsepoint-plugin",
  storageBucket: "pulsepoint-plugin.firebasestorage.app",
  messagingSenderId: "81838133350",
  appId: "1:81838133350:android:1564edfb1446a0baeddda7"
};

/* ================= FIREBASE INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* ================= USER TOKEN ================= */
function generateUserToken() {
  return (
    "user_" +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

/* ================= SIGNUP ================= */
export async function getStarted({
  firstName,
  lastName,
  phone,
  email,
  password
}) {
  try {

    /* CREATE AUTH USER */
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;
    const uid = user.uid;

    /* UPDATE PROFILE */
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    /* TOKEN */
    const userToken = generateUserToken();

    /* USER DATA */
    const userData = {
      id: uid,
      authUid: uid,

      firstName,
      lastName,
      phone,
      email,

      account: {
        balance: 0,
        currency: "NGN",
        accountNumber: null,
        bankName: null,
        accountName: null
      },

      business: {
        businessName: null,
        businessType: null,
        address: null,
        category: null
      },

      security: {
        token: userToken,
        passcode: Math.floor(
          100000 + Math.random() * 900000
        ).toString(),
        twoFactorEnabled: false,
        lastLoginAt: Date.now(),
        loginAttempts: 0
      },

      pluginAccess: {
        plan: "free",
        status: "active",

        features: {
          wordpressPlugin: true,
          apiAccess: true,
          analytics: false,
          premiumWidgets: false
        },

        limits: {
          maxRequestsPerDay: 100,
          maxApiCallsPerMinute: 10
        }
      },

      license: {
        licenseKey:
          "WP-" +
          Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase(),

        status: "active",
        lastValidatedAt: Date.now(),
        expiresAt: 0
      },

      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    /* SAVE USER */
    await set(
      ref(db, "users/" + uid),
      userData
    );

    /* SESSION */
    localStorage.setItem("uid", uid);
    localStorage.setItem("token", userToken);
    localStorage.setItem("loggedIn", "true");

    /* REDIRECT */
    window.location.href = "/dashboard";

    return {
      success: true,
      uid,
      userToken
    };

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: error.message
    };
  }
        }
