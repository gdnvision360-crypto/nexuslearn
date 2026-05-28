import { z } from "zod";

// ============================================================
// Auth
// ============================================================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ============================================================
// Meetings
// ============================================================

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  scheduledStart: z.string().datetime("Invalid start date"),
  scheduledEnd: z.string().datetime("Invalid end date"),
  maxParticipants: z.number().int().min(2).max(1000).default(100),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  settings: z.record(z.unknown()).default({}),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  maxParticipants: z.number().int().min(2).max(1000).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const addTranscriptSchema = z.object({
  content: z.string().min(1, "Content is required"),
  timestamp: z.string().datetime("Invalid timestamp"),
  language: z.string().default("en"),
  confidence: z.number().min(0).max(1).default(0),
  sentiment: z.string().optional(),
});

// ============================================================
// Channels / Chat
// ============================================================

export const createChannelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["PUBLIC", "PRIVATE", "DM"]).default("PUBLIC"),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).default([]),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
  type: z.enum(["TEXT", "FILE", "CODE", "SYSTEM"]).default("TEXT"),
  replyToId: z.string().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
});

export const toggleReactionSchema = z.object({
  emoji: z.string().min(1, "Emoji is required").max(20),
});

// ============================================================
// Documents
// ============================================================

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  type: z.enum(["DOC", "SPREADSHEET", "PRESENTATION", "WHITEBOARD", "WIKI"]).default("DOC"),
  content: z.string().default(""),
  folderId: z.string().optional(),
  isTemplate: z.boolean().default(false),
  settings: z.record(z.unknown()).default({}),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().optional(),
  folderId: z.string().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
  changeDescription: z.string().max(500).optional(),
});

export const createDocumentCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  position: z.record(z.unknown()).optional(),
  replyToId: z.string().optional(),
});

export const createDocumentFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  parentId: z.string().optional(),
  color: z.string().optional(),
});

// ============================================================
// Projects / Tasks
// ============================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional(),
  color: z.string().default("#3b82f6"),
  icon: z.string().optional(),
  sprintDuration: z.number().int().min(1).max(90).default(14),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "COMPLETED"]).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sprintDuration: z.number().int().min(1).max(90).optional(),
  currentSprint: z.number().int().min(1).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(10000).optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  labels: z.array(z.string()).default([]),
  parentTaskId: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  labels: z.array(z.string()).optional(),
  parentTaskId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const createTaskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

// ============================================================
// Courses
// ============================================================

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(10000).optional(),
  thumbnail: z.string().url().optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  price: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  thumbnail: z.string().url().nullable().optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  duration: z.number().int().min(0).optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// ============================================================
// Files
// ============================================================

export const uploadFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(500),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().int().min(1, "File size must be positive"),
  folderId: z.string().optional(),
  parentType: z.enum(["MESSAGE", "DOCUMENT", "TASK", "COURSE", "SUBMISSION"]).optional(),
  parentId: z.string().optional(),
});

export const youtubeDownloadSchema = z.object({
  url: z.string().url("Invalid URL").refine(
    (url) => {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/;
      return ytRegex.test(url);
    },
    { message: "Invalid YouTube URL" }
  ),
  title: z.string().min(1).max(300).optional(),
});

// ============================================================
// Type exports
// ============================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type YoutubeDownloadInput = z.infer<typeof youtubeDownloadSchema>;
