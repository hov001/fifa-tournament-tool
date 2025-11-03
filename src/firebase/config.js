import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCg4kKHB2nq34kvSZIqmyfJoTthne7VEj0",
  authDomain: "fifa-tournament-tool.firebaseapp.com",
  projectId: "fifa-tournament-tool",
  storageBucket: "fifa-tournament-tool.firebasestorage.app",
  messagingSenderId: "857114818353",
  appId: "1:857114813:web:86906fb4d44cd0ace82210",
  measurementId: "G-J8E20X7J5P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Default tournament ID for public viewing (when no user is logged in)
// This should be set to the admin's user ID whose tournament you want to display publicly
// You can find the user ID after the admin logs in (check localStorage or Firebase console)
export const DEFAULT_TOURNAMENT_ID = "uImoYVjHSJSttdD0fPomiygjb6r2"; // Replace with your admin's user ID

export default app;
