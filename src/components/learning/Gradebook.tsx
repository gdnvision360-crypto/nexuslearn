"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

interface GradeItem { id: string; name: string; category: string; weight: number; maxScore: number; }
interface StudentGrade { gradeItemId: string; score: number | null; feedback?: string; }
interface StudentRow { userId: string; name: string; grades: Record<string, StudentGrade>; total: number; letterGrade: string; }

const LETTER_GRADES = [
  { min: 93, grade: "A" }, { min: 90, grade: "A-" }, { min: 87, grade: "B+" }, { min: 83, grade: "B" },
  { min: 80, grade: "B-" }, { min: 77, grade: "C+" }, { min: 73, grade: "C" }, { min: 70, grade: "C-" },
  { min: 67, grade: "D+" }, { min: 63, grade: "D" }, { min: 60, grade: "D-" }, { min: 0, grade: "F" },
];

function getLetterGrade(pct: number) { return LETTER_GRADES.find(l => pct >= l.min)?.grade || "F"; }

export default function Gradebook({ courseId, isInstructor = false }: { courseId: string; isInstructor?: boolean }) {
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ userId: string; itemId: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { fetchGradebook(); }, [courseId]);

  const fetchGradebook = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook`);
      if (res.ok) { const data = await res.json(); setGradeItems(data.gradeItems || []); setStudents(data.students || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const saveGrade = async (userId: string, gradeItemId: string, score: number) => {
    try {
      await fetch(`/api/courses/${courseId}/gradebook`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, gradeItemId, score }) });
      fetchGradebook();
    } catch (err) { console.error(err); }
    setEditingCell(null);
  };

  const exportCSV = () => {
    const headers = ["Student", ...gradeItems.map(g => g.name), "Total", "Grade"];
    const rows = students.map(s => [s.name, ...gradeItems.map(g => s.grades[g.id]?.score?.toString() || ""), s.total.toFixed(1), s.letterGrade]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gradebook.csv"; a.click();
  };

  const categories = Array.from(new Set(gradeItems.map(g => g.category)));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  // Student view
  if (!isInstructor) {
    const myGrades = students[0];
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><BarChart3 className="w-6 h-6" /> My Grades</h1>
        {myGrades && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
                <p className="text-3xl font-bold text-white">{myGrades.total.toFixed(1)}%</p><p className="text-gray-400 text-sm">Overall</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
                <p className="text-3xl font-bold text-white">{myGrades.letterGrade}</p><p className="text-gray-400 text-sm">Letter Grade</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
                <p className="text-3xl font-bold text-white">{Object.values(myGrades.grades).filter(g => g.score !== null).length}/{gradeItems.length}</p><p className="text-gray-400 text-sm">Graded</p>
              </div>
            </div>
            <div className="space-y-3">
              {gradeItems.map(item => {
                const grade = myGrades.grades[item.id];
                return (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                    <div><p className="text-white">{item.name}</p><p className="text-xs text-gray-500">{item.category} • {item.weight}x weight</p></div>
                    <div className="text-right">
                      {grade?.score !== null && grade?.score !== undefined ? (
                        <p className="text-white font-medium">{grade.score}/{item.maxScore} <span className="text-gray-400">({((grade.score / item.maxScore) * 100).toFixed(0)}%)</span></p>
                      ) : (
                        <p className="text-gray-500">Not graded</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Instructor view
  return (
    <div className="max-w-full mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Gradebook</h1>
        <button onClick={exportCSV} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3 text-gray-400 font-medium sticky left-0 bg-gray-800 z-10">Student</th>
              {gradeItems.map(item => (
                <th key={item.id} className="text-center p-3 text-gray-400 font-medium min-w-[100px]">
                  <div>{item.name}</div><div className="text-xs text-gray-500">{item.maxScore} pts</div>
                </th>
              ))}
              <th className="text-center p-3 text-gray-400 font-medium">Total</th>
              <th className="text-center p-3 text-gray-400 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.userId} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-3 text-white sticky left-0 bg-gray-800">{student.name}</td>
                {gradeItems.map(item => {
                  const grade = student.grades[item.id];
                  const isEditing = editingCell?.userId === student.userId && editingCell?.itemId === item.id;
                  return (
                    <td key={item.id} className="p-3 text-center" onClick={() => { if (!isEditing) { setEditingCell({ userId: student.userId, itemId: item.id }); setEditValue(grade?.score?.toString() || ""); } }}>
                      {isEditing ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => { if (editValue) saveGrade(student.userId, item.id, parseFloat(editValue)); else setEditingCell(null); }} onKeyDown={e => { if (e.key === "Enter" && editValue) saveGrade(student.userId, item.id, parseFloat(editValue)); if (e.key === "Escape") setEditingCell(null); }} className="w-16 p-1 bg-gray-700 border border-blue-500 rounded text-white text-center" />
                      ) : (
                        <span className={`cursor-pointer ${grade?.score === null || grade?.score === undefined ? "text-gray-600" : "text-white"}`}>
                          {grade?.score !== null && grade?.score !== undefined ? grade.score : "—"}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 text-center text-white font-medium">{student.total.toFixed(1)}%</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-sm font-medium ${student.total >= 70 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>{student.letterGrade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
