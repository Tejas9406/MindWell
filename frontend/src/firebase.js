import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB6KlJ6duT6-hdEcH-mAy_do4oxvE0QnVI",
    authDomain: "student-stress-management.firebaseapp.com",
    projectId: "student-stress-management",
    storageBucket: "student-stress-management.firebasestorage.app",
    messagingSenderId: "848727795512",
    appId: "1:848727795512:web:1bacde4412aeb5244dc3cd",
    measurementId: "G-T18GH9NB9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
