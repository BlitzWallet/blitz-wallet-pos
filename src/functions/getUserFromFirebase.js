// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { initializeAuth, signInAnonymously } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: "blitz-wallet-82b39.firebaseapp.com",
  projectId: "blitz-wallet-82b39",
  storageBucket: "blitz-wallet-82b39.appspot.com",
  messagingSenderId: "129198472150",
  appId: "1:129198472150:web:86511e5250364ee1764277",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app);

export async function getSignleContact(wantedName) {
  await signInAnonymously(auth);
  const userProfilesRef = collection(db, "blitzWalletUsers");

  const q = query(
    userProfilesRef,
    where("posSettings.storeNameLower", "==", wantedName.toLowerCase())
  );
  const querySnapshot = await getDocs(q);
  const [data] = querySnapshot.docs.map((doc) => doc.data());

  return new Promise((resolve) => resolve(data?.posSettings));
}
