import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Firestore,
  getDocs,
  setDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { generateMockData } from "../mockPosts";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "./config";

let firebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

type Answer = {
  answerText: string;
};

export async function createPost(
  title: string,
  description: string | null,
  answers: Answer[],
  tags: string[] = []
) {
  if (!db || !auth) {
    console.error("Firebase not initialized");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    console.log("Could not complete post: No user is signed in");
    return;
  }

  const userId = user.uid;
  const userPhoto = user.photoURL;
  const userDisplayName = user.displayName;

  const postRef = await addDoc(collection(db, "posts"), {
    title: title,
    description: description,
    posterId: userId,
    posterPhotoURL: userPhoto,
    posterDisplayName: userDisplayName,
    tags: tags,
    createdAt: serverTimestamp(),
    modifiedAt: serverTimestamp(),
  });

  const answersRef = collection(postRef, "answers");
  for (const answer of answers) {
    await addDoc(answersRef, {
      text: answer.answerText,
      votes: 0,
      userVotes: [],
    });
  }

  return postRef.id;
}

export async function updateAnswerWithVote(postId: string, answerId: string) {
  if (!db || !auth) {
    console.error("Firebase is not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  const user = auth.currentUser;

  if (!user) {
    console.log("Could not add vote: No user is signed in");
    return { success: false, error: "No user is signed in" };
  }

  const userId = user.uid;

  try {
    // First check if user has already voted on ANY answer in this post
    const answersRef = collection(db, "posts", postId, "answers");
    const answersQuery = query(
      answersRef,
      where("userVotes", "array-contains", userId)
    );
    const answersSnap = await getDocs(answersQuery);

    if (!answersSnap.empty) {
      console.log("User already voted on this post");
      return {
        success: false,
        alreadyVoted: true,
        message: "You can only vote once per post",
      };
    }

    // If they haven't voted yet, proceed with voting
    const answerDocRef = doc(db, "posts", postId, "answers", answerId);
    const answerSnapshot = await getDoc(answerDocRef);

    if (!answerSnapshot.exists()) {
      return { success: false, error: "Answer not found" };
    }

    const answerData = answerSnapshot.data();
    const userVotes = answerData.userVotes || [];

    // Add the user's ID to the userVotes array
    userVotes.push(userId);

    // Update the answer with new vote
    await updateDoc(answerDocRef, {
      votes: (answerData.votes || 0) + 1,
      userVotes: userVotes,
    });

    // Also update user's votes in their profile document
    const userVotesRef = doc(db, "users", userId);
    
    // First check if the user document exists
    const userDoc = await getDoc(userVotesRef);

    if (userDoc.exists()) {
      await updateDoc(userVotesRef, {
        [`votes.${postId}`]: answerId,
      });
    } else {
      // Create a new document for this user
      await setDoc(userVotesRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        votes: {
          [postId]: answerId,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      newVoteCount: answerData.votes + 1,
    };
  } catch (error) {
    console.error("Error updating vote:", error);
    return { success: false, error: error };
  }
}

// Add a function to check if a user has voted on a post
export async function checkUserVoteOnPost(postId: string) {
  if (!db || !auth) {
    console.error("Firebase is not initialized");
    return null;
  }

  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  try {
    // First try to get this from the user's document (faster)
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && 
        userDoc.data().votes && 
        userDoc.data().votes[postId]) {
      return userDoc.data().votes[postId];
    }
    
    // If not found in user document, query the answers collection
    const answersRef = collection(db, "posts", postId, "answers");
    const q = query(answersRef, where("userVotes", "array-contains", user.uid));
    const querySnapshot = await getDocs(q);

    // If we found any answers, return the first one's ID
    if (!querySnapshot.empty) {
      const answerId = querySnapshot.docs[0].id;
      
      // Update user document for future reference
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          [`votes.${postId}`]: answerId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          votes: {
            [postId]: answerId,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      return answerId;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking user vote:", error);
    return null;
  }
}

export async function addMockPosts() {
  if (!db) {
    console.error("Firebase not initialized");
    return;
  }

  const data = await generateMockData();
  for (const { postData, answersData } of data) {
    try {
      const docRef = await addDoc(collection(db, "posts"), postData);

      for (const answerData of answersData) {
        await addDoc(collection(db, "posts", docRef.id, "answers"), answerData);
      }
    } catch (e) {
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}

function applyQueryFilters(
  q: any,
  { tags, sort }: { tags?: string[]; sort?: string }
) {
  if (tags) {
    q = query(q, where("tags", "array-contains-any", tags));
  }
  if (sort === "Newest" || !sort) {
    q = query(q, orderBy("createdAt", "desc"));
  } else if (sort === "Oldest") {
    q = query(q, orderBy("createdAt", "asc"));
  }
  return q;
}

export async function getPosts(
  database: Firestore = db || getFirestore(),
  filters = {}
) {
  if (!database) {
    console.error("Firestore database not available");
    return [];
  }

  let q = query(collection(database, "posts"));

  q = applyQueryFilters(q, filters);
  const results = await getDocs(q);
  return results.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      posterId: data.posterId,
      posterPhotoURL: data.posterPhotoURL,
      posterDisplayName: data.posterDisplayName,
      answers: data.answers,
      tags: data.tags,
      createdAt: data.createdAt,
      modifiedAt: data.modifiedAt,
    };
  });
}

export async function getPostAnswers(database: Firestore, postId: string) {
  if (!database) {
    console.error("Firestore database not available");
    return [];
  }

  try {
    // Ensure we have valid parameters
    if (!postId) {
      console.error("Invalid postId provided to getPostAnswers");
      return [];
    }

    // Create a reference to the answers subcollection
    const answersRef = collection(database, "posts", postId, "answers");

    // Get the answers
    const answersSnapshot = await getDocs(answersRef);

    if (answersSnapshot.empty) {
      console.log(`No answers found for post ${postId}`);
      return [];
    }

    // Map the docs to a consistent format
    return answersSnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text || "",
      votes: doc.data().votes || 0,
      userVotes: doc.data().userVotes || [],
    }));
  } catch (error) {
    console.error(`Error fetching answers for post ${postId}:`, error);
    return [];
  }
}
