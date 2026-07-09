// Subscribe.js
// Handles plan selection, UI updates, and Paystack payment + Firestore subscription write

// ---- FIREBASE CONFIG ----
firebase.initializeApp({
  apiKey: "AIzaSyAGPauHdjGr0ONgPX4FXoMx9jaIAc6IEqI",
  authDomain: "pulsepoint-plugin.firebaseapp.com",
  projectId: "pulsepoint-plugin"
});
const db = firebase.firestore();

// ---- PLANS ----
const PLANS = {
  monthly:   { name: "Monthly",   amount: 1600,  duration: 1,  billing: "Monthly" },
  quarterly: { name: "Quarterly", amount: 4500,  duration: 3,  billing: "Quarterly" },
  yearly:    { name: "Yearly",    amount: 14400, duration: 12, billing: "Yearly" }
};

const VAT_RATE = 0.075;
const PAYSTACK_PUBLIC_KEY = "pk_live_65b6c91453823221b9578da0506e2ad6b9f4ef50";

let selectedPlanKey = "monthly";

// ---- UI HELPERS ----
function getPlanTotals(planKey) {
  const plan = PLANS[planKey];
  const vat = Math.round(plan.amount * VAT_RATE);
  const total = plan.amount + vat;
  return { plan, vat, total };
}

function updateUI() {
  const { plan, vat, total } = getPlanTotals(selectedPlanKey);

  const els = {
    planName: document.getElementById("planName"),
    planAmount: document.getElementById("planAmount"),
    planDuration: document.getElementById("planDuration"),
    planBilling: document.getElementById("planBilling"),
    planVat: document.getElementById("planVat"),
    payBtn: document.getElementById("payBtn")
  };

  if (els.planName) els.planName.innerText = plan.name;
  if (els.planAmount) els.planAmount.innerText = "₦" + plan.amount.toLocaleString();
  if (els.planDuration) els.planDuration.innerText = plan.duration + " month(s)";
  if (els.planBilling) els.planBilling.innerText = plan.billing;
  if (els.planVat) els.planVat.innerText = "₦" + vat.toLocaleString();
  if (els.payBtn) els.payBtn.innerText = "Pay ₦" + total.toLocaleString();
}

// ---- PLAN TAB SWITCHING ----
function bindPlanToggle() {
  document.querySelectorAll("#planToggle .tabBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#planToggle .tabBtn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPlanKey = btn.dataset.plan;
      updateUI();
    });
  });
}

// ---- PAYMENT ----
function handlePaymentSuccess(response, plan, total, domain, email, phone) {
  const now = new Date();
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + plan.duration);

  db.collection("subscriptions")
    .doc(domain)
    .set({
      email,
      phone,
      domain,
      plan: plan.name,
      amount: total,
      status: "active",
      reference: response.reference,
      started_at: now.toISOString(),
      expires_at: expiry.toISOString()
    })
    .then(() => alert("✅ Subscription activated"))
    .catch(() => alert("❌ Error saving subscription"));
}

function bindPayButton() {
  const payBtn = document.getElementById("payBtn");
  if (!payBtn) return;

  payBtn.addEventListener("click", () => {
    const email = document.getElementById("email")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const domain = document.getElementById("domain")?.value.trim();

    if (!email || !phone || !domain) {
      alert("Fill all fields");
      return;
    }

    const { plan, total } = getPlanTotals(selectedPlanKey);

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: total * 100,
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Domain", value: domain },
          { display_name: "Plan", value: plan.name }
        ]
      },
      callback: (response) => handlePaymentSuccess(response, plan, total, domain, email, phone),
      onClose: () => alert("Payment cancelled")
    });

    handler.openIframe();
  });
}

// ---- INIT ----
function initSubscribe() {
  const checkPurchaseLoaded = setInterval(() => {
    if (document.getElementById("planToggle")) {
      clearInterval(checkPurchaseLoaded);
      bindPlanToggle();
      bindPayButton();
      updateUI();
    }
  }, 100);
}

document.addEventListener("DOMContentLoaded", initSubscribe);
    
