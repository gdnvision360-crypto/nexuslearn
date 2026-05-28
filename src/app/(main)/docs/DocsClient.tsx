"use client";

import { useState } from "react";
import {
  FileText,
  Table2,
  Presentation,
  PenTool,
  BookOpen,
  Plus,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  Clock,
  MoreVertical,
  ChevronDown,
  Star,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const docTypeInfo: Record<string, { icon: any; color: string; label: string }> = {
  DOC: { icon: FileText, color: "text-blue-600 bg-blue-50", label: "Document" },
  SPREADSHEET: { icon: Table2, color: "text-green-600 bg-green-50", label: "Spreadsheet" },
  PRESENTATION: { icon: Presentation, color: "text-orange-600 bg-orange-50", label: "Presentation" },
  WHITEBOARD: { icon: PenTool, color: "text-purple-600 bg-purple-50", label: "Whiteboard" },
  WIKI: { icon: BookOpen, color: "text-pink-600 bg-pink-50", label: "Wiki" },
};

interface DocsClientProps {
  documents: any[];
  folders: any[];
}

export function DocsClient({ documents, folders }: DocsClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const filtered = documents.filter((doc) => {
    const matchType = filterType === "ALL" || doc.type === filterType;
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const templates = documents.filter((d) => d.isTemplate);
  const recent = filtered.filter((d) => !d.isTemplate).slice(0, 20);

  const handleCreate = async (type: string) => {
    setShowCreateMenu(false);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Untitled ${docTypeInfo[type]?.label ?? "Document"}`, type }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-sm text-gray-500">Create and manage your documents</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Document
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {Object.entries(docTypeInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleCreate(key)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <info.icon className={cn("h-4 w-4", info.color.split(" ")[0])} />
                  {info.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All Types</option>
          {Object.entries(docTypeInfo).map(([key, info]) => (
            <option key={key} value={key}>{info.label}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("rounded-l-lg p-2", viewMode === "grid" ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500")}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("rounded-r-lg p-2", viewMode === "list" ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Folders</h2>
          <div className="flex flex-wrap gap-3">
            {folders.map((folder: any) => (
              <button
                key={folder.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <FolderOpen className="h-5 w-5 text-indigo-500" />
                <span className="font-medium text-gray-900 dark:text-white">{folder.name}</span>
                <span className="text-xs text-gray-400">{folder._count?.documents ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Templates</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {templates.map((doc: any) => {
              const info = docTypeInfo[doc.type] ?? docTypeInfo.DOC;
              return (
                <div
                  key={doc.id}
                  className="flex w-40 shrink-0 flex-col items-center rounded-xl border border-dashed border-gray-300 p-4 text-center hover:border-indigo-400 dark:border-gray-700"
                >
                  <div className={cn("rounded-lg p-2", info.color)}>
                    <info.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">{doc.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Documents</h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">No documents found</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((doc: any) => {
              const info = docTypeInfo[doc.type] ?? docTypeInfo.DOC;
              return (
                <div
                  key={doc.id}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("rounded-lg p-2", info.color)}>
                      <info.icon className="h-5 w-5" />
                    </div>
                    <button className="hidden rounded p-1 text-gray-400 hover:bg-gray-100 group-hover:block dark:hover:bg-gray-800">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="mt-3 font-medium text-gray-900 dark:text-white">{doc.title}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium dark:bg-gray-700">
                      {getInitials(doc.owner?.name ?? "?")}
                    </div>
                    <span className="text-xs text-gray-400">{info.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Modified</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((doc: any) => {
                  const info = docTypeInfo[doc.type] ?? docTypeInfo.DOC;
                  return (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <info.icon className={cn("h-4 w-4", info.color.split(" ")[0])} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{info.label}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{doc.owner?.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
