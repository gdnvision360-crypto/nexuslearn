"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Eye, Upload, Save, Settings, ChevronDown, ChevronUp, Copy } from "lucide-react";

interface QuizQuestion {
  id: string; type: string; question: string; options: string[];
  correctAnswer: any; explanation: string; points: number; tags: string[]; difficulty: string;
}

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
  { value: "CODE", label: "Code" },
];

export default function QuizBuilder({ courseId, lessonId, quizId, onSave }: { courseId: string; lessonId: string; quizId?: string; onSave?: (q: any) => void }) {
  const [settings, setSettings] = useState({ title: "", description: "", timeLimit: null as number | null, attempts: 1, passingScore: 70, shuffleQuestions: false, showResults: true });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const addQuestion = (type = "MULTIPLE_CHOICE") => {
    const q: QuizQuestion = { id: `temp_${Date.now()}`, type, question: "", options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [], correctAnswer: type === "TRUE_FALSE" ? "True" : "", explanation: "", points: 1, tags: [], difficulty: "BEGINNER" };
    setQuestions(prev => [...prev, q]);
    setExpandedQ(q.id);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  const removeQuestion = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));
  const moveQuestion = (idx: number, dir: -1 | 1) => { const ni = idx + dir; if (ni < 0 || ni >= questions.length) return; const c = [...questions]; [c[idx], c[ni]] = [c[ni], c[idx]]; setQuestions(c); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = quizId ? "PUT" : "POST";
      const url = quizId ? `/api/courses/${courseId}/quizzes/${quizId}` : `/api/courses/${courseId}/quizzes`;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, lessonId, questions: questions.map((q, i) => ({ ...q, sortOrder: i })) }) });
      if (res.ok) { const data = await res.json(); onSave?.(data); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = (evt.target?.result as string).split("\n").filter(Boolean);
      const imported = lines.slice(1).map((line, i) => {
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        return { id: `imp_${Date.now()}_${i}`, type: "MULTIPLE_CHOICE", question: cols[0] || "", options: cols.slice(1, 5).filter(Boolean), correctAnswer: cols[5] || "", explanation: cols[6] || "", points: 1, tags: [] as string[], difficulty: "BEGINNER" };
      });
      setQuestions(prev => [...prev, ...imported]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{quizId ? "Edit Quiz" : "Create Quiz"}</h1>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-between w-full"><div className="flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /><h2 className="text-lg font-semibold text-white">Settings</h2></div>{showSettings ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</button>
        {showSettings && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Title</label><input value={settings.title} onChange={e => setSettings(s => ({ ...s, title: e.target.value }))} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div className="col-span-2"><label className="block text-sm text-gray-400 mb-1">Description</label><textarea value={settings.description} onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" rows={2} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Time Limit (min)</label><input type="number" value={settings.timeLimit || ""} onChange={e => setSettings(s => ({ ...s, timeLimit: e.target.value ? parseInt(e.target.value) : null }))} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Max Attempts</label><input type="number" value={settings.attempts} onChange={e => setSettings(s => ({ ...s, attempts: parseInt(e.target.value) || 1 }))} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" min={1} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Passing Score (%)</label><input type="number" value={settings.passingScore} onChange={e => setSettings(s => ({ ...s, passingScore: parseFloat(e.target.value) || 70 }))} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={settings.shuffleQuestions} onChange={e => setSettings(s => ({ ...s, shuffleQuestions: e.target.checked }))} className="rounded bg-gray-700" /> Shuffle</label>
              <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" checked={settings.showResults} onChange={e => setSettings(s => ({ ...s, showResults: e.target.checked }))} className="rounded bg-gray-700" /> Show Results</label>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
              <GripVertical className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">Q{idx + 1}</span>
              <span className="text-sm text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">{QUESTION_TYPES.find(t => t.value === q.type)?.label}</span>
              <span className="text-white flex-1 truncate">{q.question || "Untitled"}</span>
              <span className="text-sm text-gray-400">{q.points} pts</span>
              <button onClick={e => { e.stopPropagation(); moveQuestion(idx, -1); }} className="p-1 text-gray-500 hover:text-white"><ChevronUp className="w-4 h-4" /></button>
              <button onClick={e => { e.stopPropagation(); moveQuestion(idx, 1); }} className="p-1 text-gray-500 hover:text-white"><ChevronDown className="w-4 h-4" /></button>
              <button onClick={e => { e.stopPropagation(); removeQuestion(q.id); }} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
            {expandedQ === q.id && (
              <div className="border-t border-gray-700 p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm text-gray-400 mb-1">Type</label><select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white">{QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Points</label><input type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                  <div><label className="block text-sm text-gray-400 mb-1">Difficulty</label><select value={q.difficulty} onChange={e => updateQuestion(q.id, { difficulty: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div>
                </div>
                <div><label className="block text-sm text-gray-400 mb-1">Question</label><textarea value={q.question} onChange={e => updateQuestion(q.id, { question: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" rows={2} /></div>
                {q.type === "MULTIPLE_CHOICE" && (
                  <div><label className="block text-sm text-gray-400 mb-2">Options</label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 mb-2">
                        <button onClick={() => updateQuestion(q.id, { correctAnswer: opt })} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${q.correctAnswer === opt ? "border-green-500 bg-green-900/30 text-green-400" : "border-gray-600 text-gray-500"}`}>{String.fromCharCode(65 + oi)}</button>
                        <input value={opt} onChange={e => { const opts = [...q.options]; opts[oi] = e.target.value; updateQuestion(q.id, { options: opts }); }} className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                        {q.options.length > 2 && <button onClick={() => updateQuestion(q.id, { options: q.options.filter((_, i) => i !== oi) })} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    ))}
                    <button onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })} className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add Option</button>
                  </div>
                )}
                {q.type === "TRUE_FALSE" && (
                  <div className="flex gap-3">{["True", "False"].map(o => (<button key={o} onClick={() => updateQuestion(q.id, { correctAnswer: o })} className={`px-6 py-2 rounded-lg border ${q.correctAnswer === o ? "border-green-500 bg-green-900/30 text-green-400" : "border-gray-600 text-gray-400"}`}>{o}</button>))}</div>
                )}
                {(q.type === "SHORT_ANSWER" || q.type === "FILL_BLANK") && (
                  <div><label className="block text-sm text-gray-400 mb-1">Correct Answer</label><input value={q.correctAnswer || ""} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                )}
                <div><label className="block text-sm text-gray-400 mb-1">Explanation</label><textarea value={q.explanation} onChange={e => updateQuestion(q.id, { explanation: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" rows={2} /></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {QUESTION_TYPES.slice(0, 3).map(t => (<button key={t.value} onClick={() => addQuestion(t.value)} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> {t.label}</button>))}
        <label className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 text-sm inline-flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4" /> CSV<input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" /></label>
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg flex items-center justify-between">
        <span className="text-gray-400">{questions.length} questions • {questions.reduce((s, q) => s + q.points, 0)} pts</span>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  );
}
