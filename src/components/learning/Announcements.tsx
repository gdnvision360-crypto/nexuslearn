"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Pin, Clock } from "lucide-react";

interface Announcement { id: string; title: string; content: string; authorName: string; isPinned: boolean; createdAt: string; }

export default function Announcements({ courseId, isInstructor = false }: { courseId: string; isInstructor?: boolean }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnnouncements(); }, [courseId]);

  const fetchAnnouncements = async () => {
    try { const res = await fetch(`/api/courses/${courseId}/announcements`); if (res.ok) { const data = await res.json(); setAnnouncements(data.announcements || []); } } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const createAnnouncement = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, content: newContent }) });
      if (res.ok) { setNewTitle(""); setNewContent(""); setShowCreate(false); fetchAnnouncements(); }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  const pinned = announcements.filter(a => a.isPinned);
  const regular = announcements.filter(a => !a.isPinned);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Megaphone className="w-6 h-6" /> Announcements</h1>
        {isInstructor && <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New</button>}
      </div>

      {showCreate && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title..." className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Content..." rows={4} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
          <div className="flex gap-2 justify-end"><button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button><button onClick={createAnnouncement} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Publish</button></div>
        </div>
      )}

      <div className="space-y-4">
        {pinned.map(a => (
          <div key={a.id} className="bg-gray-800 rounded-lg p-6 border border-yellow-700/50">
            <div className="flex items-center gap-2 mb-2"><Pin className="w-4 h-4 text-yellow-400" /><span className="text-xs text-yellow-400">Pinned</span></div>
            <h3 className="text-lg font-semibold text-white mb-2">{a.title}</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{a.content}</p>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500"><Clock className="w-3 h-3" />{new Date(a.createdAt).toLocaleDateString()} • {a.authorName}</div>
          </div>
        ))}
        {regular.map(a => (
          <div key={a.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">{a.title}</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{a.content}</p>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500"><Clock className="w-3 h-3" />{new Date(a.createdAt).toLocaleDateString()} • {a.authorName}</div>
          </div>
        ))}
        {announcements.length === 0 && <div className="text-center py-12 text-gray-400">No announcements yet.</div>}
      </div>
    </div>
  );
}
