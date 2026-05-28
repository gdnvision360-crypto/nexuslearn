"use client";

import { useState } from "react";
import {
  Film,
  Type,
  Scissors,
  Captions,
  Image,
  LayoutTemplate,
  Plus,
  Clock,
  Play,
  Trash2,
  Download,
  MoreHorizontal,
  Search,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  Video,
  Music,
  Wand2,
} from "lucide-react";
import { TextToVideoPanel } from "@/components/video-studio/TextToVideoPanel";
import { VideoEditorPanel } from "@/components/video-studio/VideoEditorPanel";
import { CaptionGeneratorPanel } from "@/components/video-studio/CaptionGeneratorPanel";
import { ThumbnailGeneratorPanel } from "@/components/video-studio/ThumbnailGeneratorPanel";
import { VideoTemplatesPanel } from "@/components/video-studio/VideoTemplatesPanel";

type StudioTab = "projects" | "text-to-video" | "editor" | "captions" | "thumbnails" | "templates";

interface VideoProject {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  duration: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VideoStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("projects");
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "projects" as const, label: "My Projects", icon: Film },
    { id: "text-to-video" as const, label: "Text to Video", icon: Sparkles },
    { id: "editor" as const, label: "Video Editor", icon: Scissors },
    { id: "captions" as const, label: "Captions", icon: Captions },
    { id: "thumbnails" as const, label: "Thumbnails", icon: Image },
    { id: "templates" as const, label: "Templates", icon: LayoutTemplate },
  ];

  const stats = [
    { label: "Total Projects", value: projects.length, icon: Film, color: "text-blue-500" },
    { label: "AI Generated", value: projects.filter((p) => p.type === "text-to-video").length, icon: Sparkles, color: "text-purple-500" },
    { label: "Edited Videos", value: projects.filter((p) => p.type === "edited").length, icon: Scissors, color: "text-green-500" },
    { label: "Processing", value: projects.filter((p) => p.status === "processing").length, icon: Clock, color: "text-orange-500" },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Studio</h1>
                <p className="text-xs text-gray-500">Create, edit, and enhance videos</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("text-to-video")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Video
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "projects" && (
          <div>
            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="text-to-video">AI Generated</option>
                <option value="edited">Edited</option>
                <option value="template">From Template</option>
                <option value="recording">Recording</option>
              </select>
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-purple-100 text-purple-700" : "text-gray-400"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-purple-100 text-purple-700" : "text-gray-400"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No video projects yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first video using AI, templates, or the editor
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("text-to-video")}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Text to Video
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    Browse Templates
                  </button>
                  <button
                    onClick={() => setActiveTab("editor")}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Scissors className="w-4 h-4" />
                    Open Editor
                  </button>
                </div>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === "list" ? "flex items-center" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className={`bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ${
                        viewMode === "grid" ? "h-40" : "w-32 h-20"
                      }`}
                    >
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Film className="w-10 h-10 text-purple-400" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {project.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                        </div>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(project.duration)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            project.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : project.status === "processing"
                              ? "bg-orange-100 text-orange-700"
                              : project.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {project.status}
                        </span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      {viewMode === "grid" && (
                        <div className="flex items-center gap-2 mt-3">
                          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">
                            <Play className="w-3 h-3" />
                            Open
                          </button>
                          <button className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "text-to-video" && <TextToVideoPanel />}
        {activeTab === "editor" && <VideoEditorPanel />}
        {activeTab === "captions" && <CaptionGeneratorPanel />}
        {activeTab === "thumbnails" && <ThumbnailGeneratorPanel />}
        {activeTab === "templates" && <VideoTemplatesPanel />}
      </div>
    </div>
  );
}
