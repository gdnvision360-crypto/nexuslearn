"use client";

import { useState, useEffect } from "react";
import { Route, Plus, Clock, CheckCircle, BookOpen, ChevronRight, Users } from "lucide-react";

interface PathStep { id: string; courseId: string; courseTitle: string; sortOrder: number; isRequired: boolean; completed?: boolean; }
interface LearningPath { id: string; title: string; description?: string; thumbnail?: string; estimatedHours: number; isPublished: boolean; steps: PathStep[]; progress?: number; enrolled?: boolean; enrollmentCount?: number; }

export default function LearningPaths({ isCreator = false }: { isCreator?: boolean }) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPaths(); }, []);

  const fetchPaths = async () => {
    try { const res = await fetch("/api/learning-paths"); if (res.ok) { const data = await res.json(); setPaths(data.paths || []); } } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const enrollInPath = async (pathId: string) => {
    try {
      const res = await fetch("/api/learning-paths", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enroll", pathId }) });
      if (res.ok) fetchPaths();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  if (selectedPath) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setSelectedPath(null)} className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-1">← Back</button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{selectedPath.title}</h1>
          {selectedPath.description && <p className="text-gray-400">{selectedPath.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedPath.estimatedHours}h estimated</span>
            <span className="inline-flex items-center gap-1"><BookOpen className="w-4 h-4" /> {selectedPath.steps.length} courses</span>
          </div>
          {selectedPath.progress !== undefined && (
            <div className="mt-4"><div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Progress</span><span className="text-white">{selectedPath.progress.toFixed(0)}%</span></div><div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedPath.progress}%` }} /></div></div>
          )}
        </div>
        {/* Path steps visualization */}
        <div className="space-y-4">
          {selectedPath.steps.sort((a, b) => a.sortOrder - b.sortOrder).map((step, idx) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step.completed ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                  {step.completed ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                {idx < selectedPath.steps.length - 1 && <div className={`w-0.5 h-8 ${step.completed ? "bg-green-600" : "bg-gray-700"}`} />}
              </div>
              <div className={`flex-1 bg-gray-800 rounded-lg p-4 border ${step.completed ? "border-green-700" : "border-gray-700"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{step.courseTitle}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {step.isRequired ? <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Required</span> : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Optional</span>}
                      {step.completed && <span className="text-xs text-green-400">Completed</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {!selectedPath.enrolled && (
          <div className="mt-6 text-center">
            <button onClick={() => enrollInPath(selectedPath.id)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Enroll in Path</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Route className="w-6 h-6" /> Learning Paths</h1>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {paths.map(path => (
          <div key={path.id} onClick={() => setSelectedPath(path)} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer overflow-hidden">
            {path.thumbnail && <img src={path.thumbnail} alt="" className="w-full h-32 object-cover" />}
            <div className="p-4">
              <h3 className="text-white font-semibold mb-1">{path.title}</h3>
              {path.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{path.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {path.estimatedHours}h</span>
                <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" /> {path.steps.length} courses</span>
                <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {path.enrollmentCount || 0}</span>
              </div>
              {path.progress !== undefined && (
                <div className="mt-3"><div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${path.progress}%` }} /></div></div>
              )}
            </div>
          </div>
        ))}
        {paths.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">No learning paths available.</div>}
      </div>
    </div>
  );
}
