import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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

/* ================= INITIALIZE FIREBASE ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ================= PASSWORD RECOVERY ================= */
export async function recoveryAuth(email) {
  try {

    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
      message:
        "Recovery link sent, via email."
    };

  } catch (error) {
    console.error("Recovery error:", error);

    let message = error.message;

    switch (error.code) {
      case "auth/user-not-found":
        message = "No account found with this email.";
        break;

      case "auth/invalid-email":
        message = "Invalid email address.";
        break;

      case "auth/too-many-requests":
        message =
          "Too many attempts. Please try again later.";
        break;
    }

    return {
      success: false,
      message
    };
  }
}
