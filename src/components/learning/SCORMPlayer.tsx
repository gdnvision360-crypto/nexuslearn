"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Maximize, X } from "lucide-react";

interface SCORMData { completion_status: string; score: number; time_spent: number; location: string; suspend_data: string; }

export default function SCORMPlayer({ contentUrl, lessonId, onComplete }: { contentUrl: string; lessonId: string; onComplete?: (data: SCORMData) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scormData, setScormData] = useState<SCORMData>({ completion_status: "not attempted", score: 0, time_spent: 0, location: "", suspend_data: "" });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SCORM 1.2 API
    const api: any = {
      LMSInitialize: () => { setLoading(false); return "true"; },
      LMSFinish: () => { if (scormData.completion_status === "completed") onComplete?.(scormData); return "true"; },
      LMSGetValue: (key: string) => {
        const map: Record<string, string> = { "cmi.core.lesson_status": scormData.completion_status, "cmi.core.score.raw": String(scormData.score), "cmi.core.lesson_location": scormData.location, "cmi.suspend_data": scormData.suspend_data };
        return map[key] || "";
      },
      LMSSetValue: (key: string, value: string) => {
        setScormData(prev => {
          const updated = { ...prev };
          if (key === "cmi.core.lesson_status") updated.completion_status = value;
          if (key === "cmi.core.score.raw") updated.score = parseFloat(value);
          if (key === "cmi.core.lesson_location") updated.location = value;
          if (key === "cmi.suspend_data") updated.suspend_data = value;
          return updated;
        });
        return "true";
      },
      LMSCommit: () => "true",
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "",
      LMSGetDiagnostic: () => "",
    };
    (window as any).API = api;
    return () => { delete (window as any).API; };
  }, [scormData]);

  const toggleFullscreen = () => {
    if (!isFullscreen) iframeRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded text-xs ${scormData.completion_status === "completed" ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-400"}`}>{scormData.completion_status}</span>
          {scormData.score > 0 && <span className="text-sm text-gray-400">Score: {scormData.score}%</span>}
        </div>
        <button onClick={toggleFullscreen} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"><Maximize className="w-4 h-4" /></button>
      </div>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700" style={{ height: "70vh" }}>
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}
        <iframe ref={iframeRef} src={contentUrl} className="w-full h-full" onLoad={() => setLoading(false)} sandbox="allow-scripts allow-same-origin allow-forms" />
      </div>
    </div>
  );
}
