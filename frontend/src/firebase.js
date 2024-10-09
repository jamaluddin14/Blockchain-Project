import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDU0_VgWRasD58IEpLNQA2y7MYeYOl3QY",
    authDomain: "lendmaker.firebaseapp.com",
    projectId: "lendmaker",
    storageBucket: "lendmaker.appspot.com",
    messagingSenderId: "39129881605",
    appId: "1:39129881605:web:1c85aa72b955e32aed106c",
    measurementId: "G-NFPVK2421F"
};

// Your VAPID key (public key from Firebase console)
const VAPID_KEY = 'BP_467yeQxMC26ZRJKsODIGPQpU1TfDb5O5mBhxLepi8IaiuUq9k3f5I9jQ_SgGjn7I_dXing5BgiK99T4Utcv8';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Request permission for notifications
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Get FCM token with the VAPID key
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('FCM Token:', token);
        // Send token to the server if needed
      } else {
        console.log('No registration token available.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
};

// Handle incoming messages
onMessage(messaging, (payload) => {
  console.log('Message received:', payload);
});

// Google Provider
const googleProvider = new GoogleAuthProvider();

// Facebook Provider
const facebookProvider = new FacebookAuthProvider();

// Sign up with email and password
const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);

// Log in with email and password
const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Google login
const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Facebook login
const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);

// Log out
const logOut = () => signOut(auth);

export { auth, signUp, logIn, signInWithGoogle, signInWithFacebook, logOut, requestNotificationPermission };
