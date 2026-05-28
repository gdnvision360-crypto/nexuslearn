"use client";

import { FileManager } from "@/components/files/FileManager";

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h1>
        <p className="text-sm text-gray-500">Manage your files and storage</p>
      </div>
      <div className="h-[calc(100vh-14rem)] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <FileManager />
      </div>
    </div>
  );
}
