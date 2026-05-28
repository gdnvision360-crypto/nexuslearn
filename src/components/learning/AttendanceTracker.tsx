"use client";

import { useState, useEffect } from "react";
import { Calendar, Download, CheckCircle, XCircle, Clock, AlertCircle, Users } from "lucide-react";

interface Student { userId: string; name: string; image?: string; }
interface AttendanceRecord { userId: string; status: string; notes?: string; }
interface AttendanceDay { date: string; records: Record<string, AttendanceRecord>; }

const STATUS_OPTIONS = [
  { value: "present", label: "Present", icon: CheckCircle, color: "text-green-400" },
  { value: "absent", label: "Absent", icon: XCircle, color: "text-red-400" },
  { value: "late", label: "Late", icon: Clock, color: "text-yellow-400" },
  { value: "excused", label: "Excused", icon: AlertCircle, color: "text-blue-400" },
];

export default function AttendanceTracker({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, AttendanceRecord>>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAttendance(); }, [courseId]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance`);
      if (res.ok) { const data = await res.json(); setStudents(data.students || []); setDates(data.dates || []); setAttendance(data.attendance || {}); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const markAttendance = async (userId: string, status: string) => {
    try {
      await fetch(`/api/courses/${courseId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, date: selectedDate, status }) });
      setAttendance(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), [userId]: { userId, status } } }));
    } catch (err) { console.error(err); }
  };

  const getAttendanceRate = (userId: string) => {
    let present = 0, total = 0;
    dates.forEach(d => { const r = attendance[d]?.[userId]; if (r) { total++; if (r.status === "present" || r.status === "late") present++; } });
    return total > 0 ? ((present / total) * 100).toFixed(0) : "—";
  };

  const exportReport = () => {
    const headers = ["Student", ...dates, "Attendance %"];
    const rows = students.map(s => [s.name, ...dates.map(d => attendance[d]?.[s.userId]?.status || "—"), getAttendanceRate(s.userId) + "%"]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "attendance.csv"; a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  const todayRecords = attendance[selectedDate] || {};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6" /> Attendance</h1>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
          <button onClick={exportReport} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-gray-700 text-sm text-gray-400 font-medium">
          <div>Student</div><div>Status</div><div>Rate</div>
        </div>
        {students.map(student => {
          const record = todayRecords[student.userId];
          const currentStatus = record?.status || "";
          return (
            <div key={student.userId} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-gray-700/50 items-center">
              <div className="text-white">{student.name}</div>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.value} onClick={() => markAttendance(student.userId, opt.value)} title={opt.label}
                      className={`p-2 rounded-lg border ${currentStatus === opt.value ? `${opt.color} border-current bg-current/10` : "border-gray-600 text-gray-500 hover:text-gray-300"}`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <div className="text-right"><span className={`text-sm font-medium ${parseInt(getAttendanceRate(student.userId)) >= 80 ? "text-green-400" : parseInt(getAttendanceRate(student.userId)) >= 60 ? "text-yellow-400" : "text-red-400"}`}>{getAttendanceRate(student.userId)}%</span></div>
            </div>
          );
        })}
        {students.length === 0 && <div className="p-8 text-center text-gray-400">No students enrolled.</div>}
      </div>
    </div>
  );
}
