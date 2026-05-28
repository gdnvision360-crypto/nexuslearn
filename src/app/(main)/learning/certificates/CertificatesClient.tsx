"use client";

import { useState, useEffect } from "react";
import { Award } from "lucide-react";
import CertificateViewer from "@/components/learning/CertificateViewer";

interface Cert { id: string; certificateNo: string; studentName: string; courseName: string; issuedAt: string; expiresAt?: string; pdfUrl?: string; metadata?: Record<string, any>; }

export default function CertificatesClient() {
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [selected, setSelected] = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses/all/certificates").then(r => r.json()).then(data => { setCertificates(data.certificates || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (selected) return <div><button onClick={() => setSelected(null)} className="text-blue-400 hover:text-blue-300 mb-4 ml-6 mt-6">← Back</button><CertificateViewer certificate={selected} /></div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Award className="w-6 h-6 text-yellow-500" /> My Certificates</h1>
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : certificates.length === 0 ? (
        <div className="text-center py-12"><Award className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No certificates yet. Complete courses to earn certificates!</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {certificates.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-600/50 cursor-pointer">
              <Award className="w-10 h-10 text-yellow-500 mb-3" />
              <h3 className="text-white font-semibold">{c.courseName}</h3>
              <p className="text-gray-400 text-sm mt-1">Issued: {new Date(c.issuedAt).toLocaleDateString()}</p>
              <p className="text-gray-500 text-xs mt-1 font-mono">{c.certificateNo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
