"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, CheckCircle, Eye, MessageSquare, Pin, Plus, Search, Send, ThumbsUp } from 'lucide-react';

interface Forum { id: string; title: string; description?: string; threadCount?: number; isLocked: boolean; }
interface Thread { id: string; title: string; content: string; authorName: string; authorImage?: string; isPinned: boolean; isResolved: boolean; views: number; postCount: number; createdAt: string; }
interface Post { id: string; content: string; authorName: string; authorImage?: string; isAnswer: boolean; likes: number; createdAt: string; }

export default function DiscussionForum({ courseId }: { courseId: string }) {
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchForums(); }, [courseId]);

  const fetchForums = async () => {
    try { const res = await fetch(`/api/courses/${courseId}/forums`); if (res.ok) { const data = await res.json(); setForums(data.forums || []); } } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchThreads = async (forumId: string) => {
    try { const res = await fetch(`/api/courses/${courseId}/forums/${forumId}?sort=${sortBy}&search=${search}`); if (res.ok) { const data = await res.json(); setThreads(data.threads || []); } } catch (err) { console.error(err); }
  };

  const fetchPosts = async (threadId: string) => {
    try { const res = await fetch(`/api/courses/${courseId}/forums/${selectedForum?.id}?threadId=${threadId}`); if (res.ok) { const data = await res.json(); setPosts(data.posts || []); } } catch (err) { console.error(err); }
  };

  const openForum = (forum: Forum) => { setSelectedForum(forum); setSelectedThread(null); fetchThreads(forum.id); };
  const openThread = (thread: Thread) => { setSelectedThread(thread); fetchPosts(thread.id); };

  const createThread = async () => {
    if (!selectedForum || !newThreadTitle.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/forums/${selectedForum.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newThreadTitle, content: newThreadContent }) });
      if (res.ok) { setNewThreadTitle(""); setNewThreadContent(""); setShowNewThread(false); fetchThreads(selectedForum.id); }
    } catch (err) { console.error(err); }
  };

  const createPost = async () => {
    if (!selectedThread || !newPostContent.trim()) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/forums/${selectedForum?.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId: selectedThread.id, content: newPostContent }) });
      if (res.ok) { setNewPostContent(""); fetchPosts(selectedThread.id); }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  // Thread view
  if (selectedThread) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setSelectedThread(null)} className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to threads</button>
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {selectedThread.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
            {selectedThread.isResolved && <CheckCircle className="w-4 h-4 text-green-400" />}
            <h1 className="text-xl font-bold text-white">{selectedThread.title}</h1>
          </div>
          <p className="text-gray-300 mb-3">{selectedThread.content}</p>
          <p className="text-xs text-gray-500">{selectedThread.authorName} • {new Date(selectedThread.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="space-y-4 mb-6">
          {posts.map(p => (
            <div key={p.id} className={`bg-gray-800 rounded-lg p-4 border ${p.isAnswer ? "border-green-700" : "border-gray-700"}`}>
              {p.isAnswer && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded mb-2 inline-block"><Check className="w-3 h-3 inline" /> Accepted Answer</span>}
              <p className="text-gray-300">{p.content}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">{p.authorName} • {new Date(p.createdAt).toLocaleDateString()}</p>
                <button className="text-gray-500 hover:text-blue-400 inline-flex items-center gap-1 text-xs"><ThumbsUp className="w-3 h-3" /> {p.likes}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Write a reply..." rows={3} className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none" />
          <button onClick={createPost} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg self-end"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  // Thread list
  if (selectedForum) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={() => setSelectedForum(null)} className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to forums</button>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">{selectedForum.title}</h1>
          <button onClick={() => setShowNewThread(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New Thread</button>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => { setSearch(e.target.value); fetchThreads(selectedForum.id); }} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" placeholder="Search threads..." /></div>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); fetchThreads(selectedForum.id); }} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"><option value="recent">Recent</option><option value="popular">Popular</option><option value="unanswered">Unanswered</option></select>
        </div>
        {showNewThread && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
            <input value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} placeholder="Thread title..." className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
            <textarea value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)} placeholder="Content..." rows={4} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
            <div className="flex gap-2 justify-end"><button onClick={() => setShowNewThread(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button><button onClick={createThread} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Post</button></div>
          </div>
        )}
        <div className="space-y-3">
          {threads.map(t => (
            <div key={t.id} onClick={() => openThread(t)} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer">
              <div className="flex items-start gap-2">
                {t.isPinned && <Pin className="w-4 h-4 text-yellow-400 mt-1" />}
                {t.isResolved && <CheckCircle className="w-4 h-4 text-green-400 mt-1" />}
                <div className="flex-1">
                  <h3 className="text-white font-medium">{t.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-1">{t.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{t.authorName}</span><span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {t.postCount}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {t.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {threads.length === 0 && <div className="text-center py-8 text-gray-400">No threads yet. Start a discussion!</div>}
        </div>
      </div>
    );
  }

  // Forum list
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><MessageSquare className="w-6 h-6" /> Discussion Forums</h1>
      <div className="space-y-3">
        {forums.map(f => (
          <div key={f.id} onClick={() => openForum(f)} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer">
            <h3 className="text-white font-medium">{f.title}</h3>
            {f.description && <p className="text-gray-400 text-sm mt-1">{f.description}</p>}
            <p className="text-xs text-gray-500 mt-2">{f.threadCount || 0} threads</p>
          </div>
        ))}
        {forums.length === 0 && <div className="text-center py-12 text-gray-400">No forums available.</div>}
      </div>
    </div>
  );
}
