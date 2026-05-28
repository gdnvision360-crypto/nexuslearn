"use client";

import { SocialDashboard } from "@/components/social/SocialDashboard";
import { Share2 } from "lucide-react";

export default function SocialPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Media
            </h1>
            <p className="text-sm text-gray-500">
              Manage, schedule, and analyze your social media presence
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <SocialDashboard />
    </div>
  );
}
