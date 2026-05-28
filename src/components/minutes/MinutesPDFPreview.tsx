'use client';

import React, { useState, useRef } from 'react';
import {
  FileText, Download, Printer, Mail, Eye, Loader2,
  FileCheck, Stamp, ChevronDown
} from 'lucide-react';

interface MinutesPDFPreviewProps {
  minutesId: string;
  minutesStatus: string;
  title: string;
}

const TEMPLATES = [
  { id: 'formal', name: 'Formal Minutes', description: 'Standard formal layout' },
  { id: 'board', name: 'Board Minutes', description: 'Board meeting specific' },
  { id: 'agm', name: 'AGM Minutes', description: 'Annual General Meeting' },
  { id: 'committee', name: 'Committee Minutes', description: 'Committee meeting' },
];

export default function MinutesPDFPreview({ minutesId, minutesStatus, title }: MinutesPDFPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('formal');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/minutes/${minutesId}/export-pdf?template=${selectedTemplate}`);
      if (!res.ok) throw new Error('Failed to load preview');
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err) {
      console.error('Error loading preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/minutes/${minutesId}/export-pdf?template=${selectedTemplate}`);
      if (!res.ok) throw new Error('Failed to generate');
      const html = await res.text();

      // Download as HTML file (client can convert to PDF via print)
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_minutes.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">PDF Preview & Export</h3>
        </div>
        {minutesStatus === 'draft' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            <Stamp size={12} /> DRAFT WATERMARK
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <FileCheck size={16} />
            {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
            <ChevronDown size={14} />
          </button>
          {showTemplateDropdown && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => { setSelectedTemplate(template.id); setShowTemplateDropdown(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    selectedTemplate === template.id ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={loadPreview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          Preview
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          <Download size={16} /> Download HTML
        </button>
        <button
          onClick={handlePrint}
          disabled={!previewHtml}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          <Mail size={16} /> Email Distribution
        </button>
      </div>

      {/* Preview Frame */}
      {previewHtml && (
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-inner bg-white" style={{ height: '600px' }}>
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full h-full"
            title="Minutes Preview"
            sandbox="allow-same-origin"
          />
        </div>
      )}

      {!previewHtml && !loading && (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <FileText size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Click &quot;Preview&quot; to see the formatted minutes</p>
        </div>
      )}
    </div>
  );
}
