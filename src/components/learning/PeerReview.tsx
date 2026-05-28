"use client";

import { useState, useEffect } from "react";
import { Users, Star, Send, ChevronRight, Eye } from "lucide-react";

interface ReviewAssignment { id: string; submissionId: string; authorName: string; content: string; rubricCriteria: { name: string; maxPoints: number }[]; dueDate: string; completed: boolean; }
interface Review { criteriaScores: Record<string, number>; feedback: string; }

export default function PeerReview({ courseId, assignmentId }: { courseId: string; assignmentId: string }) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewAssignment | null>(null);
  const [review, setReview] = useState<Review>({ criteriaScores: {}, feedback: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try { /* fetch from API */ } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const submitReview = async () => {
    if (!selectedReview) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/gradebook`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "peer_review", reviewAssignmentId: selectedReview.id, ...review }) });
      if (res.ok) { setSelectedReview(null); setReview({ criteriaScores: {}, feedback: "" }); fetchAssignments(); }
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  if (selectedReview) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setSelectedReview(null)} className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-white mb-4">Peer Review</h1>
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Submission (Anonymous)</h3>
          <p className="text-white whitespace-pre-wrap">{selectedReview.content}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <h3 className="text-white font-semibold">Your Review</h3>
          {selectedReview.rubricCriteria.map(c => (
            <div key={c.name}>
              <label className="text-gray-300 text-sm mb-1 block">{c.name} (0-{c.maxPoints})</label>
              <div className="flex gap-2">
                {Array.from({ length: c.maxPoints + 1 }, (_, i) => (
                  <button key={i} onClick={() => setReview(r => ({ ...r, criteriaScores: { ...r.criteriaScores, [c.name]: i } }))}
                    className={`w-8 h-8 rounded text-sm ${review.criteriaScores[c.name] === i ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>{i}</button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Written Feedback</label>
            <textarea value={review.feedback} onChange={e => setReview(r => ({ ...r, feedback: e.target.value }))} rows={4} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Provide constructive feedback..." />
          </div>
          <button onClick={submitReview} disabled={submitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Review"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Users className="w-6 h-6" /> Peer Reviews</h1>
      <div className="space-y-3">
        {assignments.map(a => (
          <div key={a.id} onClick={() => !a.completed && setSelectedReview(a)} className={`bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between ${a.completed ? "opacity-50" : "hover:border-gray-600 cursor-pointer"}`}>
            <div>
              <p className="text-white">Review #{a.id.slice(-4)}</p>
              <p className="text-xs text-gray-500">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
            </div>
            {a.completed ? <span className="text-green-400 text-sm">Completed</span> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </div>
        ))}
        {assignments.length === 0 && <div className="text-center py-12 text-gray-400">No peer reviews assigned.</div>}
      </div>
    </div>
  );
}
