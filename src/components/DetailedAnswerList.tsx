"use client";

import React, { useState, useEffect } from "react";
import {
  updateAnswerWithVote,
  checkUserVoteOnPost,
} from "@/lib/firebase/firestore";
import { User } from "firebase/auth";

interface Answer {
  id: string;
  text: string;
  votes: number;
  userVotes?: string[];
}

interface DetailedAnswerListProps {
  postId: string;
  answers: Answer[];
  currentUser: User | null;
}

const DetailedAnswerList: React.FC<DetailedAnswerListProps> = ({
  postId,
  answers,
  currentUser,
}) => {
  // Ensure we have a valid array of answers
  const validAnswers = Array.isArray(answers) ? answers : [];
  const [localAnswers, setLocalAnswers] = useState<Answer[]>(validAnswers);
  const [votingInProgress, setVotingInProgress] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [hasVotedOnPost, setHasVotedOnPost] = useState<boolean>(
    // Check if user has already voted on any answer
    currentUser
      ? validAnswers.some((answer) =>
          answer.userVotes?.includes(currentUser.uid)
        )
      : false
  );

  // Load user's vote when component mounts
  useEffect(() => {
    const loadUserVote = async () => {
      if (currentUser && !hasVotedOnPost) {
        try {
          const votedAnswerId = await checkUserVoteOnPost(postId);
          if (votedAnswerId) {
            setHasVotedOnPost(true);

            // Mark this answer as voted in local state
            setLocalAnswers((prev) =>
              prev.map((answer) =>
                answer.id === votedAnswerId
                  ? {
                      ...answer,
                      userVotes: [...(answer.userVotes || []), currentUser.uid],
                    }
                  : answer
              )
            );
          }
        } catch (error) {
          console.error("Error checking user vote:", error);
        }
      }
    };

    loadUserVote();
  }, [currentUser, postId, hasVotedOnPost]);

  if (!answers || answers.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          No answers yet. Be the first to contribute!
        </p>
      </div>
    );
  }

  const handleVote = async (answerId: string) => {
    // Early returns for invalid states
    if (!currentUser || votingInProgress || hasVotedOnPost) {
      return;
    }

    try {
      setVotingInProgress(true);

      const result = await updateAnswerWithVote(postId, answerId);

      if (!result.success) {
        if (result.alreadyVoted) {
          setHasVotedOnPost(true);
          setVoteError("You can only vote once per post");
        } else {
          setVoteError(result.message || "Failed to register vote");
        }
        setTimeout(() => setVoteError(null), 3000);
        return;
      }

      // Update local state to reflect the vote
      setLocalAnswers((prev) =>
        prev.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                votes: (answer.votes || 0) + 1,
                userVotes: [...(answer.userVotes || []), currentUser.uid],
              }
            : answer
        )
      );

      setHasVotedOnPost(true);
    } catch (error: any) {
      console.error("Error voting:", error);
      setVoteError("Failed to register vote");
      setTimeout(() => setVoteError(null), 3000);
    } finally {
      setVotingInProgress(false);
    }
  };

  // Sort answers by vote count (descending)
  const sortedAnswers = [...localAnswers].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  return (
    <div className="space-y-6">
      {voteError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 112 0v4a1 1 0 11-2 0v-4zm1-7a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{voteError}</p>
            </div>
          </div>
        </div>
      )}

      {hasVotedOnPost && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v5.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586V7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                You have already voted on this post
              </p>
            </div>
          </div>
        </div>
      )}

      {sortedAnswers.map((answer, index) => {
        const hasVoted =
          currentUser && answer.userVotes?.includes(currentUser.uid);
        const isTopAnswer = index === 0 && answer.votes > 0;

        return (
          <div
            key={answer.id}
            className={`p-6 rounded-lg ${
              isTopAnswer
                ? "bg-amber-50 border border-amber-200"
                : hasVoted
                ? "bg-gray-50 border border-amber-100"
                : "bg-white border border-gray-200"
            }`}
          >
            {isTopAnswer && (
              <div className="flex items-center mb-3">
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Top Answer
                </span>
              </div>
            )}

            <div className="flex items-start">
              <div className="mr-4 flex flex-col items-center">
                <button
                  onClick={
                    hasVoted || hasVotedOnPost
                      ? undefined
                      : () => handleVote(answer.id)
                  }
                  disabled={
                    !currentUser ||
                    hasVoted ||
                    hasVotedOnPost ||
                    votingInProgress
                  }
                  className={`p-2 rounded-full ${
                    hasVoted
                      ? "bg-amber-100 text-amber-600 cursor-default"
                      : hasVotedOnPost
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : currentUser
                      ? "bg-white hover:bg-amber-50 text-gray-500 hover:text-amber-600 border border-gray-200 hover:border-amber-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    hasVoted
                      ? "You voted for this answer"
                      : hasVotedOnPost
                      ? "You can only vote once per post"
                      : currentUser
                      ? "Vote for this answer"
                      : "Sign in to vote"
                  }
                >
                  {hasVoted ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  )}
                </button>
                <span className="mt-2 font-bold text-gray-700">
                  {answer.votes || 0}
                </span>
                <span className="text-xs text-gray-500">votes</span>
              </div>

              <div className="flex-1">
                <p className="text-gray-800">{answer.text}</p>
              </div>
            </div>

            {hasVoted && (
              <div className="mt-3 text-right">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  You voted for this answer
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DetailedAnswerList;
