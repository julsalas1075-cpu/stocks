// firebase-config.js
// Paste this file to your GitHub Pages project and include it before admin-firebase.js / user-firebase.js

// Firebase config (you provided these values)
const firebaseConfig = {
  apiKey: "AIzaSyCguysIlysXrxoUVzvxwIegkkzjWHxJ9_s",
  authDomain: "something-951af.firebaseapp.com",
  databaseURL: "https://something-951af-default-rtdb.firebaseio.com",
  projectId: "something-951af",
  storageBucket: "something-951af.firebasestorage.app",
  messagingSenderId: "473657927594",
  appId: "1:473657927594:web:c62149f5b6a77ae8182dd3",
  measurementId: "G-PYC7WHT7RT"
};

// Initialize Firebase (compat SDK used in HTML pages)
firebase.initializeApp(firebaseConfig);
// optional: firebase.analytics(); // only if analytics script loaded
