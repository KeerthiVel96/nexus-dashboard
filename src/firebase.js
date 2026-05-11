import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const apiKey     = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId  = import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (!apiKey) {
  console.error("❌ VITE_FIREBASE_API_KEY is missing from .env");
}

const firebaseConfig = { apiKey, authDomain, projectId };

const app  = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { onAuthStateChanged, signInWithEmailAndPassword, signOut };