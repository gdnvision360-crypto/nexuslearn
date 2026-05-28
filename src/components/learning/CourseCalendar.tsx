"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Download } from "lucide-react";

interface CalendarEvent { id: string; title: string; date: string; time?: string; type: "assignment" | "quiz" | "class" | "personal"; courseId?: string; courseName?: string; color?: string; }

const EVENT_COLORS: Record<string, string> = { assignment: "bg-blue-600", quiz: "bg-purple-600", class: "bg-green-600", personal: "bg-orange-600" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CourseCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/courses/calendar?year=${year}&month=${month}`);
      if (res.ok) { const data = await res.json(); setEvents(data.events || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const navigate = (dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date.startsWith(dateStr));
  };

  const exportIcal = () => {
    let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NexusLearn//EN\n";
    events.forEach(e => {
      const d = e.date.replace(/[-:]/g, "").split("T")[0];
      ical += `BEGIN:VEVENT\nDTSTART:${d}\nSUMMARY:${e.title}\nEND:VEVENT\n`;
    });
    ical += "END:VCALENDAR";
    const blob = new Blob([ical], { type: "text/calendar" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "calendar.ics"; a.click();
  };

  const today = new Date(); const isToday = (day: number) => today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === day;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar className="w-6 h-6" /> Calendar</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-white font-medium">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => navigate(1)} className="p-1 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(["month", "week", "agenda"] as const).map(v => (<button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded text-sm ${view === v ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>))}
          </div>
          <button onClick={exportIcal} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"><Download className="w-4 h-4" /></button>
        </div>
      </div>

      {view === "month" && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7">
            {DAYS.map(d => <div key={d} className="p-2 text-center text-xs text-gray-400 font-medium border-b border-gray-700">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((day, idx) => (
              <div key={idx} className={`min-h-[100px] p-2 border-b border-r border-gray-700/50 ${day ? "" : "bg-gray-900/30"}`}>
                {day && (
                  <>
                    <span className={`text-sm ${isToday(day) ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-gray-400"}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {getEventsForDay(day).slice(0, 3).map(e => (
                        <div key={e.id} className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${EVENT_COLORS[e.type] || "bg-gray-600"}`}>{e.title}</div>
                      ))}
                      {getEventsForDay(day).length > 3 && <span className="text-xs text-gray-500">+{getEventsForDay(day).length - 3} more</span>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "agenda" && (
        <div className="space-y-3">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map(e => (
            <div key={e.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${EVENT_COLORS[e.type] || "bg-gray-600"}`} />
              <div className="flex-1"><p className="text-white">{e.title}</p>{e.courseName && <p className="text-xs text-gray-500">{e.courseName}</p>}</div>
              <span className="text-sm text-gray-400">{new Date(e.date).toLocaleDateString()}</span>
            </div>
          ))}
          {events.length === 0 && <div className="text-center py-12 text-gray-400">No upcoming events.</div>}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-gray-400"><div className={`w-2 h-2 rounded-full ${color}`} />{type}</div>
        ))}
      </div>
    </div>
  );
}
