'use client';

import React, { useState } from 'react';
import {
  Sparkles, Upload, FileText, Mic, Loader2, CheckCircle2,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Eye
} from 'lucide-react';

interface GeneratedData {
  title?: string;
  openingRemarks?: string;
  closingRemarks?: string;
  agendaItems?: Array<{ title: string; discussion: string; decision?: string; status: string }>;
  motions?: Array<{ title: string; text: string; result: string; isUnanimous: boolean }>;
  actionItems?: Array<{ description: string; assigneeName?: string; priority: string }>;
}

interface MinutesAIGeneratorProps {
  minutesId: string;
  meetingId?: string;
  onGenerated?: (data: GeneratedData) => void;
  onClose?: () => void;
}

export default function MinutesAIGenerator({ minutesId, meetingId, onGenerated, onClose }: MinutesAIGeneratorProps) {
  const [source, setSource] = useState<'transcript' | 'meeting' | 'notes'>('transcript');
  const [transcriptText, setTranscriptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedData | null>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['agendaItems', 'actionItems']));

  const handleGenerate = async () => {
    if (source !== 'meeting' && !transcriptText.trim()) {
      setError('Please provide transcript or notes text');
      return;
    }

    setGenerating(true);
    setError('');
    setGenerated(null);

    try {
      const res = await fetch(`/api/minutes/${minutesId}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText || undefined,
          meetingId: source === 'meeting' ? meetingId : undefined,
          source,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setGenerated(data.generated);
      setConfidence(data.confidence);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (generated) {
      onGenerated?.(generated);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 0.8) return 'text-green-600 bg-green-100';
    if (value >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Minutes Generator</h3>
          <p className="text-sm text-gray-500">Automatically generate meeting minutes from transcript or notes</p>
        </div>
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSource('transcript')}
          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
            source === 'transcript' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText size={24} className={source === 'transcript' ? 'text-purple-600' : 'text-gray-400'} />
          <span className="text-sm font-medium">Paste Transcript</span>
        </button>
        <button
          onClick={() => setSource('meeting')}
          disabled={!meetingId}
          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
            source === 'meeting' ? 'border-purple-500 bg-purple-50' :
            !meetingId ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
            'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Mic size={24} className={source === 'meeting' ? 'text-purple-600' : 'text-gray-400'} />
          <span className="text-sm font-medium">From Meeting</span>
          {!meetingId && <span className="text-xs text-gray-400">No linked meeting</span>}
        </button>
        <button
          onClick={() => setSource('notes')}
          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
            source === 'notes' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Upload size={24} className={source === 'notes' ? 'text-purple-600' : 'text-gray-400'} />
          <span className="text-sm font-medium">Manual Notes</span>
        </button>
      </div>

      {/* Input Area */}
      {source !== 'meeting' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {source === 'transcript' ? 'Meeting Transcript' : 'Meeting Notes'}
          </label>
          <textarea
            value={transcriptText}
            onChange={e => setTranscriptText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[200px] font-mono"
            placeholder={source === 'transcript'
              ? '[Speaker Name]: Discussion content...\n[Another Speaker]: Response...'
              : 'Paste your meeting notes here...'
            }
          />
          <p className="text-xs text-gray-400 mt-1">{transcriptText.length} characters</p>
        </div>
      )}

      {source === 'meeting' && meetingId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="text-blue-800">
            <strong>Meeting transcripts will be automatically fetched</strong> from the linked meeting record.
            The AI will process all captured dialogue and generate structured minutes.
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating Minutes...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Minutes
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Generated Preview */}
      {generated && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm font-medium text-gray-900">Generated Draft</span>
            </div>
            <div className="flex items-center gap-3">
              {confidence?.overall && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(confidence.overall)}`}>
                  {Math.round(confidence.overall * 100)}% confidence
                </span>
              )}
              <button onClick={() => setShowPreview(!showPreview)} className="text-gray-500 hover:text-gray-700">
                <Eye size={16} />
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {generated.title && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Title</span>
                  <p className="text-sm font-medium text-gray-900">{generated.title}</p>
                </div>
              )}

              {generated.openingRemarks && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Opening Remarks</span>
                  <p className="text-sm text-gray-700">{generated.openingRemarks}</p>
                </div>
              )}

              {/* Agenda Items */}
              {generated.agendaItems && generated.agendaItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('agendaItems')}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Agenda Items ({generated.agendaItems.length})
                    </span>
                    {confidence?.agendaItems && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getConfidenceColor(confidence.agendaItems)}`}>
                        {Math.round(confidence.agendaItems * 100)}%
                      </span>
                    )}
                    {expandedSections.has('agendaItems') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {expandedSections.has('agendaItems') && (
                    <div className="mt-2 space-y-2">
                      {generated.agendaItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">{idx + 1}. {item.title}</div>
                          {item.discussion && <p className="text-xs text-gray-600 mt-1">{item.discussion}</p>}
                          {item.decision && <p className="text-xs text-blue-700 mt-1 font-medium">Decision: {item.decision}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Items */}
              {generated.actionItems && generated.actionItems.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('actionItems')}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Action Items ({generated.actionItems.length})
                    </span>
                    {confidence?.actionItems && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getConfidenceColor(confidence.actionItems)}`}>
                        {Math.round(confidence.actionItems * 100)}%
                      </span>
                    )}
                    {expandedSections.has('actionItems') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {expandedSections.has('actionItems') && (
                    <div className="mt-2 space-y-2">
                      {generated.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{idx + 1}</span>
                          <div>
                            <p className="text-sm text-gray-900">{item.description}</p>
                            <div className="flex gap-3 mt-1">
                              {item.assigneeName && <span className="text-xs text-gray-500">→ {item.assigneeName}</span>}
                              <span className={`text-xs font-medium ${
                                item.priority === 'high' ? 'text-red-600' : item.priority === 'low' ? 'text-green-600' : 'text-yellow-600'
                              }`}>{item.priority}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {generated.closingRemarks && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Closing Remarks</span>
                  <p className="text-sm text-gray-700">{generated.closingRemarks}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-800"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
            <div className="flex gap-2">
              {onClose && (
                <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              )}
              <button
                onClick={handleApply}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Apply to Minutes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
