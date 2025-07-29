import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCwZter6jxfthvfgBxICqnPRi4o0-5MsIQ",
  authDomain: "watsland-96923.firebaseapp.com",
  databaseURL: "https://watsland-96923-default-rtdb.firebaseio.com",
  projectId: "watsland-96923",
  storageBucket: "watsland-96923.firebasestorage.app",
  messagingSenderId: "834505845470",
  appId: "1:834505845470:web:69efa45396e9218658304f",
  measurementId: "G-837VE7K58K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Admin email
export const ADMIN_EMAILS = [ "houssnijob@gmail.com"];
export const SUPER_ADMIN_EMAIL = "ayman@gmail.com";

export { app, auth, analytics, database }; 