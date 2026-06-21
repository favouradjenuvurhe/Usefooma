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

import {
getFirestore,
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
const firestore = getFirestore(app);

/* ================= AUTH HANDLER ================= */
function getCurrentUser() {
return new Promise((resolve) => {
const unsubscribe = onAuthStateChanged(auth, (user) => {
unsubscribe();
resolve(user);
});
});
}

/* ================= DAYS LEFT ================= */
function getDaysLeft(expiry) {
if (!expiry) return -999;

const now = Date.now();
const end = new Date(expiry).getTime();

return Math.ceil((end - now) / (1000 * 60 * 60 * 60));
}

/* ================= MAIN FUNCTION ================= */
export async function getMySubscriptions() {

try {

/* ================= AUTH USER ================= */
const authUser = await getCurrentUser();

if (!authUser) {
throw new Error("User not authenticated");
}

const uid = authUser.uid;

/* ================= GET USER FROM RTDB ================= */
const userSnap = await get(
ref(db, `users/${uid}`)
);

if (!userSnap.exists()) {
throw new Error("User not found");
}

const userData = userSnap.val();
const userEmail = userData.email;

/* ================= GET FIRESTORE SUBSCRIPTIONS ================= */
const snap = await getDocs(collection(firestore, "subscriptions"));

let allSubs = [];

snap.forEach(doc => {
allSubs.push({
id: doc.id,
...doc.data()
});
});

/* ================= FILTER BY EMAIL ================= */
const userSubs = allSubs.filter(
sub => sub.email === userEmail
);

/* ================= PROCESS ================= */
const processed = userSubs.map(sub => {

const daysLeft = getDaysLeft(sub.expires_at);

let status = sub.status || "unknown";

if (daysLeft <= 0) {
status = "expired";
} else if (daysLeft <= 7) {
status = "expiring";
}

return {
id: sub.id,
domain: sub.domain || "",
plan: sub.plan || "",
amount: sub.amount || 0,
reference: sub.reference || "",
phone: sub.phone || "",
email: sub.email || "",

startedAt: sub.started_at || "",
expiresAt: sub.expires_at || "",

daysLeft,
status
};

});

/* ================= SUMMARY ================= */
const summary = {
total: processed.length,
active: processed.filter(s => s.status === "active").length,
expiring: processed.filter(s => s.status === "expiring").length,
expired: processed.filter(s => s.status === "expired").length
};

/* ================= RETURN ================= */
return {
success: true,

uid,
firstName: userData.firstName || "",
lastName: userData.lastName || "",
email: userEmail,

summary,
subscriptions: processed,
rawSubscriptions: userSubs,
user: userData
};

} catch (error) {

console.error("Subscription Error:", error);

return {
success: false,
message: error.message
};

}
}
