"use client";

import { useState } from "react";
import {
  Sparkles,
  FileText,
  Languages,
  Mic,
  Brain,
  Wand2,
  MessageSquare,
  Image,
  Loader2,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool =
  | "summarize"
  | "translate"
  | "transcribe"
  | "generate"
  | "chat"
  | "image";

const tools: { key: Tool; label: string; desc: string; icon: any; color: string }[] = [
  { key: "summarize", label: "Summarize", desc: "Condense documents, meetings, or text", icon: FileText, color: "from-blue-500 to-cyan-500" },
  { key: "translate", label: "Translate", desc: "Translate content into 20+ languages", icon: Languages, color: "from-green-500 to-emerald-500" },
  { key: "transcribe", label: "Transcribe", desc: "Convert audio/video to text", icon: Mic, color: "from-orange-500 to-red-500" },
  { key: "generate", label: "Generate Content", desc: "Create quizzes, outlines, lesson plans", icon: Wand2, color: "from-purple-500 to-pink-500" },
  { key: "chat", label: "AI Assistant", desc: "Ask questions about your workspace", icon: MessageSquare, color: "from-indigo-500 to-violet-500" },
  { key: "image", label: "Image Analysis", desc: "Describe, analyze, or extract text from images", icon: Image, color: "from-yellow-500 to-orange-500" },
];

const languages = [
  "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean",
  "Arabic", "Hindi", "Portuguese", "Russian", "Italian", "Dutch", "Turkish",
  "Vietnamese", "Thai", "Swedish", "Polish", "Ukrainian", "Indonesian",
];

export default function AIStudioPage() {
  const [activeTool, setActiveTool] = useState<Tool>("summarize");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [generateType, setGenerateType] = useState("quiz");

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    const results: Record<Tool, string> = {
      summarize: `## Summary\n\nThe provided content discusses the following key points:\n\n1. **Main Topic**: ${input.slice(0, 50)}...\n2. **Key Findings**: The text highlights several important aspects related to the subject matter.\n3. **Conclusion**: The overall takeaway emphasizes the significance of the discussed themes.\n\n**Word count**: Original ${input.split(" ").length} words → Summary 45 words (${Math.round((45 / Math.max(input.split(" ").length, 1)) * 100)}% reduction)`,
      translate: `## Translation (${targetLang})\n\n[Translated content would appear here using DeepL/Google Translate API]\n\nOriginal language: Auto-detected (English)\nTarget language: ${targetLang}\nConfidence: 98.2%`,
      transcribe: `## Transcription\n\n[00:00] Speaker 1: Welcome everyone to today's session.\n[00:05] Speaker 2: Thank you for having me.\n[00:12] Speaker 1: Let's dive right in...\n\n**Duration**: 2:34\n**Speakers detected**: 2\n**Accuracy**: 96.8%\n**Language**: English`,
      generate: `## Generated ${generateType === "quiz" ? "Quiz" : generateType === "outline" ? "Outline" : "Lesson Plan"}\n\nBased on the provided content:\n\n${generateType === "quiz" ? "**Q1.** What is the main concept discussed?\n  a) Option A\n  b) Option B ✅\n  c) Option C\n  d) Option D\n\n**Q2.** Which factor is most important?\n  a) Factor 1 ✅\n  b) Factor 2\n  c) Factor 3" : generateType === "outline" ? "1. **Introduction**\n   1.1 Background\n   1.2 Objectives\n2. **Main Content**\n   2.1 Key Concepts\n   2.2 Applications\n3. **Assessment**\n4. **Summary & Next Steps**" : "**Objective**: Students will understand the core concepts.\n**Duration**: 45 minutes\n**Materials**: Slides, handouts\n\n- Warm-up (5 min)\n- Lecture (15 min)\n- Activity (15 min)\n- Discussion (10 min)"}`,
      chat: `Based on your question: "${input.slice(0, 80)}"\n\nHere's what I found in your workspace:\n\n• **3 related documents** in the Docs section\n• **2 course modules** covering this topic\n• **5 chat messages** from team discussions\n\nThe most relevant information suggests that this topic was extensively discussed in the "Project Planning" channel last week. Dr. Sarah Chen shared detailed notes in the "Research Methods" document.\n\nWould you like me to pull up specific documents or messages?`,
      image: `## Image Analysis\n\nUpload an image to analyze. Supported features:\n\n- **OCR**: Extract text from images, screenshots, whiteboards\n- **Description**: Get detailed descriptions of visual content\n- **Diagram Analysis**: Interpret charts, graphs, and diagrams\n- **Math/Code**: Extract equations or code from images`,
    };

    setOutput(results[activeTool]);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTool = tools.find((t) => t.key === activeTool)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          <Sparkles className="mb-1 mr-2 inline h-6 w-6 text-indigo-500" />
          AI Studio
        </h1>
        <p className="text-sm text-gray-500">
          AI-powered tools for content creation, analysis, and automation
        </p>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tools.map((tool) => (
          <button
            key={tool.key}
            onClick={() => {
              setActiveTool(tool.key);
              setOutput("");
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
              activeTool === tool.key
                ? "border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-500/10"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                tool.color
              )}
            >
              <tool.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <currentTool.icon className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentTool.label}
              </h3>
            </div>
            <span className="text-xs text-gray-400">{currentTool.desc}</span>
          </div>

          <div className="flex flex-1 flex-col p-4">
            {/* Tool-specific options */}
            {activeTool === "translate" && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Target Language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {languages.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTool === "generate" && (
              <div className="mb-3 flex gap-2">
                {["quiz", "outline", "lesson-plan"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setGenerateType(t)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      generateType === t
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    )}
                  >
                    {t === "quiz"
                      ? "Quiz"
                      : t === "outline"
                      ? "Outline"
                      : "Lesson Plan"}
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeTool === "chat"
                  ? "Ask a question about your workspace..."
                  : activeTool === "transcribe"
                  ? "Paste audio/video URL or upload a file..."
                  : "Paste or type your content here..."
              }
              className="flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            <button
              onClick={handleRun}
              disabled={loading || !input.trim()}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Run {currentTool.label}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Output
            </h3>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-1 p-4">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                  <Brain className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                </div>
                <p className="text-sm">AI is thinking...</p>
              </div>
            ) : output ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {output}
                </pre>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                <Sparkles className="h-10 w-10 text-gray-300" />
                <p className="text-sm">Output will appear here</p>
                <p className="text-xs">
                  Enter content and click Run to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
