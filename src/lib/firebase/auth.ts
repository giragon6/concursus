import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  NextOrObserver,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase/clientApp";
import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (user) {
      // Store token in cookie
      const token = await user.getIdToken();
      document.cookie = `authToken=${token}; path=/; max-age=3600; SameSite=Strict`;

      // Check if user document exists, create if it doesn't
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create the user document
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          votes: {},
        });
      } else {
        // Update last login timestamp
        await setDoc(
          userRef,
          {
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    // Clear auth cookie
    document.cookie = "authToken=; path=/; max-age=0";
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
