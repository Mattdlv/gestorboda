import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBY8fo-D4PUj5_ZYqR62xiy7AcHX8T49Fw",
  authDomain: "boda-146e2.firebaseapp.com",
  projectId: "boda-146e2",
  storageBucket: "boda-146e2.firebasestorage.app",
  messagingSenderId: "44403874205",
  appId: "1:44403874205:web:019c370a65732e9a4d3774"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
