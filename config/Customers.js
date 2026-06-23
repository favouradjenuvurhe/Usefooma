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

/* ================= AUTH USER ================= */

function getCurrentUser() {
return new Promise((resolve) => {
const unsubscribe = onAuthStateChanged(auth, (user) => {
unsubscribe();
resolve(user);
});
});
}

/* ================= MAIN FUNCTION ================= */

export async function getCustomers() {

try {

    /* ================= AUTH ================= */

    const authUser = await getCurrentUser();

    if (!authUser) {
        throw new Error("User not authenticated");
    }

    const uid = authUser.uid;

    /* ================= GET USER ================= */

    const userSnap = await get(
        ref(db, `users/${uid}`)
    );

    if (!userSnap.exists()) {
        throw new Error("User not found");
    }

    const userData = userSnap.val();
    const userEmail = userData.email;

    /* ================= GET SUBSCRIPTIONS ================= */

    const subsSnap = await getDocs(
        collection(firestore, "subscriptions")
    );

    const subscriptions = [];

    subsSnap.forEach((doc) => {

        const data = doc.data();

        if (data.email === userEmail) {

            subscriptions.push({
                id: doc.id,
                ...data
            });

        }

    });

    if (!subscriptions.length) {

        return {
            success: true,
            usersCount: 0,
            totalWalletBalance: 0,
            totalDollarBalance: 0,
            totalDomains: 0,
            users: []
        };

    }

    /* ================= FETCH CUSTOMERS ================= */

    const requests = subscriptions
        .filter(sub => sub.domain)
        .map(async (sub) => {

            try {

                let domain = sub.domain.trim();

                if (!domain.startsWith("http")) {
                    domain = "https://" + domain;
                }

                const response = await fetch(
                    `${domain}/api/customer.php?secret=pulsepoint`
                );

                const result = await response.json();

                if (!result.success || !Array.isArray(result.users)) {
                    return [];
                }

                return result.users.map(user => ({

                    domain,

                    id: user.id || null,

                    fullname:
                        `${user.firstname || ""} ${user.lastname || ""}`.trim(),

                    firstname:
                        user.firstname || "",

                    lastname:
                        user.lastname || "",

                    username:
                        user.username || "",

                    email:
                        user.email || "",

                    phone:
                        user.phone || "",

                    wallet:
                        Number(user.wallet || 0),

                    dollar:
                        Number(user.dollar || 0),

                    referby:
                        user.referby || ""

                }));

            } catch (error) {

                console.error(
                    "Customer API Error:",
                    sub.domain,
                    error
                );

                return [];

            }

        });

    const customersArrays =
        await Promise.all(requests);

    const customers =
        customersArrays.flat();

    /* ================= TOTALS ================= */

    const totalWalletBalance =
        customers.reduce(
            (sum, user) =>
                sum + Number(user.wallet || 0),
            0
        );

    const totalDollarBalance =
        customers.reduce(
            (sum, user) =>
                sum + Number(user.dollar || 0),
            0
        );

    /* ================= RETURN ================= */

    return {

        success: true,

        uid,

        ownerEmail: userEmail,

        totalDomains:
            subscriptions.length,

        usersCount:
            customers.length,

        totalWalletBalance:
            Number(totalWalletBalance.toFixed(2)),

        totalDollarBalance:
            Number(totalDollarBalance.toFixed(2)),

        users:
            customers

    };

} catch (error) {

    console.error(
        "Customers Error:",
        error
    );

    return {

        success: false,
        message: error.message

    };

}

}
