import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
getAuth,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
getDatabase,
ref,
get
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

/* ================= INIT ================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* ================= WAIT FOR AUTH ================= */
function getCurrentUser() {
return new Promise((resolve) => {

const unsubscribe = onAuthStateChanged(
  auth,
  (user) => {
    unsubscribe();
    resolve(user);
  }
);

});
}

/* ================= GET USER DETAILS ================= */
export async function getMyDetails() {

try {

const authUser = await getCurrentUser();

if (!authUser) {
  throw new Error("User not authenticated");
}

const uid = authUser.uid;

/* ================= USER DATA ================= */
const userSnapshot = await get(
  ref(db, `users/${uid}`)
);

if (!userSnapshot.exists()) {
  throw new Error("User data not found");
}

const userData = userSnapshot.val();

/* ================= TRANSACTIONS ================= */
const transactionSnapshot = await get(
  ref(db, "transactions")
);

let transactions = [];

if (transactionSnapshot.exists()) {

  const allTransactions =
    transactionSnapshot.val();

  transactions = Object.entries(
    allTransactions
  )
    .filter(
      ([_, tx]) => tx.userId === uid
    )
    .map(([id, tx]) => ({
      id,
      ...tx
    }))
    .sort(
      (a, b) =>
        (b.createdAt || 0) -
        (a.createdAt || 0)
    );

}

/* ================= RECENT TRANSACTIONS ================= */
const recentTransactions =
  transactions.slice(0, 10);

/* ================= RETURN ================= */
return {
  success: true,

  uid,

  firstName:
    userData.firstName || "",

  lastName:
    userData.lastName || "",

  email:
    userData.email || "",

  phone:
    userData.phone || "",

  account:
    userData.account || {
      balance: 0,
      currency: "NGN",
      accountNumber: null,
      bankName: null,
      accountName: null
    },

  business:
    userData.business || {
      businessName: null,
      businessType: null,
      address: null,
      category: null
    },

  security:
    userData.security || {
      token: null,
      passcode: null,
      twoFactorEnabled: false,
      lastLoginAt: null,
      loginAttempts: 0
    },

  pluginAccess:
    userData.pluginAccess || {
      plan: "free",
      status: "active",
      features: {},
      limits: {}
    },

  license:
    userData.license || {
      licenseKey: null,
      status: null,
      lastValidatedAt: null,
      expiresAt: null
    },

  balance:
    userData.account?.balance || 0,

  currency:
    userData.account?.currency || "NGN",

  createdAt:
    userData.createdAt || null,

  updatedAt:
    userData.updatedAt || null,

  transactionCount:
    transactions.length,

  transactions,

  recentTransactions,

  user: userData
};

} catch (error) {

console.error(
  "Get Details Error:",
  error
);

return {
  success: false,
  message: error.message
};

}

  }
