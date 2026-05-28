"use client";

import { useState, useRef } from "react";
import { Download, Share2, Award } from "lucide-react";

interface CertificateData { id: string; certificateNo: string; studentName: string; courseName: string; issuedAt: string; expiresAt?: string; pdfUrl?: string; metadata?: Record<string, any>; }

export default function CertificateViewer({ certificate }: { certificate: CertificateData }) {
  const [downloading, setDownloading] = useState(false);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (certificate.pdfUrl) { window.open(certificate.pdfUrl, "_blank"); }
      else {
        const res = await fetch(`/api/courses/${certificate.metadata?.courseId}/certificates?action=download&id=${certificate.id}`);
        if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `certificate-${certificate.certificateNo}.pdf`; a.click(); URL.revokeObjectURL(url); }
      }
    } catch (err) { console.error(err); } finally { setDownloading(false); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verify/${certificate.certificateNo}`;
    if (navigator.share) await navigator.share({ title: "My Certificate", text: `I completed ${certificate.courseName}!`, url });
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-4 border-yellow-600/50 p-12 mb-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-yellow-600/30 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-yellow-600/30 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-yellow-600/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-yellow-600/30 rounded-br-xl" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative text-center">
          <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-sm tracking-[0.3em] text-yellow-500/70 uppercase mb-2">Certificate of Completion</h3>
          <div className="w-24 h-0.5 bg-yellow-600/50 mx-auto mb-6" />
          <p className="text-gray-400 mb-2">This is to certify that</p>
          <h1 className="text-4xl font-bold text-white mb-4 font-serif">{certificate.studentName}</h1>
          <p className="text-gray-400 mb-2">has successfully completed</p>
          <h2 className="text-2xl font-semibold text-yellow-400 mb-6">{certificate.courseName}</h2>
          <div className="w-24 h-0.5 bg-yellow-600/50 mx-auto mb-6" />
          <div className="flex items-center justify-center gap-12 text-sm">
            <div><p className="text-gray-500 text-xs uppercase tracking-wider">Date Issued</p><p className="text-white mt-1">{fmtDate(certificate.issuedAt)}</p></div>
            <div><p className="text-gray-500 text-xs uppercase tracking-wider">Certificate No.</p><p className="text-white mt-1 font-mono">{certificate.certificateNo}</p></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={handleDownload} disabled={downloading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" /> {downloading ? "Downloading..." : "Download PDF"}</button>
        <button onClick={handleShare} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg inline-flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</button>
      </div>
    </div>
  );
}
