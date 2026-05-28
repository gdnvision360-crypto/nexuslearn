"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  Play,
  Clock,
  Film,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Star,
  Video,
  Megaphone,
  GraduationCap,
  Award,
  MessageSquareQuote,
  Timer,
  MonitorPlay,
  Smartphone,
  Square,
} from "lucide-react";

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  aspectRatio: string;
  thumbnail: string;
  popular?: boolean;
}

const TEMPLATES: VideoTemplate[] = [
  {
    id: "course-intro-professional",
    name: "Professional Course Intro",
    description: "Clean, professional intro with logo, course title, and instructor name",
    category: "course-intro",
    duration: 8,
    aspectRatio: "16:9",
    thumbnail: "/templates/course-intro-pro.jpg",
    popular: true,
  },
  {
    id: "course-outro-cta",
    name: "Course Outro with CTA",
    description: "End screen with call-to-action, social links, and next course",
    category: "course-outro",
    duration: 10,
    aspectRatio: "16:9",
    thumbnail: "/templates/course-outro-cta.jpg",
  },
  {
    id: "announcement-bold",
    name: "Bold Announcement",
    description: "Eye-catching video for events, updates, or launches",
    category: "announcement",
    duration: 12,
    aspectRatio: "16:9",
    thumbnail: "/templates/announcement-bold.jpg",
    popular: true,
  },
  {
    id: "social-promo-reel",
    name: "Social Media Reel",
    description: "Vertical video for Instagram Reels, TikTok, YouTube Shorts",
    category: "social",
    duration: 15,
    aspectRatio: "9:16",
    thumbnail: "/templates/social-reel.jpg",
    popular: true,
  },
  {
    id: "tutorial-step-by-step",
    name: "Step-by-Step Tutorial",
    description: "Numbered steps with screen recording zones and narration areas",
    category: "tutorial",
    duration: 30,
    aspectRatio: "16:9",
    thumbnail: "/templates/tutorial-steps.jpg",
  },
  {
    id: "certificate-animation",
    name: "Certificate Celebration",
    description: "Animated certificate reveal with confetti and student name",
    category: "certificate",
    duration: 8,
    aspectRatio: "16:9",
    thumbnail: "/templates/certificate-anim.jpg",
  },
  {
    id: "testimonial-quote",
    name: "Testimonial / Quote",
    description: "Student testimonial with photo, quote, and star rating",
    category: "testimonial",
    duration: 10,
    aspectRatio: "16:9",
    thumbnail: "/templates/testimonial.jpg",
  },
  {
    id: "countdown-event",
    name: "Event Countdown",
    description: "Animated countdown for upcoming events, webinars, or launches",
    category: "countdown",
    duration: 15,
    aspectRatio: "16:9",
    thumbnail: "/templates/countdown.jpg",
  },
  {
    id: "lower-third-speaker",
    name: "Speaker Lower Third",
    description: "Animated lower-third overlay for speaker identification",
    category: "lower-third",
    duration: 5,
    aspectRatio: "16:9",
    thumbnail: "/templates/lower-third.jpg",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Templates", icon: LayoutTemplate },
  { id: "course-intro", label: "Course Intros", icon: Play },
  { id: "course-outro", label: "Course Outros", icon: Film },
  { id: "announcement", label: "Announcements", icon: Megaphone },
  { id: "social", label: "Social Media", icon: Smartphone },
  { id: "tutorial", label: "Tutorials", icon: GraduationCap },
  { id: "certificate", label: "Certificates", icon: Award },
  { id: "testimonial", label: "Testimonials", icon: MessageSquareQuote },
  { id: "countdown", label: "Countdowns", icon: Timer },
  { id: "lower-third", label: "Lower Thirds", icon: MonitorPlay },
];

export function VideoTemplatesPanel() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularTemplates = TEMPLATES.filter((t) => t.popular);

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Categories sidebar */}
        <div className="w-48 flex-shrink-0 hidden lg:block space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                selectedCategory === cat.id
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1">
          {/* Popular section */}
          {selectedCategory === "all" && !searchQuery && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Popular Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {popularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={setSelectedTemplate}
                    selected={selectedTemplate?.id === template.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All templates */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {selectedCategory === "all" ? "All Templates" : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            {` (${filteredTemplates.length})`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={setSelectedTemplate}
                selected={selectedTemplate?.id === template.id}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No templates found</p>
            </div>
          )}
        </div>
      </div>

      {/* Template customization modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-12 h-12 text-purple-400" />
              </div>

              {/* Template info */}
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedTemplate.duration}s
                </span>
                <span className="flex items-center gap-1">
                  <Square className="w-4 h-4" />
                  {selectedTemplate.aspectRatio}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {selectedTemplate.category}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Navigate to editor with template
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Use Template
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
  selected,
}: {
  template: VideoTemplate;
  onSelect: (t: VideoTemplate) => void;
  selected: boolean;
}) {
  return (
    <div
      onClick={() => onSelect(template)}
      className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all ${
        selected ? "border-purple-500 shadow-lg" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative">
        <Video className="w-8 h-8 text-purple-400" />
        {template.popular && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3" />
            Popular
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {template.duration}s
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {template.aspectRatio}
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
        <button className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-2 font-medium">
          Use this template
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
