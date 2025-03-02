import React from "react";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import DetailedAnswerList from "@/components/DetailedAnswerList";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  // Get server-side Firebase instance
  const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();
  // Get Firestore from the server app
  const db = getFirestore(firebaseServerApp);

  try {
    // Use the server-side Firestore instance
    const postRef = doc(db, "posts", params.id);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return notFound();
    }

    const postData = postSnap.data();

    // Get answers using the server-side Firestore instance
    const answersRef = collection(db, "posts", params.id, "answers");
    const answersSnap = await getDocs(answersRef);

    const answers = answersSnap.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
      votes: doc.data().votes || 0,
      userVotes: doc.data().userVotes || [],
    }));

    return (
      <div className="bg-eggshell min-h-screen font-judson pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-amber-600 hover:text-amber-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to all posts
            </Link>

            {!currentUser && (
              <div className="text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                Sign in to vote on answers
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center mb-6">
                <img
                  src={postData.posterPhotoURL || "/profile.svg"}
                  alt={postData.posterDisplayName || "User"}
                  className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-amber-100"
                />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {postData.posterDisplayName || "Anonymous User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {postData.createdAt
                      ? new Date(
                          postData.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {postData.title}
              </h1>

              {postData.description && (
                <div className="prose prose-amber max-w-none mb-8 text-gray-700">
                  <p>{postData.description}</p>
                </div>
              )}

              {postData.tags && postData.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Tags:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {postData.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-skyblue text-deepblue px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Answers{" "}
                  <span className="text-amber-600">({answers.length})</span>
                </h2>

                <DetailedAnswerList
                  postId={params.id}
                  answers={answers}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching post data:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-amber-600 hover:text-amber-700">
          &larr; Back to home
        </Link>
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-700">
            Unable to load this post. Please try again later.
          </p>
          <pre className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
