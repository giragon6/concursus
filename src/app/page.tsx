import { getPosts, getPostAnswers } from "@/lib/firebase/firestore";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";
import { getFirestore } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import NewPostButton from "@/components/NewPostButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const { firebaseServerApp, currentUser } =
      await getAuthenticatedAppForUser();
    const db = getFirestore(firebaseServerApp);
    const posts = await getPosts(db, {});

    // Fetch answers for each post
    const postsWithAnswers = await Promise.all(
      posts.map(async (post) => {
        const answers = await getPostAnswers(db, post.id);
        return { ...post, answers };
      })
    );

    return (
      <div className="bg-eggshell font-judson">
        <main className="container mx-auto px-4 py-8 pb-20">


          <NewPostButton />

          {postsWithAnswers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {postsWithAnswers.map((post) => (
                <PostCard key={post.id} post={post} currentUser={currentUser} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-8">No posts found.</p>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading home page:", error);
    return (
      <div className="bg-eggshell">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4 text-slightlyblack">
            Concursus
          </h1>
          <p className="text-center text-gray-500 mt-8">
            Error loading posts. Please try again later.
          </p>
        </main>
      </div>
    );
  }
}
