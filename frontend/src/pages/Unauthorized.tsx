import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-panel border border-border rounded-lg p-8 text-center w-[420px]">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          403 - Access Denied
        </h1>

        <p className="text-muted mb-6">
          You do not have permission to access this page.
        </p>

        <Link
          to="/"
          className="bg-cyan text-bg px-4 py-2 rounded"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}