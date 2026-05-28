"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, BookOpen, Tag, BarChart3 } from "lucide-react";

interface Question { id: string; type: string; question: string; options: string[]; correctAnswer: any; explanation?: string; points: number; tags: string[]; difficulty: string; usageCount?: number; }

export default function QuestionBank({ courseId, onAddToQuiz }: { courseId: string; onAddToQuiz?: (qs: Question[]) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchQuestions(); }, [courseId]);

  const fetchQuestions = async () => {
    try { const res = await fetch(`/api/courses/${courseId}/quizzes?bankOnly=true`); if (res.ok) { const data = await res.json(); setQuestions(data.questions || []); } } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = questions.filter(q => {
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && q.type !== filterType) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const diffColor: Record<string, string> = { BEGINNER: "text-green-400 bg-green-900/30", INTERMEDIATE: "text-yellow-400 bg-yellow-900/30", ADVANCED: "text-red-400 bg-red-900/30" };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="w-6 h-6" /> Question Bank</h1>
        <div className="flex gap-3">
          {selectedIds.size > 0 && onAddToQuiz && <button onClick={() => { onAddToQuiz(questions.filter(q => selectedIds.has(q.id))); setSelectedIds(new Set()); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">Add {selectedIds.size} to Quiz</button>}
        </div>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Search..." /></div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"><option value="">All Types</option><option value="MULTIPLE_CHOICE">Multiple Choice</option><option value="TRUE_FALSE">True/False</option><option value="SHORT_ANSWER">Short Answer</option><option value="ESSAY">Essay</option><option value="CODE">Code</option></select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"><option value="">All Levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? <div className="text-center py-12 text-gray-400">No questions found.</div> : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className={`bg-gray-800 rounded-lg p-4 border ${selectedIds.has(q.id) ? "border-blue-500" : "border-gray-700"}`}>
              <div className="flex items-start gap-3">
                {onAddToQuiz && <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => toggleSelect(q.id)} className="mt-1 rounded bg-gray-700 border-gray-600" />}
                <div className="flex-1">
                  <p className="text-white mb-2">{q.question}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">{q.type.replace("_", " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${diffColor[q.difficulty] || "text-gray-400 bg-gray-700"}`}>{q.difficulty}</span>
                    <span className="text-xs text-gray-400">{q.points} pts</span>
                    {q.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300"><Tag className="w-3 h-3 inline mr-1" />{t}</span>)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-gray-500 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => setQuestions(prev => prev.filter(x => x.id !== q.id))} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
