"use client";

import React, { useState, useEffect } from "react";
import {
  checkUserVoteOnPost,
  updateAnswerWithVote,
} from "@/lib/firebase/firestore";
import { User } from "firebase/auth";

interface Answer {
  id: string;
  text: string;
  votes: number;
  userVotes?: string[];
}

interface AnswerListProps {
  postId: string;
  answers: Answer[];
  currentUser: User | null;
}

const AnswerList: React.FC<AnswerListProps> = ({
  postId,
  answers,
  currentUser,
}) => {
  const [localAnswers, setLocalAnswers] = useState<Answer[]>(answers || []);
  const [votingInProgress, setVotingInProgress] = useState<{
    [key: string]: boolean;
  }>({});
  const [voteError, setVoteError] = useState<string | null>(null);
  const [hasVotedOnPost, setHasVotedOnPost] = useState<boolean>(
    currentUser
      ? answers.some((answer) => answer.userVotes?.includes(currentUser.uid))
      : false
  );

  useEffect(() => {
    const loadUserVote = async () => {
      if (currentUser && !hasVotedOnPost) {
        try {
          const votedAnswerId = await checkUserVoteOnPost(postId);
          if (votedAnswerId) {
            setHasVotedOnPost(true);

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
  }, [currentUser, postId, hasVotedOnPost, answers]);

  if (!answers || answers.length === 0) {
    return (
      <div className="mt-auto pt-3 text-amber-600 font-medium text-sm">
        Click to view and answer this question
      </div>
    );
  }

  const handleVote = async (e: React.MouseEvent, answerId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser || votingInProgress[answerId] || hasVotedOnPost) {
      return;
    }

    try {
      setVotingInProgress((prev) => ({ ...prev, [answerId]: true }));

      const result = await updateAnswerWithVote(postId, answerId);

      if (!result || !result.success) {
        if (result?.alreadyVoted) {
          setHasVotedOnPost(true);
        } else {
          setVoteError(result?.message || "Failed to register vote");
          setTimeout(() => setVoteError(null), 3000);
        }
        return;
      }

      const answer = localAnswers.find((a) => a.id === answerId);
      if (answer?.userVotes?.includes(currentUser.uid)) {
        return;
      }

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
    } catch (error) {
      console.error("Error voting:", error);
      setVoteError("Failed to register vote. Please try again.");
      setTimeout(() => setVoteError(null), 3000);
    } finally {
      setVotingInProgress((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  const sortedAnswers = [...localAnswers].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const topAnswers = sortedAnswers.slice(0, 2);

  return (
    <div className="mt-4">
      <h4 className="text-md font-medium mb-2">Top Answers:</h4>

      {voteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded mb-2 text-sm">
          {voteError}
        </div>
      )}

      <div className="space-y-2">
        {topAnswers.map((answer) => {
          const hasVoted =
            currentUser && answer.userVotes?.includes(currentUser.uid);

          return (
            <div
              key={answer.id}
              className={`p-2 rounded-lg ${
                hasVoted
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="flex-grow text-gray-800 text-sm">{answer.text}</p>

                <div className="flex items-center ml-2">
                  <span className="text-gray-600 text-sm font-medium mr-2">
                    {answer.votes || 0}
                  </span>

                  <button
                    onClick={
                      hasVoted || hasVotedOnPost
                        ? undefined
                        : (e) => handleVote(e, answer.id)
                    }
                    disabled={
                      !currentUser ||
                      hasVoted ||
                      hasVotedOnPost ||
                      votingInProgress[answer.id]
                    }
                    className={`flex items-center px-2 py-1 rounded-full text-xs ${
                      hasVoted
                        ? "bg-amber-100 text-amber-600 cursor-default"
                        : hasVotedOnPost
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : currentUser
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    title={
                      hasVoted
                        ? "You voted for this answer"
                        : hasVotedOnPost
                        ? "You can only vote once per post"
                        : "Vote for this answer"
                    }
                  >
                    {hasVoted ? "✓ Voted" : "Vote"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedAnswers.length > 2 && (
        <div className="text-center mt-2 text-sm text-amber-600">
          +{sortedAnswers.length - 2} more answers
        </div>
      )}
    </div>
  );
};

export default AnswerList;
