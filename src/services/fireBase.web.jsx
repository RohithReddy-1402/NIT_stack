import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  initializeAuth,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";

// Web variant of fireBase.jsx: `getReactNativePersistence` only exists in
// Firebase's React Native build, so on web it's undefined and crashed every
// page that imports the login screen. Browsers use normal local persistence.
const firebaseConfig = {
  apiKey: "AIzaSyC5LqX_fiAwm9OSXNoWHOqceLyOaV0Hm6s",
  authDomain: "nitkkrpreviouspapers-75bbd.firebaseapp.com",
  projectId: "nitkkrpreviouspapers-75bbd",
  storageBucket: "nitkkrpreviouspapers-75bbd.firebasestorage.app",
  messagingSenderId: "287168887268",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: browserLocalPersistence });
const provider = new GoogleAuthProvider();

export {
  auth,
  GoogleAuthProvider,
  provider,
  signInWithCredential,
  signInWithPopup,
};
