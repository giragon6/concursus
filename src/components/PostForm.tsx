"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/firebase/firestore";
import { TAGS_BY_CATEGORY } from "@/lib/constants/tags";

interface PostFormProps {
  onClose: () => void;
}

interface AnswerInput {
  id: string;
  text: string;
}

const PostForm: React.FC<PostFormProps> = ({ onClose }) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<AnswerInput[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(
    Object.keys(TAGS_BY_CATEGORY)[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddAnswer = () => {
    setAnswers([...answers, { id: Date.now().toString(), text: "" }]);
  };

  const handleRemoveAnswer = (id: string) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((answer) => answer.id !== id));
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(
      answers.map((answer) =>
        answer.id === id ? { ...answer, text: value } : answer
      )
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (answers.some((answer) => !answer.text.trim())) {
      setError("All answer options must have text");
      return;
    }

    try {
      setIsSubmitting(true);
      await createPost(
        title,
        description || null,
        answers.map((a) => ({ answerText: a.text })),
        selectedTags
      );

      router.refresh();
      onClose();
    } catch (err) {
      setError("Failed to create post. Please try again.");
      console.error("Error creating post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Question Title*
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Ask your question..."
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          rows={3}
          placeholder="Add more details to your question..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Answer Options* (minimum 2)
        </label>
        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div key={answer.id} className="flex items-center gap-2">
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={`Answer option ${index + 1}`}
                required
              />
              {answers.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveAnswer(answer.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove answer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddAnswer}
          className="mt-2 text-amber-600 hover:text-amber-700 text-sm flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add another answer option
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (optional)
        </label>
        <div className="border border-gray-300 rounded-md p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.keys(TAGS_BY_CATEGORY).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-sm rounded-full ${
                  activeCategory === category
                    ? "bg-amber-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="h-40 overflow-y-auto p-2 border border-gray-200 rounded">
            <div className="flex flex-wrap gap-2">
              {TAGS_BY_CATEGORY[activeCategory]?.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    selectedTags.includes(tag)
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">
                Selected tags:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Post"}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
