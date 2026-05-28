"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Eye, GripVertical } from "lucide-react";

interface RubricLevel { label: string; points: number; description: string; }
interface RubricCriterion { name: string; description: string; levels: RubricLevel[]; }

const DEFAULT_LEVELS: RubricLevel[] = [
  { label: "Excellent", points: 4, description: "" },
  { label: "Good", points: 3, description: "" },
  { label: "Adequate", points: 2, description: "" },
  { label: "Poor", points: 1, description: "" },
];

export default function RubricBuilder({ courseId, rubricId, onSave }: { courseId?: string; rubricId?: string; onSave?: (r: any) => void }) {
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const addCriterion = () => setCriteria(prev => [...prev, { name: "", description: "", levels: DEFAULT_LEVELS.map(l => ({ ...l })) }]);
  const removeCriterion = (idx: number) => setCriteria(prev => prev.filter((_, i) => i !== idx));
  const updateCriterion = (idx: number, updates: Partial<RubricCriterion>) => setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));

  const updateLevel = (cIdx: number, lIdx: number, updates: Partial<RubricLevel>) => {
    setCriteria(prev => prev.map((c, ci) => ci === cIdx ? { ...c, levels: c.levels.map((l, li) => li === lIdx ? { ...l, ...updates } : l) } : c));
  };

  const totalPoints = criteria.reduce((sum, c) => sum + Math.max(...c.levels.map(l => l.points), 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = rubricId ? `/api/courses/${courseId}/gradebook` : `/api/courses/${courseId}/gradebook`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rubric", title, criteria }) });
      if (res.ok) { const data = await res.json(); onSave?.(data); }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  if (preview) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{title || "Untitled Rubric"}</h1>
          <button onClick={() => setPreview(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Edit</button>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-gray-400">Criteria</th>
                {(criteria[0]?.levels || DEFAULT_LEVELS).map((l, i) => <th key={i} className="text-center p-3 text-gray-400">{l.label} ({l.points})</th>)}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, ci) => (
                <tr key={ci} className="border-b border-gray-700/50">
                  <td className="p-3"><p className="text-white font-medium">{c.name}</p><p className="text-gray-500 text-xs">{c.description}</p></td>
                  {c.levels.map((l, li) => <td key={li} className="p-3 text-center text-gray-300 text-xs">{l.description}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-400 text-sm mt-4">Total: {totalPoints} points</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{rubricId ? "Edit Rubric" : "Create Rubric"}</h1>
        <div className="flex gap-3">
          <button onClick={() => setPreview(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg inline-flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
        </div>
      </div>

      <div className="mb-6"><label className="text-sm text-gray-400 mb-1 block">Title</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Rubric title..." /></div>

      <div className="space-y-6">
        {criteria.map((criterion, cIdx) => (
          <div key={cIdx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <GripVertical className="w-4 h-4 text-gray-500" />
              <input value={criterion.name} onChange={e => updateCriterion(cIdx, { name: e.target.value })} className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Criterion name" />
              <button onClick={() => removeCriterion(cIdx)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
            <input value={criterion.description} onChange={e => updateCriterion(cIdx, { description: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm mb-3" placeholder="Description" />
            <div className="grid grid-cols-4 gap-3">
              {criterion.levels.map((level, lIdx) => (
                <div key={lIdx} className="bg-gray-700/50 rounded-lg p-3">
                  <input value={level.label} onChange={e => updateLevel(cIdx, lIdx, { label: e.target.value })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2" />
                  <input type="number" value={level.points} onChange={e => updateLevel(cIdx, lIdx, { points: parseInt(e.target.value) || 0 })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2" />
                  <textarea value={level.description} onChange={e => updateLevel(cIdx, lIdx, { description: e.target.value })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-white text-xs" rows={2} placeholder="Description..." />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addCriterion} className="mt-4 w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 border-dashed rounded-lg text-gray-400 inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Criterion</button>
      <p className="text-gray-500 text-sm mt-4">Total: {totalPoints} points</p>
    </div>
  );
}
