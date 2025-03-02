import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-eggshell min-h-screen font-judson">
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Post Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
