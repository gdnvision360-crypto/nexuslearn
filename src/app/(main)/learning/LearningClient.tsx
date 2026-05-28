"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const difficultyColors: Record<string, string> = {
  BEGINNER: "text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-400",
  INTERMEDIATE: "text-yellow-700 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400",
  ADVANCED: "text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400",
};

type Tab = "all" | "my" | "completed";

interface LearningClientProps {
  allCourses: any[];
  enrollments: any[];
}

export function LearningClient({ allCourses, enrollments }: LearningClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId));
  const myCourses = enrollments.filter((e: any) => e.status === "ACTIVE").map((e: any) => ({ ...e.course, progress: e.progress, enrollmentStatus: e.status }));
  const completedCourses = enrollments.filter((e: any) => e.status === "COMPLETED").map((e: any) => ({ ...e.course, progress: 100, enrollmentStatus: e.status }));

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allCourses.forEach((c: any) => { if (c.category) cats.add(c.category); });
    return Array.from(cats).sort();
  }, [allCourses]);

  const currentCourses = activeTab === "all" ? allCourses : activeTab === "my" ? myCourses : completedCourses;

  const filtered = useMemo(() => {
    return currentCourses.filter((c: any) => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiff = filterDifficulty === "ALL" || c.difficulty === filterDifficulty;
      const matchCat = filterCategory === "ALL" || c.category === filterCategory;
      return matchSearch && matchDiff && matchCat;
    });
  }, [currentCourses, searchQuery, filterDifficulty, filterCategory]);

  const handleEnroll = async (courseId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Courses", count: allCourses.length },
    { key: "my", label: "My Courses", count: myCourses.length },
    { key: "completed", label: "Completed", count: completedCourses.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning</h1>
          <p className="text-sm text-gray-500">Browse and enroll in courses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            {tab.label}
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-600">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All Levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course: any) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <div
                key={course.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-indigo-400 to-purple-500">
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h3>
                    <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-medium", difficultyColors[course.difficulty] ?? "")}>
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium dark:bg-gray-700">
                      {getInitials(course.instructor?.name ?? "?")}
                    </div>
                    {course.instructor?.name}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course._count?.enrollments ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course._count?.modules ?? 0} modules
                    </span>
                    {course.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(course.duration / 60)}h
                      </span>
                    )}
                  </div>
                  {/* Progress bar for enrolled courses */}
                  {course.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-indigo-600">{Math.round(course.progress)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${Math.min(course.progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="mt-3">
                    {isEnrolled ? (
                      <button className="w-full rounded-lg bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400">
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        {course.price > 0 ? `Enroll — $${course.price}` : "Enroll Free"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
