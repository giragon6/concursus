import React from "react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import AnswerList from "./AnswerList";
import { User } from "firebase/auth";

interface Answer {
  id: string;
  text: string;
  votes: number;
  userVotes?: string[];
}

interface PostProps {
  id: string;
  title: string;
  posterId: string;
  posterPhotoURL: any;
  posterDisplayName: string;
  createdAt: Timestamp;
  description?: string;
  tags: string[];
  answers: Answer[];
}

const PostCard: React.FC<{ post: PostProps; currentUser: User | null }> = ({
  post,
  currentUser,
}) => {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block transition-transform hover:scale-[1.02]"
    >
      <div className="post-card bg-white rounded-xl p-5 shadow-lg flex flex-col h-full">
        <div className="flex">
          <img
            className="profileImage m-1 mr-2 rounded-full"
            src={post.posterPhotoURL || "/profile.svg"}
            alt={post.posterDisplayName}
            style={{ width: "40px", height: "40px", objectFit: "cover" }}
          />
          <div className="flex-col">
            <h3 className="post-title font-bold text-xl">{post.title}</h3>
            <p className="post-author text-sm text-burntorange">
              Posted by: {post.posterDisplayName || "Anonymous"}
            </p>
            <p className="post-date text-sm text-burntorange">
              Created on:{" "}
              {post.createdAt
                ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
                : "Unknown date"}
            </p>
          </div>
        </div>

        {post.description && (
          <p className="post-content text-md text-left mt-2">
            {post.description.length > 100
              ? `${post.description.substring(0, 100)}...`
              : post.description}
          </p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-tags mt-3">
            <span className="text-sm font-semibold">Tags: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-skyblue text-deepblue text-sm px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <AnswerList
          postId={post.id}
          answers={post.answers}
          currentUser={currentUser}
        />

        <div className="mt-auto pt-3 text-amber-600 font-medium text-sm flex items-center justify-center">
          <span>View full discussion</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="bg-burntorange rounded-xl w-full mt-2 p-3">
          <h1 className="text-eggshell">ai summary here based off of responses?</h1>
        </div>
      </div>

    </Link>
  );
};

export default PostCard;
