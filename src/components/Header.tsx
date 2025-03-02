"use client";
import { User } from "firebase/auth";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  signInWithGoogle,
  signOut,
  onAuthStateChanged,
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import "@/app/globals.css"; //for layout

function useUserSession(initialUser: any) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();
  
  // Single function to update auth token in cookie
  const updateAuthCookie = async (user: User | null) => {
    if (!user) {
      document.cookie = 'authToken=; path=/; max-age=0';
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      document.cookie = `authToken=${token}; path=/; max-age=3600; SameSite=Strict`;
      
      // Update service worker if available
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'AUTH_TOKEN',
          token
        });
      }
      
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register('/auth-service-worker.js')
        .then(registration => console.log("Service worker registered:", registration.scope))
        .catch(error => console.error("Service worker registration failed:", error));
    }
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
      updateAuthCookie(authUser);
      
      if (authUser?.uid !== user?.uid) {
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  return user;
}

interface HeaderProps {
  initialUser: any;
}

export default function Header({ initialUser }: HeaderProps) {
  const user = useUserSession(initialUser);

  // Simple sign in/out handlers
  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    signInWithGoogle();
  };

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    signOut();
  };

  return (
    <header className="bg-eggshell flex justify-between items-center">
      <Link href="/" className="logo h-[20%] mx-3">
        <img src="/weblogo.svg" alt="Concursus" style={{ width: '15%', height: 'auto' }}/>
      </Link>
      <h1 className="font-bold text-5xl mx-auto">Concursus</h1>
      
      {user ? (
        <div className="profile ml-auto flex items-center gap-2">
          <img
            className="profileImage w-8 h-8 rounded-full"
            src={user.photoURL || "/profile.svg"}
            alt={user.displayName || "User"}
          />
          <span className="hidden md:inline">{user.displayName}</span>
          <button 
            onClick={handleSignOut} 
            className="p-2 bg-skyblue rounded-xl text-deepblue ml-2">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="profile ml-auto">
          <button 
            onClick={handleSignIn}
            className="flex items-center gap-2 bg-skyblue text-deepblue shadow-md font-semibold py-2 mx-5 px-4 border border-gray-400 rounded-xl transition-transform duration-200 hover:scale-105 hover:shadow-lg"
            >
            {/* <img 
              // src="/google.svg" 
              alt="Google" 
              className="w-5 h-5" 
            /> */}
            Sign in with Google
          </button>
        </div>
      )}
    </header>
  );
}

//tags for posts
// const tags = {
// 	"Science & Technology": ['#physics', '#chemistry', '#biology', '#astronomy', '#engineering', '#technology', '#robotics', '#dataScience'],
// 	"Ideas & Innovation": ['#startup', '#entrepreneurship', '#innovation', '#creativity', '#invention', '#designThinking', '#leadership'],
            //   alt="Google" 
// 	"Society & Politics": ['#politics', '#society', '#humanRights', '#activism', '#community', '#law', '#sustainability', '#ethics'],
// 	"Finance & Economics": ['#finance', '#economics', '#investing', '#budgeting', '#crypto', '#stocks', '#realEstate', '#personalFinance'],
// 	"Arts & Media": ['#art', '#literature', '#music', '#photography', '#cinema', '#theater', '#media', '#fashion'],
// 	"Health & Lifestyle": ['#health', '#fitness', '#nutrition', '#mentalHealth', '#wellness', '#lifestyle', '#selfCare', '#travel'],
// 	"Gaming & Entertainment": ['#gaming', '#videoGames', '#entertainment', '#movies', '#tvShows', '#comics', '#anime', '#boardGames'],
// 	"Miscellaneous": ['#gardening', '#pets', '#foodie', '#photography', '#DIY', '#scienceFiction', '#history', '#other']
//   };