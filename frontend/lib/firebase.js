import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:  "AIzaSyDCXXbzEKWulwSGXkiEIS1suBO-7n-f7nE",
  authDomain: "e-library-89776.firebaseapp.com",
  projectId: "e-library-89776",
  storageBucket:  "e-library-89776.firebasestorage.app",
  messagingSenderId: "1084835747531",
  appId: "1:1084835747531:web:873b9e91fef18540716d4e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);