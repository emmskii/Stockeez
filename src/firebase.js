// Local copy of firebase.js for Inventory Management

// 1) Core SDK
import { initializeApp } from "firebase/app";
// 2) (Optional) Analytics
import { getAnalytics } from "firebase/analytics";

// 3) Services you need
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 4) Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDIs9gTMxvsNJ_Y8cRKFgk7BJ_0_ax8HvM",
  authDomain: "stockeez-db.firebaseapp.com",
  projectId: "stockeez-db",
  storageBucket: "stockeez-db.appspot.com",
  messagingSenderId: "932714722155",
  appId: "1:932714722155:web:819a19266f12897122922e",
  measurementId: "G-CX1B8Y4FZS"
};

// 5) Initialize Firebase
const app = initializeApp(firebaseConfig);
// 6) (Optional) Analytics
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);  // Using ESLint comment to disable the unused var warning

// 7) Export the services you need
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;