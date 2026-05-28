"use client";

import { useState, useEffect } from "react";
import { Trophy, Star, Flame, Medal, TrendingUp, Award, Zap, Crown } from "lucide-react";

interface UserStats { total: number; level: number; streak: number; lastActive: string; nextLevelPoints: number; }
interface Badge { id: string; name: string; description: string; icon: string; earned: boolean; earnedAt?: string; points: number; category: string; }
interface LeaderboardEntry { rank: number; userId: string; name: string; image?: string; points: number; }

export default function GamificationDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState("all_time");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/gamification?period=${period}`);
      if (res.ok) { const data = await res.json(); setStats(data.stats); setBadges(data.badges || []); setLeaderboard(data.leaderboard || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const levelProgress = stats ? ((stats.total % 100) / 100) * 100 : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-500" /> Gamification</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/50">
          <Zap className="w-8 h-8 text-purple-400 mb-2" />
          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
          <p className="text-purple-300 text-sm">Total Points</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-700/50">
          <Star className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-3xl font-bold text-white">Level {stats?.level || 1}</p>
          <div className="mt-2 w-full bg-blue-900/50 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${levelProgress}%` }} /></div>
        </div>
        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-6 border border-orange-700/50">
          <Flame className="w-8 h-8 text-orange-400 mb-2" />
          <p className="text-3xl font-bold text-white">{stats?.streak || 0} days</p>
          <p className="text-orange-300 text-sm">Current Streak</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-xl p-6 border border-yellow-700/50">
          <Medal className="w-8 h-8 text-yellow-400 mb-2" />
          <p className="text-3xl font-bold text-white">{badges.filter(b => b.earned).length}</p>
          <p className="text-yellow-300 text-sm">Badges Earned</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Badges */}
        <div className="col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-5 h-5" /> Badges</h2>
          <div className="grid grid-cols-4 gap-4">
            {badges.map(b => (
              <div key={b.id} className={`bg-gray-800 rounded-lg p-4 text-center border ${b.earned ? "border-yellow-600/50" : "border-gray-700 opacity-50"}`}>
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="text-white text-sm font-medium">{b.name}</p>
                <p className="text-gray-400 text-xs mt-1">{b.description}</p>
                {b.earned && <p className="text-yellow-400 text-xs mt-2">+{b.points} pts</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Crown className="w-5 h-5" /> Leaderboard</h2>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white">
              <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="all_time">All Time</option>
            </select>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
            {leaderboard.map((entry, idx) => (
              <div key={entry.userId} className="flex items-center gap-3 p-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-yellow-600 text-white" : idx === 1 ? "bg-gray-400 text-white" : idx === 2 ? "bg-orange-700 text-white" : "bg-gray-700 text-gray-300"}`}>{entry.rank}</span>
                <div className="flex-1"><p className="text-white text-sm">{entry.name}</p></div>
                <span className="text-yellow-400 text-sm font-medium">{entry.points} pts</span>
              </div>
            ))}
            {leaderboard.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
