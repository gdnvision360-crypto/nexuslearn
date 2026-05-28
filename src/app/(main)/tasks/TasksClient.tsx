"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Filter,
  ChevronDown,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const statusColumns = [
  { key: "TODO", label: "To Do", color: "border-gray-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-blue-500" },
  { key: "IN_REVIEW", label: "In Review", color: "border-yellow-500" },
  { key: "DONE", label: "Done", color: "border-green-500" },
] as const;

const priorityInfo: Record<string, { icon: any; color: string; label: string }> = {
  URGENT: { icon: AlertCircle, color: "text-red-600 bg-red-50", label: "Urgent" },
  HIGH: { icon: ArrowUp, color: "text-orange-600 bg-orange-50", label: "High" },
  MEDIUM: { icon: Minus, color: "text-yellow-600 bg-yellow-50", label: "Medium" },
  LOW: { icon: ArrowDown, color: "text-blue-600 bg-blue-50", label: "Low" },
};

type ViewMode = "kanban" | "list" | "calendar";

interface TasksClientProps {
  tasks: any[];
  projects: any[];
}

export function TasksClient({ tasks, projects }: TasksClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: projects[0]?.id ?? "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    storyPoints: "",
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProject = filterProject === "ALL" || t.projectId === filterProject;
      const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
      const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
      return matchSearch && matchProject && matchPriority && matchStatus;
    });
  }, [tasks, searchQuery, filterProject, filterPriority, filterStatus]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const col of statusColumns) map[col.key] = [];
    for (const task of filtered) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [filtered]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          storyPoints: form.storyPoints ? parseInt(form.storyPoints) : undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const sprintTasks = filtered.length;
  const doneTasks = filtered.filter((t) => t.status === "DONE").length;
  const sprintProgress = sprintTasks > 0 ? Math.round((doneTasks / sprintTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500">Manage and track your tasks</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Sprint Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sprint Progress</span>
          <span className="text-sm font-semibold text-indigo-600">{sprintProgress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${sprintProgress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">{doneTasks} of {sprintTasks} tasks complete</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn("rounded-l-lg p-2", viewMode === "kanban" ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500")}
            title="Kanban"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-2", viewMode === "list" ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500")}
            title="List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn("rounded-r-lg p-2", viewMode === "calendar" ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500")}
            title="Calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusColumns.map((col) => (
            <div key={col.key} className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800/50">
              <div className={cn("mb-3 flex items-center gap-2 border-l-4 pl-2", col.color)}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{col.label}</h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">
                  {tasksByStatus[col.key]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {tasksByStatus[col.key]?.map((task: any) => {
                  const pri = priorityInfo[task.priority] ?? priorityInfo.MEDIUM;
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", pri.color)}>
                          <pri.icon className="h-3 w-3" />
                          {pri.label}
                        </span>
                      </div>
                      {task.project && (
                        <p className="mt-1 text-xs text-gray-500">
                          <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                          {task.project.name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assignee && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium dark:bg-gray-700" title={task.assignee.name}>
                              {getInitials(task.assignee.name ?? "?")}
                            </div>
                          )}
                          {task.storyPoints && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                              {task.storyPoints} SP
                            </span>
                          )}
                        </div>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      {(task.labels as string[])?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(task.labels as string[]).map((label: string, i: number) => (
                            <span key={i} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(tasksByStatus[col.key]?.length ?? 0) === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-xs text-gray-400 dark:border-gray-700">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task: any) => {
                const pri = priorityInfo[task.priority] ?? priorityInfo.MEDIUM;
                return (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", pri.color)}>
                        <pri.icon className="h-3 w-3" />
                        {pri.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.assignee?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.project?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View Placeholder */}
      {viewMode === "calendar" && (
        <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Calendar View</p>
          <p className="text-sm text-gray-400">Task calendar coming soon</p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Task</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
                  <select
                    required
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Story Points</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.storyPoints}
                    onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
