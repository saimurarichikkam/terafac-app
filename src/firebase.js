import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByGyOMIAifnMeDA1r9P50Yra2vwEgRbrs",
  authDomain: "terafac-app.firebaseapp.com",
  projectId: "terafac-app",
  storageBucket: "terafac-app.appspot.com",
  messagingSenderId: "240900158265",
  appId: "1:240900158265:web:8c622608ab2c8549486ee8",
  measurementId: "G-4YD6XR47CV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);