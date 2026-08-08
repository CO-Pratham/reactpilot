import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <h2 className="text-3xl font-bold text-gray-100 mb-2">404 - Page Not Found</h2>
      <p className="text-gray-400 mb-6">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
