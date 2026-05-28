"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Grid3X3,
  List,
  Search,
  FolderPlus,
  Upload,
  ChevronRight,
  Home,
  MoreVertical,
  Download,
  Share2,
  Edit3,
  Move,
  Trash2,
  FolderIcon,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  X,
  HardDrive,
} from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/upload";
import { FileUploader } from "./FileUploader";

// ============================================================
// Types
// ============================================================

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string | null;
  };
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  isShared: boolean;
  createdAt: string;
  _count: { files: number };
}

type SortField = "name" | "date" | "size" | "type";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

interface FileManagerProps {
  className?: string;
}

// ============================================================
// FileManager
// ============================================================

export function FileManager({ className = "" }: FileManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "My Files" }]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUploader, setShowUploader] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
    itemType: "file" | "folder";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(5 * 1024 * 1024 * 1024); // 5GB

  // Fetch files and folders
  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.set("folderId", currentFolderId);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files ?? []);
        setFolders(data.folders ?? []);
        setStorageUsed(data.storageUsed ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
    setIsLoading(false);
  }, [currentFolderId, searchQuery]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Navigate to folder
  const navigateToFolder = useCallback(
    (folderId: string | null, folderName: string) => {
      if (folderId === null) {
        setBreadcrumbs([{ id: null, name: "My Files" }]);
      } else {
        setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
      }
      setCurrentFolderId(folderId);
      setSelectedIds(new Set());
    },
    []
  );

  const navigateToBreadcrumb = (index: number) => {
    const crumb = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(crumb.id);
    setSelectedIds(new Set());
  };

  // Sort logic
  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      switch (sortField) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "size":
          return a.size - b.size;
        case "type":
          return a.mimeType.localeCompare(b.mimeType);
        default:
          return 0;
      }
    });
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [files, sortField, sortDirection]);

  // Filtered
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return sortedFiles;
    const q = searchQuery.toLowerCase();
    return sortedFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.originalName.toLowerCase().includes(q)
    );
  }, [sortedFiles, searchQuery]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = [
      ...filteredFolders.map((f) => f.id),
      ...filteredFiles.map((f) => f.id),
    ];
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Context menu actions
  const handleContextMenu = (
    e: React.MouseEvent,
    itemId: string,
    itemType: "file" | "folder"
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId, itemType });
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      fetchContents();
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;
    try {
      await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      fetchContents();
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/download`);
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Failed to download:", error);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const storagePercent = Math.round((storageUsed / storageLimit) * 100);

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id ?? "root"} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`rounded px-1.5 py-0.5 ${
                    index === breadcrumbs.length - 1
                      ? "font-semibold text-gray-900 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {index === 0 ? (
                    <Home className="inline h-4 w-4" />
                  ) : (
                    crumb.name
                  )}
                </button>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-52 rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Sort */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
          <button
            onClick={() =>
              setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
            }
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </button>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-l-lg p-1.5 ${
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg p-1.5 ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={handleCreateFolder}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            title="New folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 border-b border-gray-200 bg-blue-50 px-4 py-2 dark:border-gray-700 dark:bg-blue-500/10">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} selected
          </span>
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Select all
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Clear
          </button>
          <div className="flex-1" />
          <button
            onClick={() => handleDelete(Array.from(selectedIds))}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

      {/* Upload Panel */}
      {showUploader && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Upload Files
            </h3>
            <button
              onClick={() => setShowUploader(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <FileUploader
            parentType="folder"
            parentId={currentFolderId ?? undefined}
            onUploadComplete={() => {
              fetchContents();
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <FolderIcon className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium">No files yet</p>
            <p className="mt-1 text-sm">Upload files or create a folder to get started</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
                onContextMenu={(e) => handleContextMenu(e, folder.id, "folder")}
                onClick={() => toggleSelect(folder.id)}
                className={`group cursor-pointer rounded-xl border p-3 transition-colors ${
                  selectedIds.has(folder.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <FolderIcon className="h-10 w-10 text-blue-500" />
                <p className="mt-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                  {folder.name}
                </p>
                <p className="text-xs text-gray-500">
                  {folder._count.files} files
                </p>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onContextMenu={(e) => handleContextMenu(e, file.id, "file")}
                onClick={() => toggleSelect(file.id)}
                className={`group cursor-pointer rounded-xl border p-3 transition-colors ${
                  selectedIds.has(file.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                {file.mimeType.startsWith("image/") ? (
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-3xl dark:bg-gray-700">
                    {getFileIcon(file.mimeType)}
                  </div>
                )}
                <p className="mt-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  <th className="w-8 px-3 py-2">
                    <button
                      onClick={selectedIds.size > 0 ? clearSelection : selectAll}
                    >
                      {selectedIds.size > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Modified</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((folder) => (
                  <tr
                    key={folder.id}
                    onDoubleClick={() =>
                      navigateToFolder(folder.id, folder.name)
                    }
                    onContextMenu={(e) =>
                      handleContextMenu(e, folder.id, "folder")
                    }
                    className={`cursor-pointer border-b border-gray-100 transition-colors dark:border-gray-800 ${
                      selectedIds.has(folder.id)
                        ? "bg-blue-50 dark:bg-blue-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button onClick={() => toggleSelect(folder.id)}>
                        {selectedIds.has(folder.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {folder.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">Folder</td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {folder._count.files} items
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) =>
                          handleContextMenu(e, folder.id, "folder")
                        }
                        className="rounded p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    onContextMenu={(e) =>
                      handleContextMenu(e, file.id, "file")
                    }
                    className={`cursor-pointer border-b border-gray-100 transition-colors dark:border-gray-800 ${
                      selectedIds.has(file.id)
                        ? "bg-blue-50 dark:bg-blue-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button onClick={() => toggleSelect(file.id)}>
                        {selectedIds.has(file.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getFileIcon(file.mimeType)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {file.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {file.mimeType.split("/").pop()}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => handleContextMenu(e, file.id, "file")}
                        className="rounded p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Storage Usage */}
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-gray-400" />
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${
                  storagePercent > 90
                    ? "bg-red-500"
                    : storagePercent > 70
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.itemType === "file" && (
            <button
              onClick={() => {
                handleDownload(contextMenu.itemId);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          )}
          <button
            onClick={() => setContextMenu(null)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={() => setContextMenu(null)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Edit3 className="h-4 w-4" />
            Rename
          </button>
          <button
            onClick={() => setContextMenu(null)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Move className="h-4 w-4" />
            Move
          </button>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => {
              handleDelete([contextMenu.itemId]);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
