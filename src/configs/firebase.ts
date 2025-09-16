// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbu3jrPcNz-6PLBaXMUg1KqIQm36G3gl8",
  authDomain: "a-better-neighbourhood.firebaseapp.com",
  projectId: "a-better-neighbourhood",
  storageBucket: "a-better-neighbourhood.firebasestorage.app",
  messagingSenderId: "873552900700",
  appId: "1:873552900700:web:165174d1d9ae4b08ae6c99",
  measurementId: "G-CXVY07DBS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);