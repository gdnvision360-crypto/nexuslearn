# NexusLearn — Unified Workspace Platform

NexusLearn is a comprehensive, all-in-one learning and collaboration platform built with modern web technologies. It combines video conferencing, real-time chat, document collaboration, task management, course delivery, and file storage into a single unified workspace.

## Features

- **🎥 Video Conferencing** — LiveKit-powered WebRTC meetings with screen sharing, recording, transcription, and breakout rooms
- **💬 Real-time Chat** — Channel-based messaging with threads, reactions, file sharing, and code blocks
- **📝 Document Collaboration** — Rich documents, spreadsheets, presentations, whiteboards, and wikis with real-time co-editing
- **✅ Task Management** — Kanban boards, list and calendar views, sprints, story points, and project management
- **📚 Course Delivery** — Full LMS with modules, lessons, assignments, quizzes, progress tracking, and certificates
- **📁 File Management** — S3-compatible file storage with folders, sharing, previews, and version control
- **📈 Analytics** — Platform-wide metrics, engagement scores, activity heatmaps, and exportable reports
- **🤖 AI Studio** — AI-powered features for content generation, summarization, and smart suggestions
- **🔐 Authentication** — Email/password, Google, and GitHub OAuth with role-based access control

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 |
| Video | LiveKit (WebRTC) |
| Storage | AWS S3 / Cloudflare R2 / MinIO |
| Real-time | Socket.io |
| Styling | Tailwind CSS + shadcn/ui |
| State | React Query (TanStack Query) |
| Deployment | Docker + Docker Compose |

## Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 16+
- **Redis** 7+ (optional, for real-time features)
- **Docker** and Docker Compose (optional, for containerized deployment)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/nexuslearn.git
cd nexuslearn
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values. See [Environment Variables](#environment-variables) below.

### 4. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

### Full Stack (recommended)

```bash
# Start all services (app, PostgreSQL, Redis, LiveKit)
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push

# Seed database (optional)
docker-compose exec app npx prisma db seed
```

### Development with Docker (database only)

```bash
# Start only PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Run the app locally
npm run dev
```

### Build and run manually

```bash
docker build -t nexuslearn .
docker run -p 3000:3000 --env-file .env nexuslearn
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_URL` | Application URL (e.g., http://localhost:3000) | ✅ |
| `NEXTAUTH_SECRET` | Secret for JWT signing (generate with `openssl rand -base64 32`) | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ❌ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ❌ |
| `LIVEKIT_API_KEY` | LiveKit API key | ❌ |
| `LIVEKIT_API_SECRET` | LiveKit API secret | ❌ |
| `LIVEKIT_API_URL` | LiveKit server URL | ❌ |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL (public) | ❌ |
| `S3_BUCKET` | S3 bucket name | ❌ |
| `S3_REGION` | S3 region | ❌ |
| `S3_ACCESS_KEY_ID` | S3 access key | ❌ |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | ❌ |
| `S3_ENDPOINT` | S3-compatible endpoint URL | ❌ |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | ✅ |

## Project Structure

```
nexuslearn/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeder
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (sign in, register)
│   │   ├── (main)/            # Authenticated pages
│   │   │   ├── dashboard/     # Dashboard
│   │   │   ├── meetings/      # Video meetings
│   │   │   ├── chat/          # Chat workspace
│   │   │   ├── docs/          # Documents
│   │   │   ├── tasks/         # Task management
│   │   │   ├── learning/      # Courses & learning
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── files/         # File manager
│   │   │   └── settings/      # User settings
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── layout/            # Sidebar, TopBar, MainLayout
│   │   ├── meeting/           # Meeting room components
│   │   ├── files/             # File manager components
│   │   └── providers.tsx      # Context providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client
│   │   ├── livekit.ts         # LiveKit server utilities
│   │   ├── s3.ts              # S3 client configuration
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Zod schemas
│   ├── middleware.ts           # Auth middleware
│   └── types/                 # TypeScript type definitions
├── docker-compose.yml         # Production Docker Compose
├── docker-compose.dev.yml     # Development Docker Compose
├── Dockerfile                 # Multi-stage Docker build
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies and scripts
```

## API Documentation

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/[...nextauth]` — NextAuth endpoints

### Meetings
- `GET /api/meetings` — List meetings
- `POST /api/meetings` — Create meeting
- `GET /api/meetings/:id` — Get meeting details
- `POST /api/meetings/:id/join` — Join meeting (get LiveKit token)

### Chat
- `GET /api/channels` — List channels
- `POST /api/channels` — Create channel
- `GET /api/channels/:id/messages` — Get messages
- `POST /api/channels/:id/messages` — Send message

### Documents
- `GET /api/documents` — List documents
- `POST /api/documents` — Create document
- `PATCH /api/documents/:id` — Update document

### Tasks
- `GET /api/tasks` — List tasks
- `POST /api/tasks` — Create task
- `PATCH /api/tasks/:id` — Update task

### Courses
- `GET /api/courses` — List courses
- `POST /api/courses` — Create course
- `POST /api/courses/:id/enroll` — Enroll in course

### Files
- `GET /api/files` — List files
- `POST /api/files/upload` — Upload file (presigned URL)
- `DELETE /api/files/:id` — Delete file

### Analytics
- `GET /api/analytics` — Get analytics data

## LiveKit Setup

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/) or self-host
2. Create a project and get your API key and secret
3. Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL` in `.env`
4. For local development, the Docker Compose includes a LiveKit dev server

## S3 Setup

### AWS S3
1. Create an S3 bucket
2. Create IAM credentials with S3 access
3. Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

### Cloudflare R2
1. Create an R2 bucket in Cloudflare dashboard
2. Create R2 API token
3. Set `S3_ENDPOINT` to your R2 endpoint URL
4. Set other S3 variables accordingly

### MinIO (self-hosted)
1. Run MinIO: `docker run -p 9000:9000 minio/minio server /data`
2. Set `S3_ENDPOINT=http://localhost:9000`, `S3_FORCE_PATH_STYLE=true`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
