"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, Send, ToggleLeft
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
  explanation?: string;
  correctAnswer?: any;
}

interface QuizData {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  questions: Question[];
}

interface AttemptResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  answers: { questionId: string; correct: boolean; correctAnswer: any; explanation?: string }[];
}

export default function QuizEngine({ quizId, courseId }: { quizId: string; courseId?: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  useEffect(() => { fetchQuiz(); }, [quizId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev !== null && prev <= 1) { handleSubmit(); return 0; }
        return prev ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setAttemptsUsed(data.attemptsUsed || 0);
        if (data.quiz.timeLimit) setTimeRemaining(data.quiz.timeLimit * 60);
      }
    } catch (err) { console.error("Failed to fetch quiz:", err); }
    finally { setLoading(false); }
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz) return;
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
          timeSpent: quiz.timeLimit ? (quiz.timeLimit * 60 - (timeRemaining || 0)) : 0,
        }),
      });
      if (res.ok) { const data = await res.json(); setResult(data); setIsSubmitted(true); }
    } catch (err) { console.error("Failed to submit:", err); }
  }, [quiz, answers, timeRemaining, quizId, courseId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  if (!quiz) return <div className="text-center text-gray-400 py-12">Quiz not found</div>;

  if (isSubmitted && result && quiz.showResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className={`rounded-xl p-8 mb-8 text-center ${result.passed ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}>
          {result.passed ? <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
          <h2 className="text-2xl font-bold text-white mb-2">{result.passed ? "Congratulations! You Passed!" : "Not Quite There Yet"}</h2>
          <p className="text-3xl font-bold text-white mb-2">{result.score.toFixed(1)}%</p>
          <p className="text-gray-400">Passing score: {quiz.passingScore}% • {result.answers.filter((a) => a.correct).length}/{quiz.questions.length} correct</p>
        </div>
        <div className="space-y-4">
          {quiz.questions.map((q, idx) => {
            const ar = result.answers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className={`bg-gray-800 rounded-lg p-6 border ${ar?.correct ? "border-green-700" : "border-red-700"}`}>
                <div className="flex items-start gap-3">
                  {ar?.correct ? <CheckCircle className="w-5 h-5 text-green-400 mt-1" /> : <XCircle className="w-5 h-5 text-red-400 mt-1" />}
                  <div>
                    <p className="text-white font-medium">Q{idx + 1}. {q.question}</p>
                    <p className="text-sm text-gray-400 mt-1">Your answer: {JSON.stringify(answers[q.id] || "No answer")}</p>
                    {!ar?.correct && ar?.correctAnswer && <p className="text-sm text-green-400 mt-1">Correct: {JSON.stringify(ar.correctAnswer)}</p>}
                    {ar?.explanation && <p className="text-sm text-blue-400 mt-2 italic">{ar.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!result.passed && attemptsUsed < quiz.attempts && (
          <div className="mt-6 text-center">
            <button onClick={() => { setIsSubmitted(false); setResult(null); setAnswers({}); setCurrentQuestion(0); if (quiz.timeLimit) setTimeRemaining(quiz.timeLimit * 60); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Retry ({quiz.attempts - attemptsUsed} left)
            </button>
          </div>
        )}
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  return (
    <div className="max-w-6xl mx-auto p-6 flex gap-6">
      <div className="w-64 shrink-0">
        <div className="bg-gray-800 rounded-lg p-4 sticky top-6">
          <h3 className="text-white font-semibold mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((q, idx) => (
              <button key={q.id} onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center ${idx === currentQuestion ? "bg-blue-600 text-white" : answers[q.id] !== undefined ? "bg-green-700 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"} ${markedForReview.has(q.id) ? "ring-2 ring-yellow-400" : ""}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-700" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-700" /> Unanswered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded ring-2 ring-yellow-400" /> Review</div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">{quiz.title}</h1>
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 60 ? "bg-red-900/50 text-red-400 animate-pulse" : "bg-gray-800 text-white"}`}>
              <Clock className="w-4 h-4" />{formatTime(timeRemaining)}
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{question.points} pts</span>
              <button onClick={() => toggleReview(question.id)} className={`p-1.5 rounded ${markedForReview.has(question.id) ? "text-yellow-400 bg-yellow-900/30" : "text-gray-500 hover:text-yellow-400"}`}><Flag className="w-4 h-4" /></button>
            </div>
          </div>
          <p className="text-white text-lg mb-6">{question.question}</p>
          {question.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleAnswer(question.id, opt)} className={`w-full text-left p-4 rounded-lg border ${answers[question.id] === opt ? "border-blue-500 bg-blue-900/30 text-white" : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"}`}>
                  <span className="font-medium mr-3">{String.fromCharCode(65 + idx)}.</span> {opt}
                </button>
              ))}
            </div>
          )}
          {question.type === "TRUE_FALSE" && (
            <div className="flex gap-4">
              {["True", "False"].map((opt) => (
                <button key={opt} onClick={() => handleAnswer(question.id, opt)} className={`flex-1 p-4 rounded-lg border text-center ${answers[question.id] === opt ? "border-blue-500 bg-blue-900/30 text-white" : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"}`}>
                  <ToggleLeft className="w-6 h-6 mx-auto mb-2" />{opt}
                </button>
              ))}
            </div>
          )}
          {(question.type === "SHORT_ANSWER" || question.type === "FILL_BLANK") && (
            <input type="text" value={answers[question.id] || ""} onChange={(e) => handleAnswer(question.id, e.target.value)} placeholder="Type your answer..." className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500" />
          )}
          {question.type === "ESSAY" && (
            <textarea value={answers[question.id] || ""} onChange={(e) => handleAnswer(question.id, e.target.value)} placeholder="Write your response..." rows={8} className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 resize-y" />
          )}
          {question.type === "CODE" && (
            <textarea value={answers[question.id] || ""} onChange={(e) => handleAnswer(question.id, e.target.value)} placeholder="Write code..." rows={10} className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-green-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-y" />
          )}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))} disabled={currentQuestion === 0} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg inline-flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Previous</button>
          {currentQuestion === quiz.questions.length - 1 ? (
            <button onClick={() => setShowConfirm(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg inline-flex items-center gap-2"><Send className="w-4 h-4" /> Submit</button>
          ) : (
            <button onClick={() => setCurrentQuestion((p) => Math.min(quiz.questions.length - 1, p + 1))} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
          )}
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white text-center mb-2">Submit Quiz?</h3>
            <p className="text-gray-400 text-center mb-4">{Object.keys(answers).length}/{quiz.questions.length} answered{quiz.questions.length - Object.keys(answers).length > 0 && <span className="text-yellow-400"> ({quiz.questions.length - Object.keys(answers).length} unanswered)</span>}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Review</button>
              <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
