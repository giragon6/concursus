'use client'
import {NextOrObserver, User} from 'firebase/auth';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
	signInWithGoogle,
	signOut,
	onAuthStateChanged
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseConfig } from "@/lib/firebase/config";

function useUserSession(initialUser: any) {
	// The initialUser comes from the server via a server component
	const [user, setUser] = useState(initialUser);
	const router = useRouter();

	// Register the service worker that sends auth state back to server
	// The service worker is built with npm run build-service-worker
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			const serializedFirebaseConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
			const serviceWorkerUrl = `/auth-service-worker.ts?firebaseConfig=${serializedFirebaseConfig}`
		
		  navigator.serviceWorker
			.register(serviceWorkerUrl)
			.then((registration) => console.log("scope is: ", registration.scope));
		}
	  }, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged((authUser: User | null) => {
			setUser(authUser)
		})

		return () => unsubscribe()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		onAuthStateChanged((authUser: User | null) => {
			if (user === undefined) return

			// refresh when user changed to ease testing
			if (user?.email !== authUser?.email) {
				router.refresh()
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	return user;
}

interface HeaderProps {
	initialUser: any;
}

export default function Header({initialUser}: HeaderProps) {

	const user = useUserSession(initialUser) ;

	const handleSignOut = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		event.preventDefault();
		signOut();
	};

	const handleSignIn = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		event.preventDefault();
		signInWithGoogle();
	};

	return (
		<header>
			<Link href="/" className="logo">
				<img src="/friendly-eats.svg" alt="FriendlyEats" />
				Friendly Eats
			</Link>
			{user ? (
				<>
					<div className="profile">
						<p>
							<img className="profileImage" src={user.photoURL || "/profile.svg"} alt={user.email} />
							{user.displayName}
						</p>

						<div className="menu">
							...
							<ul>
								<li>{user.displayName}</li>

								<li>
									<a
										href="#"
									>
										Add sample restaurants
									</a>
								</li>

								<li>
									<a href="#" onClick={handleSignOut}>
										Sign Out
									</a>
								</li>
							</ul>
						</div>
					</div>
				</>
			) : (
				<div className="profile"><a href="#" onClick={handleSignIn}>
					<img src="/profile.svg" alt="A placeholder user image" />
					Sign In with Google
				</a></div>
			)}
		</header>
	);
}