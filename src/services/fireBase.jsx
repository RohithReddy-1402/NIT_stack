import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC5LqX_fiAwm9OSXNoWHOqceLyOaV0Hm6s",
  authDomain: "nitkkrpreviouspapers-75bbd.firebaseapp.com",
  projectId: "nitkkrpreviouspapers-75bbd",
  storageBucket: "nitkkrpreviouspapers-75bbd.firebasestorage.app",
  messagingSenderId: "287168887268",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const provider = new GoogleAuthProvider();

export {
  auth,
  GoogleAuthProvider,
  provider,
  signInWithCredential,
  signInWithPopup,
};
