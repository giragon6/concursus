import "server-only";

import { headers } from "next/headers";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { cookies } from "next/headers";
import { firebaseConfig } from "./config";

// Keep a reference to the server app instance
let serverApp: FirebaseApp | null = null;

export async function getAuthenticatedAppForUser(): Promise<{
  firebaseServerApp: FirebaseApp;
  currentUser: any;
  db: any;
}> {
  try {
    // Keep track of server app
    if (!serverApp) {
      console.log("Creating new Firebase server app");
      serverApp = initializeApp(firebaseConfig, "SERVER");
    } else {
      console.log("Using existing Firebase server app");
    }

    // Use the existing app
    const firebaseServerApp = serverApp;

    // Get database reference
    const db = getFirestore(firebaseServerApp);

    // Get auth token from headers and cookies
    const headersList = headers();
    const cookiesList = cookies();

    let authToken = null;

    try {
      // Extract from Authorization header
      const authHeader = (await headersList).get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        authToken = authHeader.substring(7);
      }

      // If not found in headers, try cookies
      if (!authToken) {
        authToken = (await cookiesList).get("authToken")?.value || null;
      }

      console.log("Auth token present:", !!authToken);
    } catch (error) {
      console.error("Error extracting auth token:", error);
    }

    // Create simple user object if token exists
    const currentUser = authToken ? { isAuthenticated: true } : null;

    return { firebaseServerApp, currentUser, db };
  } catch (error) {
    console.error("Error in getAuthenticatedAppForUser:", error);
    // Create a new instance as a fallback
    const fallbackApp = initializeApp(firebaseConfig, Date.now().toString());
    const fallbackDb = getFirestore(fallbackApp);
    return {
      firebaseServerApp: fallbackApp,
      currentUser: null,
      db: fallbackDb,
    };
  }
}
