import { PrismaClient, UserRole, ChannelType, MessageType, DocumentType, TaskStatus, TaskPriority, CourseDifficulty, LessonType, MeetingStatus, ParticipantRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedPlans } from "../src/lib/plan-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Seed billing plans
  await seedPlans(prisma);

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.meetingAnalytics.deleteMany();
  await prisma.fileShare.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.file.deleteMany();
  await prisma.fileFolder.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.documentComment.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentFolder.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.breakoutRoom.deleteMany();
  await prisma.meetingRecording.deleteMany();
  await prisma.meetingTranscript.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // ============================================================
  // Users
  // ============================================================
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@nexuslearn.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      bio: "Platform administrator with full access to all features.",
      timezone: "America/New_York",
      emailVerified: new Date(),
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: "Dr. Sarah Chen",
      email: "sarah@nexuslearn.com",
      password: hashedPassword,
      role: UserRole.INSTRUCTOR,
      bio: "Senior instructor specializing in web development and computer science. 10+ years of teaching experience.",
      timezone: "America/Los_Angeles",
      emailVerified: new Date(),
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email: "alex@nexuslearn.com",
      password: hashedPassword,
      role: UserRole.STUDENT,
      bio: "Computer science student passionate about full-stack development.",
      timezone: "Europe/London",
      emailVerified: new Date(),
    },
  });

  console.log("👤 Created users");

  // ============================================================
  // Courses
  // ============================================================
  const course1 = await prisma.course.create({
    data: {
      title: "Full-Stack Web Development with Next.js",
      description:
        "Master modern web development with Next.js 14, React, TypeScript, and PostgreSQL. Build production-ready applications from scratch.",
      instructorId: instructor.id,
      category: "Web Development",
      difficulty: CourseDifficulty.INTERMEDIATE,
      duration: 2400,
      price: 49.99,
      isPublished: true,
      tags: JSON.stringify(["nextjs", "react", "typescript", "postgresql"]),
      modules: {
        create: [
          {
            title: "Getting Started with Next.js",
            description: "Introduction to the Next.js framework and project setup",
            sortOrder: 0,
            lessons: {
              create: [
                {
                  title: "What is Next.js?",
                  content:
                    "Next.js is a React framework for building full-stack web applications. You use React Components to build user interfaces, and Next.js for additional features and optimizations.",
                  type: LessonType.TEXT,
                  duration: 600,
                  sortOrder: 0,
                },
                {
                  title: "Setting Up Your Development Environment",
                  content:
                    "In this lesson, we will set up Node.js, create a new Next.js project, and explore the project structure.",
                  type: LessonType.VIDEO,
                  videoUrl: "https://example.com/videos/setup-env",
                  duration: 900,
                  sortOrder: 1,
                },
                {
                  title: "Understanding the App Router",
                  content:
                    "Learn about file-based routing, layouts, loading states, and error handling in the Next.js App Router.",
                  type: LessonType.TEXT,
                  duration: 1200,
                  sortOrder: 2,
                },
              ],
            },
          },
          {
            title: "React Fundamentals Review",
            description: "A quick review of essential React concepts",
            sortOrder: 1,
            lessons: {
              create: [
                {
                  title: "Components and Props",
                  content:
                    "Understanding React components, props, and component composition patterns.",
                  type: LessonType.TEXT,
                  duration: 800,
                  sortOrder: 0,
                },
                {
                  title: "State Management and Hooks",
                  content:
                    "Deep dive into useState, useEffect, useContext, and custom hooks.",
                  type: LessonType.VIDEO,
                  videoUrl: "https://example.com/videos/hooks",
                  duration: 1500,
                  sortOrder: 1,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: "Database Design & PostgreSQL Mastery",
      description:
        "Learn relational database design principles, SQL fundamentals, and advanced PostgreSQL features for building scalable data layers.",
      instructorId: instructor.id,
      category: "Databases",
      difficulty: CourseDifficulty.BEGINNER,
      duration: 1800,
      price: 39.99,
      isPublished: true,
      tags: JSON.stringify(["postgresql", "sql", "database", "prisma"]),
      modules: {
        create: [
          {
            title: "Introduction to Databases",
            description: "Understanding relational databases and SQL basics",
            sortOrder: 0,
            lessons: {
              create: [
                {
                  title: "What is a Relational Database?",
                  content:
                    "An introduction to relational database concepts, tables, rows, columns, and relationships.",
                  type: LessonType.TEXT,
                  duration: 600,
                  sortOrder: 0,
                },
                {
                  title: "Your First SQL Queries",
                  content:
                    "Learn SELECT, INSERT, UPDATE, and DELETE — the four fundamental SQL operations.",
                  type: LessonType.VIDEO,
                  videoUrl: "https://example.com/videos/first-sql",
                  duration: 1200,
                  sortOrder: 1,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  });

  // Enroll student
  await prisma.enrollment.create({
    data: {
      courseId: course1.id,
      userId: student.id,
      progress: 0.33,
    },
  });

  await prisma.enrollment.create({
    data: {
      courseId: course2.id,
      userId: student.id,
      progress: 0.1,
    },
  });

  // Create lesson progress for the student
  const firstLesson = course1.modules[0].lessons[0];
  await prisma.lessonProgress.create({
    data: {
      lessonId: firstLesson.id,
      userId: student.id,
      status: "COMPLETED",
      timeSpent: 620,
      completedAt: new Date(),
    },
  });

  // Create an assignment
  const assignmentLesson = course1.modules[0].lessons[2];
  const assignment = await prisma.assignment.create({
    data: {
      lessonId: assignmentLesson.id,
      title: "Build a Route Handler",
      description:
        "Create a Next.js API route that returns a list of products in JSON format. Include proper error handling and TypeScript types.",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
    },
  });

  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      userId: student.id,
      content: "Here is my implementation of the route handler...",
      fileIds: JSON.stringify([]),
      score: 85,
      feedback: "Good implementation! Consider adding input validation with Zod.",
      gradedAt: new Date(),
    },
  });

  console.log("📚 Created courses with modules, lessons, enrollments, and assignments");

  // ============================================================
  // Chat Channels
  // ============================================================
  const generalChannel = await prisma.channel.create({
    data: {
      name: "general",
      description: "General discussion for all platform members",
      type: ChannelType.PUBLIC,
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: instructor.id, role: "MEMBER" },
          { userId: student.id, role: "MEMBER" },
        ],
      },
    },
  });

  const courseChannel = await prisma.channel.create({
    data: {
      name: "nextjs-course",
      description: "Discussion channel for the Full-Stack Web Development course",
      type: ChannelType.PUBLIC,
      createdById: instructor.id,
      members: {
        create: [
          { userId: instructor.id, role: "OWNER" },
          { userId: student.id, role: "MEMBER" },
        ],
      },
    },
  });

  const dmChannel = await prisma.channel.create({
    data: {
      name: "dm-sarah-alex",
      description: "Direct message",
      type: ChannelType.DM,
      createdById: instructor.id,
      members: {
        create: [
          { userId: instructor.id, role: "MEMBER" },
          { userId: student.id, role: "MEMBER" },
        ],
      },
    },
  });

  // Messages
  const msg1 = await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: admin.id,
      content: "Welcome to NexusLearn! 🎉 This is the general channel for platform-wide announcements and discussions.",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: instructor.id,
      content: "Thanks for the warm welcome! I'm excited to be teaching here. Feel free to reach out if you have any questions about web development.",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: generalChannel.id,
      senderId: student.id,
      content: "Hi everyone! Just enrolled in the Next.js course. Looking forward to learning!",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: courseChannel.id,
      senderId: instructor.id,
      content: "Welcome to the Next.js course channel! Post your questions about the course material here.",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: courseChannel.id,
      senderId: student.id,
      content: "Quick question — should we use the Pages Router or the App Router for the assignments?",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: courseChannel.id,
      senderId: instructor.id,
      content: "Great question! We'll be using the App Router throughout this course since it's the recommended approach for new Next.js projects.",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: dmChannel.id,
      senderId: student.id,
      content: "Hi Dr. Chen, I had a question about the assignment deadline. Is it possible to get an extension?",
      type: MessageType.TEXT,
    },
  });

  await prisma.message.create({
    data: {
      channelId: dmChannel.id,
      senderId: instructor.id,
      content: "Hi Alex! Sure, I can extend it by 3 days. Just make sure to submit quality work. Let me know if you need any help.",
      type: MessageType.TEXT,
    },
  });

  // Add a reaction
  await prisma.messageReaction.create({
    data: {
      messageId: msg1.id,
      userId: student.id,
      emoji: "🎉",
    },
  });

  console.log("💬 Created channels with messages");

  // ============================================================
  // Documents
  // ============================================================
  const docFolder = await prisma.documentFolder.create({
    data: {
      name: "Course Materials",
      ownerId: instructor.id,
      color: "#3b82f6",
    },
  });

  const doc1 = await prisma.document.create({
    data: {
      title: "Next.js Best Practices Guide",
      content: `# Next.js Best Practices Guide

## Project Structure
Organize your Next.js project with a clear folder structure:
- \`src/app/\` — App Router pages and layouts
- \`src/components/\` — Reusable React components
- \`src/lib/\` — Utility functions and shared logic
- \`src/hooks/\` — Custom React hooks

## Performance
- Use Server Components by default
- Only add "use client" when you need interactivity
- Optimize images with next/image
- Use dynamic imports for heavy components

## Data Fetching
- Fetch data in Server Components when possible
- Use React Server Actions for mutations
- Implement proper error boundaries
- Cache aggressively with revalidation strategies

## Security
- Validate all inputs with Zod
- Use NextAuth.js for authentication
- Implement proper RBAC
- Sanitize user-generated content`,
      type: DocumentType.DOC,
      ownerId: instructor.id,
      folderId: docFolder.id,
      version: 2,
      collaborators: JSON.stringify([student.id]),
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: doc1.id,
      version: 1,
      content: "# Next.js Best Practices Guide\n\nInitial draft.",
      changedById: instructor.id,
      changeDescription: "Initial draft",
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: doc1.id,
      version: 2,
      content: doc1.content,
      changedById: instructor.id,
      changeDescription: "Added detailed sections on performance, data fetching, and security",
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: "Sprint Planning Notes",
      content: `# Sprint Planning Notes — Sprint 1

## Goals
- Set up project infrastructure
- Implement user authentication
- Build course catalog page

## Tasks
1. Configure PostgreSQL database — 3 points
2. Set up NextAuth with OAuth — 5 points
3. Design course card component — 2 points
4. Build course listing API — 3 points
5. Create enrollment flow — 5 points

## Notes
- Using Prisma as ORM
- Deploying on Vercel with Neon database
- Sprint duration: 2 weeks`,
      type: DocumentType.WIKI,
      ownerId: admin.id,
      collaborators: JSON.stringify([instructor.id, student.id]),
    },
  });

  console.log("📄 Created documents");

  // ============================================================
  // Project & Tasks
  // ============================================================
  const project = await prisma.project.create({
    data: {
      name: "NexusLearn Platform Development",
      description:
        "Building the core features of the NexusLearn collaborative learning platform.",
      ownerId: admin.id,
      color: "#8b5cf6",
      icon: "🚀",
      sprintDuration: 14,
      currentSprint: 1,
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: instructor.id, role: "MEMBER" },
          { userId: student.id, role: "MEMBER" },
        ],
      },
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: "Set up authentication with NextAuth.js",
      description:
        "Implement credential-based login and OAuth (Google, GitHub) using NextAuth.js v4 with the Prisma adapter.",
      projectId: project.id,
      assigneeId: admin.id,
      reporterId: admin.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      storyPoints: 5,
      labels: JSON.stringify(["auth", "backend"]),
      sortOrder: 0,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Build course catalog page",
      description:
        "Create a responsive course listing page with search, filters (category, difficulty, price), and pagination.",
      projectId: project.id,
      assigneeId: student.id,
      reporterId: instructor.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      storyPoints: 8,
      labels: JSON.stringify(["frontend", "courses"]),
      sortOrder: 1,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Implement real-time chat with Socket.io",
      description:
        "Build the messaging system with channels, direct messages, message reactions, and file sharing.",
      projectId: project.id,
      assigneeId: admin.id,
      reporterId: admin.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      storyPoints: 13,
      labels: JSON.stringify(["chat", "realtime", "backend"]),
      sortOrder: 2,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      title: "Set up LiveKit video conferencing",
      description:
        "Integrate LiveKit for WebRTC-based video meetings with screen sharing, breakout rooms, and recording support.",
      projectId: project.id,
      assigneeId: instructor.id,
      reporterId: admin.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      storyPoints: 8,
      labels: JSON.stringify(["video", "livekit", "meetings"]),
      sortOrder: 3,
    },
  });

  await prisma.task.create({
    data: {
      title: "Design dashboard analytics widgets",
      description:
        "Create chart components for displaying user engagement, course progress, and platform metrics.",
      projectId: project.id,
      assigneeId: student.id,
      reporterId: instructor.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      storyPoints: 5,
      labels: JSON.stringify(["frontend", "analytics"]),
      sortOrder: 4,
    },
  });

  // Task comments
  await prisma.taskComment.create({
    data: {
      taskId: task1.id,
      userId: admin.id,
      content: "Completed! Both credential login and OAuth are working. Tested with Google and GitHub providers.",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: student.id,
      content: "Working on the filter components. Should I use URL search params for filter state?",
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: instructor.id,
      content: "Yes, use URL search params so filters are shareable and bookmarkable. Good thinking!",
    },
  });

  console.log("📋 Created project with tasks and comments");

  // ============================================================
  // Meetings
  // ============================================================
  const meeting1 = await prisma.meeting.create({
    data: {
      title: "Sprint 1 Kickoff",
      description: "Kickoff meeting for the first sprint. We'll review the backlog and assign tasks.",
      hostId: admin.id,
      scheduledStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      actualStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      actualEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000),
      status: MeetingStatus.ENDED,
      roomId: "room-sprint-kickoff",
      maxParticipants: 20,
      settings: JSON.stringify({
        enableChat: true,
        enableScreenShare: true,
        enableRecording: true,
      }),
      participants: {
        create: [
          { userId: admin.id, role: ParticipantRole.HOST, leftAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000) },
          { userId: instructor.id, role: ParticipantRole.PRESENTER, leftAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000) },
          { userId: student.id, role: ParticipantRole.ATTENDEE, leftAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000) },
        ],
      },
    },
  });

  await prisma.meetingAnalytics.create({
    data: {
      meetingId: meeting1.id,
      totalParticipants: 3,
      peakParticipants: 3,
      avgDuration: 52,
      engagementScore: 0.85,
    },
  });

  const meeting2 = await prisma.meeting.create({
    data: {
      title: "Next.js Office Hours",
      description: "Weekly office hours for the Next.js course. Bring your questions!",
      hostId: instructor.id,
      scheduledStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: MeetingStatus.SCHEDULED,
      roomId: "room-office-hours",
      isRecurring: true,
      recurringPattern: "weekly",
      maxParticipants: 50,
      settings: JSON.stringify({
        enableChat: true,
        enableScreenShare: true,
        enableRecording: false,
        enableBreakoutRooms: true,
      }),
      participants: {
        create: [
          { userId: instructor.id, role: ParticipantRole.HOST },
          { userId: student.id, role: ParticipantRole.ATTENDEE },
        ],
      },
    },
  });

  console.log("📹 Created meetings");

  // ============================================================
  // Files
  // ============================================================
  const fileFolder = await prisma.fileFolder.create({
    data: {
      name: "Course Resources",
      ownerId: instructor.id,
      isShared: true,
    },
  });

  const file1 = await prisma.file.create({
    data: {
      name: "nextjs-cheatsheet.pdf",
      originalName: "Next.js Cheat Sheet.pdf",
      mimeType: "application/pdf",
      size: 245760,
      url: "https://cdn.nexuslearn.com/files/nextjs-cheatsheet.pdf",
      key: "files/nextjs-cheatsheet.pdf",
      uploadedById: instructor.id,
      folderId: fileFolder.id,
      parentType: "COURSE",
      parentId: course1.id,
    },
  });

  const file2 = await prisma.file.create({
    data: {
      name: "project-starter.zip",
      originalName: "Project Starter Template.zip",
      mimeType: "application/zip",
      size: 1048576,
      url: "https://cdn.nexuslearn.com/files/project-starter.zip",
      key: "files/project-starter.zip",
      uploadedById: instructor.id,
      folderId: fileFolder.id,
      parentType: "COURSE",
      parentId: course1.id,
    },
  });

  await prisma.fileShare.create({
    data: {
      fileId: file1.id,
      sharedWith: student.id,
      permission: "VIEW",
      sharedById: instructor.id,
    },
  });

  console.log("📁 Created files and folders");

  // ============================================================
  // Activity Logs
  // ============================================================
  const activities = [
    { userId: admin.id, action: "user.login", entityType: "User", entityId: admin.id },
    { userId: instructor.id, action: "course.create", entityType: "Course", entityId: course1.id, metadata: { title: course1.title } },
    { userId: instructor.id, action: "course.create", entityType: "Course", entityId: course2.id, metadata: { title: course2.title } },
    { userId: student.id, action: "course.enroll", entityType: "Course", entityId: course1.id },
    { userId: student.id, action: "lesson.complete", entityType: "Lesson", entityId: firstLesson.id },
    { userId: admin.id, action: "meeting.create", entityType: "Meeting", entityId: meeting1.id },
    { userId: instructor.id, action: "document.create", entityType: "Document", entityId: doc1.id },
    { userId: admin.id, action: "project.create", entityType: "Project", entityId: project.id },
  ];

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: {
        userId: activity.userId,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : "{}",
      },
    });
  }

  console.log("📊 Created activity logs");

  console.log("\n✅ Seed completed successfully!");
  console.log("   📧 Admin:      admin@nexuslearn.com / password123");
  console.log("   📧 Instructor: sarah@nexuslearn.com / password123");
  console.log("   📧 Student:    alex@nexuslearn.com  / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
