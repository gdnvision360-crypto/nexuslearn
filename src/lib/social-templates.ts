export interface SocialTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  variables: string[];
  emoji: string;
  suggestedHashtags: string[];
  suggestedPlatforms: string[];
}

export const SOCIAL_TEMPLATES: SocialTemplate[] = [
  // ── Course Templates ──────────────────────────────────
  {
    id: "course-launch",
    name: "Course Launch",
    category: "Course",
    description: "Announce a new course launch",
    template:
      "🚀 Just launched: {{courseName}}!\n\n{{description}}\n\nEnroll now and start learning: {{link}}\n\n#edtech #learning #onlinecourse",
    variables: ["courseName", "description", "link"],
    emoji: "🚀",
    suggestedHashtags: ["edtech", "learning", "onlinecourse", "education"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
  {
    id: "course-update",
    name: "Course Update",
    category: "Course",
    description: "Announce new content added to a course",
    template:
      "📚 New content alert! We just added {{moduleCount}} new modules to {{courseName}}.\n\nCheck it out: {{link}}\n\n#learning #education",
    variables: ["moduleCount", "courseName", "link"],
    emoji: "📚",
    suggestedHashtags: ["learning", "education", "newcontent"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
  {
    id: "course-milestone",
    name: "Course Enrollment Milestone",
    category: "Course",
    description: "Celebrate enrollment milestones",
    template:
      "🎉 {{courseName}} just hit {{enrollmentCount}} enrollments! Thank you to everyone who's been part of this learning journey.\n\n{{link}}\n\n#milestone #education",
    variables: ["courseName", "enrollmentCount", "link"],
    emoji: "🎉",
    suggestedHashtags: ["milestone", "education", "community"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },

  // ── Webinar Templates ─────────────────────────────────
  {
    id: "webinar-announcement",
    name: "Webinar Announcement",
    category: "Webinar",
    description: "Announce an upcoming webinar",
    template:
      "📅 Join us for \"{{title}}\" on {{date}} at {{time}}!\n\n{{description}}\n\n🔗 Register now: {{link}}\n\n#webinar #live #learning",
    variables: ["title", "date", "time", "description", "link"],
    emoji: "📅",
    suggestedHashtags: ["webinar", "live", "learning", "education"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM"],
  },
  {
    id: "webinar-reminder",
    name: "Webinar Reminder",
    category: "Webinar",
    description: "Send a reminder for an upcoming webinar",
    template:
      "⏰ Reminder: \"{{title}}\" starts in {{timeUntil}}!\n\nDon't miss out — join us live: {{link}}\n\n#webinar #reminder",
    variables: ["title", "timeUntil", "link"],
    emoji: "⏰",
    suggestedHashtags: ["webinar", "reminder", "live"],
    suggestedPlatforms: ["TWITTER", "FACEBOOK"],
  },

  // ── Certificate Templates ─────────────────────────────
  {
    id: "certificate-earned",
    name: "Certificate Earned",
    category: "Certificate",
    description: "Share a certificate achievement",
    template:
      "🎓 I just earned my {{certificateName}} certificate on NexusLearn!\n\nCompleted {{courseName}} and ready to apply these new skills.\n\n#achievement #certification #learning #edtech",
    variables: ["certificateName", "courseName"],
    emoji: "🎓",
    suggestedHashtags: ["achievement", "certification", "learning", "edtech"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
  {
    id: "certificate-congratulations",
    name: "Certificate Congratulations",
    category: "Certificate",
    description: "Congratulate a student on earning a certificate",
    template:
      "🏅 Congratulations to {{studentName}} for completing {{courseName}} and earning their certificate!\n\nKeep up the great work! 🎉\n\n#ProudMoment #education",
    variables: ["studentName", "courseName"],
    emoji: "🏅",
    suggestedHashtags: ["ProudMoment", "education", "achievement"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },

  // ── Recording Templates ───────────────────────────────
  {
    id: "recording-available",
    name: "Recording Available",
    category: "Recording",
    description: "Share a meeting recording",
    template:
      "📹 Missed our meeting? The recording of \"{{title}}\" is now available!\n\nWatch it here: {{link}}\n\n#recording #rewatch #learning",
    variables: ["title", "link"],
    emoji: "📹",
    suggestedHashtags: ["recording", "rewatch", "learning"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
  {
    id: "meeting-highlights",
    name: "Meeting Highlights",
    category: "Recording",
    description: "Share key takeaways from a meeting",
    template:
      "💡 Key takeaways from today's session on \"{{title}}\":\n\n{{highlights}}\n\nFull recording: {{link}}\n\n#insights #meeting",
    variables: ["title", "highlights", "link"],
    emoji: "💡",
    suggestedHashtags: ["insights", "meeting", "keypoints"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN"],
  },

  // ── Milestone Templates ───────────────────────────────
  {
    id: "user-milestone",
    name: "User Milestone",
    category: "Milestone",
    description: "Celebrate a user milestone",
    template:
      "🏆 {{userName}} just reached {{milestone}} on NexusLearn! Amazing dedication to learning.\n\n#milestone #achievement #learning",
    variables: ["userName", "milestone"],
    emoji: "🏆",
    suggestedHashtags: ["milestone", "achievement", "learning"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
  {
    id: "platform-milestone",
    name: "Platform Milestone",
    category: "Milestone",
    description: "Celebrate a platform-wide milestone",
    template:
      "🌟 NexusLearn has reached {{count}} {{entity}}! Thank you to our amazing community.\n\nJoin us: {{link}}\n\n#community #edtech #growth",
    variables: ["count", "entity", "link"],
    emoji: "🌟",
    suggestedHashtags: ["community", "edtech", "growth"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM"],
  },

  // ── Event/Reminder Templates ──────────────────────────
  {
    id: "event-reminder",
    name: "Event Reminder",
    category: "Event",
    description: "Remind about an upcoming event",
    template:
      "🔔 Don't forget! \"{{eventName}}\" is happening {{when}}.\n\n{{details}}\n\nRSVP: {{link}}\n\n#event #reminder",
    variables: ["eventName", "when", "details", "link"],
    emoji: "🔔",
    suggestedHashtags: ["event", "reminder", "dontmiss"],
    suggestedPlatforms: ["TWITTER", "FACEBOOK"],
  },

  // ── General Templates ─────────────────────────────────
  {
    id: "tip-of-the-day",
    name: "Tip of the Day",
    category: "General",
    description: "Share a learning tip",
    template:
      "💡 Tip of the day: {{tip}}\n\nLearn more on NexusLearn: {{link}}\n\n#learningtip #education #edtech",
    variables: ["tip", "link"],
    emoji: "💡",
    suggestedHashtags: ["learningtip", "education", "edtech"],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM"],
  },
  {
    id: "custom",
    name: "Custom Post",
    category: "General",
    description: "Start from scratch with a blank template",
    template: "",
    variables: [],
    emoji: "✏️",
    suggestedHashtags: [],
    suggestedPlatforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
  },
];

// ── Template Helpers ────────────────────────────────────────

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return rendered;
}

export function getTemplatesByCategory(category: string): SocialTemplate[] {
  return SOCIAL_TEMPLATES.filter(
    (t) => t.category.toLowerCase() === category.toLowerCase()
  );
}

export function getTemplateById(id: string): SocialTemplate | undefined {
  return SOCIAL_TEMPLATES.find((t) => t.id === id);
}
