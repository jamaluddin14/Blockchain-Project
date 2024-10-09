// Import Firebase scripts for messaging in service worker context
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyDDU0_VgWRasD58IEpLNQA2y7MYeYOl3QY",
  authDomain: "lendmaker.firebaseapp.com",
  projectId: "lendmaker",
  storageBucket: "lendmaker.appspot.com",
  messagingSenderId: "39129881605",
  appId: "1:39129881605:web:1c85aa72b955e32aed106c",
  measurementId: "G-NFPVK2421F"
};
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance to handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || "Default title";
  const notificationOptions = {
    body: payload.notification?.body || "Default body",
    icon: '/firebase-logo.png', // Add your app icon if needed
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
