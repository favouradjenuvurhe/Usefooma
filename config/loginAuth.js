import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  child
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

/* ================= INITIALIZE FIREBASE ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* ================= LOGIN ================= */
export async function loginAuth({ email, password }) {
  try {

    /* LOGIN USER */
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    const uid = user.uid;

    /* GET USER DATA */
    const snapshot = await get(
      child(ref(db), `users/${uid}`)
    );

    if (!snapshot.exists()) {
      throw new Error("User data not found");
    }

    const userData = snapshot.val();

    /* SAVE SESSION */
    localStorage.setItem("uid", uid);
    localStorage.setItem(
      "token",
      userData?.security?.token || ""
    );
    localStorage.setItem("loggedIn", "true");

    /* REDIRECT */
    window.location.href = "/dashboard";

    return {
      success: true,
      uid,
      token: userData?.security?.token || "",
      user: userData
    };

  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      message: error.message
    };
  }
}
