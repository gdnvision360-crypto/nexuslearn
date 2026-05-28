'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Users, UserCheck, Briefcase, Zap, FileText,
  ArrowRight, Loader2, Star, Plus
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  meetingType: string;
  icon: string;
  color: string;
  sections: string[];
  defaultAgendaItems: Array<{ title: string; description: string }>;
  quorumRequired: boolean;
}

interface MinutesTemplatesProps {
  onSelect: (templateId: string) => void;
  onClose?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Users, UserCheck, Briefcase, Zap, FileText,
};

export default function MinutesTemplates({ onSelect, onClose }: MinutesTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/minutes/templates');
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
        <p className="text-gray-500 mt-1">Select a meeting type to get started with pre-built structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const IconComponent = ICON_MAP[template.icon] || FileText;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="text-left p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${template.color}15` }}>
                  <IconComponent size={24} style={{ color: template.color }} />
                </div>
                <ArrowRight
                  size={18}
                  className={`text-gray-300 group-hover:text-blue-500 transition-all ${
                    hoveredId === template.id ? 'translate-x-1' : ''
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.sections.slice(0, 4).map(section => (
                  <span key={section} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                    {section.replace('_', ' ')}
                  </span>
                ))}
                {template.sections.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    +{template.sections.length - 4} more
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {template.defaultAgendaItems.length} agenda items • {template.quorumRequired ? 'Quorum tracking' : 'No quorum'}
              </div>
            </button>
          );
        })}

        {/* Blank Template */}
        <button
          onClick={() => onSelect('general')}
          className="text-left p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Plus size={24} className="text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Blank Minutes</h3>
          <p className="text-sm text-gray-500">Start from scratch with an empty template</p>
        </button>
      </div>

      {onClose && (
        <div className="text-center">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      )}
    </div>
  );
}
