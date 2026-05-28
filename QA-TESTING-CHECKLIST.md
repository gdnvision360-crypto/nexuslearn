# NexusLearn — QA Testing Checklist

A comprehensive checklist to systematically test every feature before public launch.

**Instructions**: Work through each section. Mark items as PASS, FAIL, or SKIP (if service not configured).

---

## 1. Authentication & Accounts

### 1.1 Registration
- [ ] Register with email and password
- [ ] Password strength validation works (min 8 chars, mixed case, numbers)
- [ ] Duplicate email rejected
- [ ] Verification email sent (if SMTP configured)
- [ ] Email verification link works
- [ ] Redirects to dashboard after registration

### 1.2 Login
- [ ] Login with correct email/password
- [ ] Login with incorrect password shows error
- [ ] Login with unregistered email shows error
- [ ] "Remember me" persists session
- [ ] Session expires after timeout

### 1.3 Social Login (OAuth)
- [ ] Google login works (if configured)
- [ ] GitHub login works (if configured)
- [ ] LinkedIn login works (if configured)
- [ ] Twitter/X login works (if configured)
- [ ] Facebook login works (if configured)
- [ ] Apple login works (if configured)
- [ ] OAuth creates account on first login
- [ ] OAuth links to existing account with same email

### 1.4 Password Reset
- [ ] "Forgot password" link on login page
- [ ] Reset email sent
- [ ] Reset link works
- [ ] Can set new password
- [ ] Old password no longer works

### 1.5 Two-Factor Authentication (2FA)
- [ ] Enable 2FA from settings
- [ ] QR code displayed for authenticator app
- [ ] TOTP code required on login
- [ ] Backup codes generated
- [ ] Backup code works for login
- [ ] Can disable 2FA

### 1.6 Profile Management
- [ ] View own profile
- [ ] Edit name, bio, avatar
- [ ] Upload profile picture
- [ ] Change email (with verification)
- [ ] Change password
- [ ] Delete account

---

## 2. Dashboard

- [ ] Dashboard loads after login
- [ ] Shows upcoming meetings
- [ ] Shows enrolled courses
- [ ] Shows recent activity
- [ ] Shows quick stats (meetings, courses, tasks)
- [ ] Responsive on mobile
- [ ] Dark mode toggle works
- [ ] Navigation sidebar works

---

## 3. Web Conferencing

### 3.1 Meeting Creation
- [ ] Create instant meeting
- [ ] Schedule future meeting
- [ ] Set meeting title and description
- [ ] Set date, time, and duration
- [ ] Set meeting password
- [ ] Enable/disable waiting room
- [ ] Generate meeting link
- [ ] Copy meeting link to clipboard

### 3.2 Meeting Room — Joining
- [ ] Join via meeting link
- [ ] Join via meeting ID
- [ ] Pre-join screen (camera/mic preview)
- [ ] Camera/mic permissions requested
- [ ] Waiting room works (host must admit)
- [ ] Password required if set
- [ ] Guest join (no account) if enabled

### 3.3 Meeting Room — Audio/Video
- [ ] Camera toggle on/off
- [ ] Microphone toggle on/off
- [ ] Speaker selection
- [ ] Camera selection (if multiple)
- [ ] Microphone selection (if multiple)
- [ ] Video quality auto-adjusts
- [ ] Audio quality is clear
- [ ] Screen sharing works
- [ ] Screen share with audio (Chrome)

### 3.4 Meeting Room — Virtual Background
- [ ] Blur background
- [ ] Select preset background image
- [ ] Upload custom background
- [ ] Background renders smoothly
- [ ] Toggle background on/off

### 3.5 Meeting Room — Recording
- [ ] Start local recording
- [ ] Stop recording
- [ ] Recording saved to device
- [ ] Screen + webcam PiP recording
- [ ] Recording indicator visible to all participants

### 3.6 Meeting Room — AI Eye Contact
- [ ] Enable eye contact correction
- [ ] Eye gaze adjusts to camera
- [ ] Toggle on/off smoothly
- [ ] Works with virtual background

### 3.7 Breakout Rooms
- [ ] Host can create breakout rooms
- [ ] Assign participants to rooms
- [ ] Auto-assign option
- [ ] Participants can join assigned room
- [ ] Host can broadcast message to all rooms
- [ ] Timer for breakout sessions
- [ ] Close rooms — participants return to main

### 3.8 Polls & Q&A
- [ ] Host creates a poll
- [ ] Participants can vote
- [ ] Results display in real-time
- [ ] End poll and share results
- [ ] Q&A panel opens
- [ ] Participants submit questions
- [ ] Host can answer/dismiss questions
- [ ] Upvote questions

### 3.9 Reactions & Chat
- [ ] Send emoji reactions (clap, thumbs up, etc.)
- [ ] Reactions display on screen
- [ ] In-meeting chat works
- [ ] Chat messages visible to all
- [ ] Private message to specific participant
- [ ] Chat history preserved during meeting

### 3.10 Whiteboard
- [ ] Open whiteboard
- [ ] Draw freehand
- [ ] Add shapes (rectangle, circle, line)
- [ ] Add text
- [ ] Change colors
- [ ] Eraser tool
- [ ] Collaborative — multiple users draw
- [ ] Save/export whiteboard

### 3.11 Waiting Room
- [ ] Participants placed in waiting room
- [ ] Host sees waiting list
- [ ] Host admits individually
- [ ] Host admits all
- [ ] Host can reject/remove

### 3.12 Phone/SIP Dial-In
- [ ] Dial-in number displayed
- [ ] PIN code generated
- [ ] Audio-only participation via phone
- [ ] SIP endpoint works

### 3.13 Webinar Mode
- [ ] Create webinar (vs regular meeting)
- [ ] Host/panelist roles
- [ ] Attendees view-only by default
- [ ] Promote attendee to panelist
- [ ] Large audience support

### 3.14 Live Streaming
- [ ] Configure YouTube Live stream key
- [ ] Configure Twitch stream key
- [ ] Custom RTMP endpoint
- [ ] Start/stop streaming
- [ ] Stream quality settings

### 3.15 Meeting Minutes
- [ ] In-meeting minutes panel opens
- [ ] Auto-capture agenda items
- [ ] AI auto-generation of minutes (if OpenAI configured)
- [ ] Edit minutes during meeting
- [ ] Structured editor (agenda, decisions, action items)
- [ ] Assign action items to participants
- [ ] Export minutes as PDF
- [ ] Approval workflow (draft > review > approved)
- [ ] Archive and search past minutes

---

## 4. Learning Management System (LMS)

### 4.1 Course Creation
- [ ] Create new course
- [ ] Set title, description, category
- [ ] Upload course thumbnail
- [ ] Add modules/sections
- [ ] Add lessons within modules
- [ ] Reorder modules and lessons (drag & drop)
- [ ] Set course as draft/published
- [ ] Set course price (free or paid)

### 4.2 Lesson Types
- [ ] Video lesson (upload or YouTube URL)
- [ ] Text/document lesson
- [ ] File attachment lesson
- [ ] Quiz lesson
- [ ] Assignment lesson
- [ ] Live session lesson (links to meeting)

### 4.3 Course Enrollment
- [ ] Browse course catalog
- [ ] Search courses
- [ ] Filter by category
- [ ] Enroll in free course
- [ ] Purchase paid course (Stripe)
- [ ] View enrolled courses on dashboard

### 4.4 Course Progress
- [ ] Mark lesson as complete
- [ ] Progress bar updates
- [ ] Resume where left off
- [ ] Course completion percentage shown
- [ ] Completion certificate generated

### 4.5 Quizzes
- [ ] Create quiz with multiple question types
  - [ ] Multiple choice
  - [ ] True/False
  - [ ] Short answer
  - [ ] Essay/long answer
  - [ ] Fill in the blank
  - [ ] Matching
- [ ] Set time limit
- [ ] Set passing score
- [ ] Randomize questions
- [ ] Show/hide correct answers
- [ ] Auto-grading for objective questions
- [ ] Manual grading for essays
- [ ] Quiz results and analytics

### 4.6 Assignments
- [ ] Create assignment
- [ ] Set due date
- [ ] Set point value
- [ ] Students submit file uploads
- [ ] Students submit text responses
- [ ] Instructor grades submission
- [ ] Feedback comments
- [ ] Late submission handling

### 4.7 Certificates
- [ ] Auto-generate on course completion
- [ ] Custom certificate template
- [ ] Student name, course name, date
- [ ] Unique certificate ID
- [ ] Download as PDF
- [ ] Verify certificate by ID
- [ ] Share certificate to social media

### 4.8 Gradebook
- [ ] View grades per student
- [ ] View grades per course
- [ ] Overall GPA calculation
- [ ] Export grades as CSV
- [ ] Grade categories and weights

### 4.9 Gamification
- [ ] Earn points for activities
- [ ] Badges for achievements
- [ ] Leaderboard
- [ ] Streak tracking
- [ ] Level progression

### 4.10 Discussion Forums
- [ ] Forum per course
- [ ] Create new discussion thread
- [ ] Reply to threads
- [ ] Upvote/downvote
- [ ] Pin important threads
- [ ] Instructor can moderate

### 4.11 Learning Paths
- [ ] Create learning path (sequence of courses)
- [ ] Set prerequisites
- [ ] Track path completion
- [ ] Path certificate on completion

### 4.12 Attendance
- [ ] Track attendance per session
- [ ] Mark present/absent/late
- [ ] Attendance reports
- [ ] Attendance required for completion

### 4.13 Peer Review
- [ ] Enable peer review on assignments
- [ ] Random assignment of reviewers
- [ ] Review rubric
- [ ] Anonymous review option
- [ ] Review feedback visible to student

### 4.14 SCORM 1.2
- [ ] Upload SCORM package (.zip)
- [ ] SCORM content plays in iframe
- [ ] Progress tracked
- [ ] Score reported
- [ ] Completion status synced

---

## 5. File Management

- [ ] Upload files (drag & drop)
- [ ] Upload images (JPG, PNG, GIF)
- [ ] Upload videos (MP4, WebM)
- [ ] Upload audio (MP3, WAV)
- [ ] Upload documents (PDF, DOCX)
- [ ] YouTube URL download
- [ ] File preview (images, PDFs, videos)
- [ ] File download
- [ ] File sharing with link
- [ ] File storage usage shown
- [ ] Delete files
- [ ] Organize in folders

---

## 6. Social Media Module

### 6.1 Social Accounts
- [ ] Connect Twitter/X account
- [ ] Connect Facebook page
- [ ] Connect LinkedIn profile
- [ ] Connect Instagram account
- [ ] Disconnect account
- [ ] View connected accounts list

### 6.2 Post Composer
- [ ] Compose new post
- [ ] Character counter per platform
- [ ] Attach image
- [ ] Attach video
- [ ] Preview per platform
- [ ] Post immediately
- [ ] Schedule for later

### 6.3 Scheduler
- [ ] Calendar view of scheduled posts
- [ ] Reschedule by editing
- [ ] Cancel scheduled post
- [ ] Bulk schedule multiple posts
- [ ] View posting history

### 6.4 Auto-Announcements
- [ ] Configure auto-post rules
- [ ] Auto-post on new course publish
- [ ] Auto-post on new webinar scheduled
- [ ] Auto-post on certificate earned
- [ ] Custom post template per rule
- [ ] Enable/disable rules

### 6.5 Social Analytics
- [ ] View engagement per post (likes, shares, comments)
- [ ] Platform comparison chart
- [ ] Top performing posts
- [ ] Engagement over time graph
- [ ] Export analytics data

### 6.6 Share to Social
- [ ] Share certificate to social media
- [ ] Share course completion
- [ ] Share meeting recording
- [ ] Custom share message
- [ ] One-click share buttons

---

## 7. Pricing & Billing

### 7.1 Pricing Page
- [ ] Public pricing page accessible without login
- [ ] Three plans displayed (Free, Pro, Enterprise)
- [ ] Monthly/yearly toggle
- [ ] Feature comparison table
- [ ] FAQ section
- [ ] CTA buttons work

### 7.2 Subscription Management
- [ ] Start free plan (default)
- [ ] Upgrade to Pro via Stripe checkout
- [ ] Stripe payment page loads
- [ ] Test card payment succeeds (4242 4242 4242 4242)
- [ ] Subscription confirmed after payment
- [ ] Downgrade plan
- [ ] Cancel subscription
- [ ] Reactivate cancelled subscription

### 7.3 Feature Gating
- [ ] Free plan limits enforced:
  - [ ] Max 5 users
  - [ ] 40-minute meetings
  - [ ] 10 participants
  - [ ] 3 courses
  - [ ] 1 GB storage
  - [ ] NexusLearn watermark
- [ ] Pro plan limits enforced:
  - [ ] Up to 100 users
  - [ ] 24-hour meetings
  - [ ] 100 participants
  - [ ] Unlimited courses
  - [ ] 100 GB storage
- [ ] Enterprise has no limits
- [ ] Upgrade prompt when hitting limits

### 7.4 Invoices
- [ ] View invoice history
- [ ] Download invoice PDF
- [ ] Invoice sent via email

### 7.5 Coupons
- [ ] Apply coupon code at checkout
- [ ] Percentage discount works
- [ ] Fixed amount discount works
- [ ] Expired coupon rejected
- [ ] Usage limit enforced

---

## 8. Platform Features

### 8.1 Notifications
- [ ] In-app notification bell
- [ ] Notification count badge
- [ ] Notification list/dropdown
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Notification for meeting invite
- [ ] Notification for course enrollment
- [ ] Notification for assignment due
- [ ] Notification for grade posted
- [ ] Email notifications (if SMTP configured)

### 8.2 Global Search
- [ ] Search bar accessible from any page
- [ ] Search users
- [ ] Search courses
- [ ] Search meetings
- [ ] Search files
- [ ] Search results categorized
- [ ] Click result navigates to item

### 8.3 Admin Dashboard
- [ ] Access admin panel (admin role required)
- [ ] View total users count
- [ ] View total courses count
- [ ] View total meetings count
- [ ] View revenue stats
- [ ] User management (list, edit role, suspend)
- [ ] Course management (approve, feature, remove)
- [ ] System settings
- [ ] View audit logs
- [ ] Manage plans and pricing
- [ ] Manage coupons

### 8.4 Themes & Accessibility
- [ ] Light mode
- [ ] Dark mode
- [ ] System preference auto-detect
- [ ] Theme persists across sessions
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible (ARIA labels)
- [ ] Responsive on mobile (320px+)
- [ ] Responsive on tablet
- [ ] Responsive on desktop

### 8.5 PWA (Progressive Web App)
- [ ] "Install App" prompt on mobile
- [ ] App icon on home screen
- [ ] Opens in standalone mode (no browser chrome)
- [ ] Offline fallback page
- [ ] Push notifications (if configured)

### 8.6 Chat / Messaging
- [ ] Direct message another user
- [ ] Group chat
- [ ] Message history preserved
- [ ] File sharing in chat
- [ ] Emoji support
- [ ] Typing indicator
- [ ] Read receipts
- [ ] Unread message count

### 8.7 Tasks
- [ ] Create task
- [ ] Set due date
- [ ] Set priority
- [ ] Assign to user
- [ ] Mark complete
- [ ] Task list view
- [ ] Filter by status/priority
- [ ] Tasks linked to meetings

---

## 9. AI Features (Requires OpenAI API Key)

- [ ] AI meeting summary generation
- [ ] AI course content suggestions
- [ ] AI quiz question generation
- [ ] AI meeting minutes auto-generation
- [ ] AI-powered search
- [ ] Live transcription
- [ ] Live translation

---

## 10. Performance & Security

### 10.1 Performance
- [ ] Pages load within 3 seconds
- [ ] Images optimized (Next.js Image component)
- [ ] No console errors in browser
- [ ] No broken links
- [ ] API responses under 500ms

### 10.2 Security
- [ ] HTTPS enforced (production)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention (Prisma ORM)
- [ ] Rate limiting on auth endpoints
- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens expire
- [ ] File upload validation (type & size)
- [ ] Unauthorized access returns 401/403

---

## 11. Email Communications

- [ ] Welcome email on registration
- [ ] Email verification
- [ ] Password reset email
- [ ] Meeting invitation email
- [ ] Course enrollment confirmation
- [ ] Assignment due reminder
- [ ] Invoice receipt email

---

## 12. API Endpoints Spot Check

Test these key endpoints return proper responses:

```
GET  /api/auth/session          → Current user session
GET  /api/courses               → Course list
GET  /api/meetings              → Meeting list
GET  /api/users/profile         → User profile
GET  /api/notifications         → Notifications
GET  /api/billing/subscription  → Current subscription
GET  /api/search?q=test         → Search results
GET  /api/admin/stats           → Admin statistics (admin only)
POST /api/courses               → Create course (auth required)
POST /api/meetings              → Create meeting (auth required)
```

---

## Testing Summary

| Section | Total Tests | Pass | Fail | Skip |
|---------|------------|------|------|------|
| 1. Authentication | 25 | | | |
| 2. Dashboard | 8 | | | |
| 3. Web Conferencing | 65 | | | |
| 4. LMS | 62 | | | |
| 5. File Management | 12 | | | |
| 6. Social Media | 25 | | | |
| 7. Pricing & Billing | 21 | | | |
| 8. Platform Features | 42 | | | |
| 9. AI Features | 7 | | | |
| 10. Performance & Security | 14 | | | |
| 11. Email | 7 | | | |
| 12. API Endpoints | 10 | | | |
| **TOTAL** | **298** | | | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| Project Lead | | | |
| Developer | | | |

---

**Notes / Issues Found:**

_Document any bugs, issues, or feedback below:_

1.
2.
3.
4.
5.
