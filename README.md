# OptiHealth Web

> A comprehensive platform for personal health data collection, visualization, and AI-powered analysis

OptiHealth empowers individuals to collect, store, visualize, and analyze personal health and wellness data from multiple sources. The platform unifies mental health logs (using LLMs and NLP), raw data from wearables, and supplement tracking for personalized, actionable insights and global health research.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC)](https://tailwindcss.com/)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security](#security)
- [Performance](#performance)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

### Vision

OptiHealth transforms siloed, raw data from wearables, apps, and manual logs into a unified, secure database, then leverages modern data analysis and AI to uncover personalized, actionable insights. The platform enables users to:

- **Track Everything**: Sleep patterns, heart rate variability, supplement intake, app usage, mental health logs, and more
- **Ask Questions**: Natural language queries to an AI assistant about correlations and trends
- **Discover Insights**: Automated pattern detection, correlation finding, and personalized recommendations
- **Research Globally**: Contribute anonymized data to global health research (with explicit consent)

### Core Capabilities

1. **Mental Health Analysis**: LLM-powered analysis of journal entries with vector embeddings for semantic search
2. **Wearable Data Integration**: Automated sync from Health Connect (Android) and other sources
3. **Supplement Intelligence**: Research-grade tracking with normalized dosage calculations
4. **AI-Powered Insights**: Pre-computed correlations, clustering, and trend analysis
5. **Privacy-First Design**: Row-level security, user-owned data, explicit consent for sharing

## Key Features

### 🏥 Health Data Tracking
- **Multi-source ingestion**: Manual logging, wearable devices, APIs
- **50+ metric definitions**: Training metrics, vitals, sleep stages, environment, nutrition, blood pressure, EEG data
- **Rich data types**: Numeric, text, JSON, geographic (PostGIS)
- **Time-series optimization**: Partitioned storage for performance at scale
- **Confidence scoring**: Track data source reliability

### 💊 Supplement Tracking System
- **5-table normalized ontology**: Substances → Compounds → Vendors → Products → Logs
- **3-step product wizard**: Easy product addition with guided form
- **3-tap quick logging**: Select product → Set dosage → Log
- **Normalized dosage**: Automatic mg calculation via database triggers
- **Cabinet management**: Organize your personal supplement collection
- **Adherence tracking**: Daily logs with time stamps and history
- **15+ substances pre-seeded**: Common supplements ready to use
- **40+ compounds**: Multiple chemical forms per substance

### 📊 Data Visualization
- **Interactive charts**: Chart.js and Recharts for flexible visualizations
- **Daily timeline**: Real-time stats display with event timeline
- **Data explorer**: Select metrics, date ranges, and chart types
- **Trend analysis**: Compare multiple metrics over time
- **Export capabilities**: CSV download for offline analysis

### 🎯 Goal Tracking
- **Custom goals**: Set targets for any tracked metric
- **Flexible operators**: Greater than, less than, equals, range operators
- **Active/inactive states**: Enable/disable goals without deletion
- **Progress monitoring**: Track achievement over time

### 🧠 AI-Powered Insights
- **Pre-computed analysis**: Correlation finding, clustering, pattern detection
- **Semantic search**: Vector embeddings for journal entries (pgvector)
- **Contextual filtering**: By metric, date range, chart type
- **Guided discovery**: AI-suggested analysis avenues
- **Impact analysis**: Supplement effectiveness measurement

### 📝 Health Journal
- **Event logging**: Life events with timestamps and descriptions
- **Properties storage**: Flexible JSONB metadata
- **Duration support**: Start/end timestamps for events
- **Vector embeddings**: Find semantically similar entries

### 🔐 Security & Privacy
- **Row-Level Security (RLS)**: Database-level access control
- **User-owned data**: You control your health information
- **OAuth integration**: Google, GitHub, X/Twitter login
- **JWT authentication**: Secure session management
- **Encryption**: All data encrypted at rest and in transit

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3 with App Router
- **UI Library**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.17
- **Components**: Radix UI (Accessible component primitives)
- **Icons**: Lucide React (544 icons)
- **Forms**: React Hook Form + Zod validation
- **Data Viz**: Chart.js 4.5.1, Recharts 3.4.1
- **Data Fetching**: SWR 2.3.6 (stale-while-revalidate)
- **Animations**: Framer Motion 12.23
- **Notifications**: Sonner 2.0.7

### Backend
- **BaaS**: Supabase (PostgreSQL + Auth + Real-time + Edge Functions)
- **Database**: PostgreSQL 17
- **Extensions**: pgvector, pg_cron, PostGIS
- **Auth**: Supabase Auth with JWT tokens
- **Edge Functions**: Deno TypeScript runtime

### Development Tools
- **Runtime**: Bun (fast JavaScript runtime)
- **Linter/Formatter**: Biome 2.2.4 (ESLint + Prettier alternative)
- **Build Tool**: Next.js Turbopack (faster than webpack)
- **Version Control**: Git
- **Containerization**: Docker + Docker Compose

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                            │
│  ┌────────────────────┐          ┌──────────────────────┐       │
│  │ Web Application    │          │ Android Application  │       │
│  │ (Next.js 15)       │          │ (Kotlin) [Planned]   │       │
│  └────────────────────┘          └──────────────────────┘       │
└───────────────┬──────────────────────────────┬─────────────────┘
                │                              │
                │ HTTPS/JWT                    │ Compressed Sync
                │                              │
┌───────────────┴──────────────────────────────┴─────────────────┐
│                    Supabase Backend (BaaS)                      │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ Supabase Auth│  │ PostgreSQL  │  │ Edge Functions      │    │
│  │ (JWT/OAuth)  │  │ Database    │  │ (Deno Runtime)      │    │
│  │              │  │ + Extensions│  │ - ingest-data       │    │
│  └──────────────┘  │ - pgvector  │  │   (zstd compression)│    │
│                    │ - pg_cron   │  └─────────────────────┘    │
│                    │ - PostGIS   │                              │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ RPC/SQL
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              Python Analysis Service [Planned]                  │
│  - ML model training                                            │
│  - Deep insight generation                                      │
│  - Computationally intensive analysis                           │
└─────────────────────────────────────────────────────────────────┘

External Integrations:
  - Health Connect by Android
  - Android UsageStatsManager API
  - LLM Services (OpenAI/Anthropic) [Planned]
```

### Data Flow

1. **Data Collection**:
   - Manual entry via web UI
   - Automated sync from Android app (Health Connect)
   - API integrations with wearables

2. **Data Ingestion**:
   - Client compresses data with Zstandard (zstd)
   - Sends to `ingest-data` Edge Function
   - Function decompresses and validates
   - Bulk insert via PostgreSQL RPC function

3. **Data Processing**:
   - Real-time: PostgreSQL triggers for normalization
   - Scheduled: pg_cron jobs for pre-aggregation
   - Async: Python service for ML analysis

4. **Data Visualization**:
   - Query pre-aggregated summaries for dashboard
   - SWR for client-side caching
   - Real-time updates via Supabase subscriptions

## Data Model

### Core Architectural Principles

1. **Normalized & Tidy**: Hub-and-spoke model centered on `metric_definitions`
2. **Pre-Aggregated for Speed**: Multi-level summary tables for dashboard performance
3. **AI-Ready with Vector Search**: pgvector extension for semantic analysis
4. **Time-Series Optimized**: Partitioned by month for query performance

### Key Tables

#### Metric Infrastructure
- `metric_definitions` - Registry of all trackable metrics (50+ predefined)
- `metric_sources` - Data source tracking (Fitbit, Apple HealthKit, manual, etc.)
- `data_points` - Partitioned time-series storage (by month)
- `events` - Timestamped events with semantic embeddings (1536-dim vectors)

#### Supplement Ontology (5-Table Design)
```
substances (15+)           compounds (40+)         vendors (12+)
    ↓                          ↓                       ↓
"Magnesium"    →    "Magnesium L-Threonate"  →  "Thorne Research"
                               ↓
                         products (user-specific)
                               ↓
                      supplement_logs (timestamped)
```

1. **substances** - Abstract parent (e.g., "Magnesium", "Vitamin D")
2. **compounds** - Specific chemical form (e.g., "Magnesium L-Threonate", "Vitamin D3")
3. **vendors** - Manufacturer/brand (e.g., "Thorne Research", "Nootropics Depot")
4. **products** - User's "bottle" linking compound to vendor with dosage info
5. **supplement_logs** - Event logs with auto-calculated normalized dosage

#### Analytics
- `goals` - User-defined health goals with targets and operators
- `insights` - Pre-computed analysis results (correlations, patterns, clusters)
- `component_submissions` - User-submitted missing supplements for curation

#### User Management
- `user_profiles` - User metadata (full_name, timezone)
- `auth.users` - Supabase authentication (OAuth + email/password)

### Metric Categories

#### 🏃‍♂️ Training Metrics
- `activity_steps`, `workout_duration`, `workout_distance`, `workout_calories_burned`, `workout_type`

#### ❤️ Vitals & Heart
- `hr_resting`, `hr`, `hrv_rmssd`, `body_temperature`, `blood_oxygen_spo2`, `respiratory_rate`

#### 😴 Sleep Metrics
- `sleep_duration_total`, `sleep_duration_deep`, `sleep_duration_light`, `sleep_duration_rem`, `sleep_duration_awake`
- `sleep_score`, `sleep_stages` (JSON array with sequence data)

#### 🧠 Mental Health
- `mental_health_log` (free-text with vector embeddings)

#### 🌳 Environment
- `environment_uv_index`, `environment_noise_level`, `environment_air_quality`, `environment_pressure`, `environment_location`

#### 🥗 Nutrition
- `nutrition_calories`, `nutrition_sugar`, `nutrition_glucose_blood`

#### 🩺 Blood Pressure
- `bp_systolic`, `bp_diastolic`, `bp_pulse_pressure`

#### 🧬 Neiry (Brain Metrics)
- `neiry_focus`, `neiry_stress`, `neiry_relaxation`

#### 🔬 EEG/Brain Waves
- `brain_alpha`, `brain_beta`, `brain_theta`, `brain_delta`, `brain_gamma`

### Sleep Stages Data Structure

Sleep data is stored as a JSON sequence in `data_points.value_json`:

```json
[
  {
    "stage": "awake",
    "startTimestamp": "2024-10-23T22:05:00Z",
    "endTimestamp": "2024-10-23T22:15:00Z",
    "durationSeconds": 600
  },
  {
    "stage": "light",
    "startTimestamp": "2024-10-23T22:15:00Z",
    "endTimestamp": "2024-10-23T23:05:00Z",
    "durationSeconds": 3000
  },
  {
    "stage": "deep",
    "startTimestamp": "2024-10-23T23:05:00Z",
    "endTimestamp": "2024-10-23T23:45:00Z",
    "durationSeconds": 2400
  },
  {
    "stage": "rem",
    "startTimestamp": "2024-10-23T23:45:00Z",
    "endTimestamp": "2024-10-24T00:10:00Z",
    "durationSeconds": 1500
  }
]
```

Benefits: Atomic storage, leverages GIN indexes for fast JSONB queries, avoids complex table joins.

## Getting Started

### Prerequisites

- **Node.js**: 20+ (Bun recommended for faster performance)
- **Supabase Account**: Free tier available at [supabase.com](https://supabase.com)
- **Docker**: For local Supabase development (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AntonIXO/optihealth_web.git
   cd optihealth_web
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

   # Optional: For server-side operations
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase**

   **Option A: Use Supabase Cloud**
   - Create a project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env.local`
   - Run migrations:
     ```bash
     npx supabase db push
     ```

   **Option B: Use Local Supabase (Docker)**
   ```bash
   # Start local Supabase
   npx supabase start

   # This will output:
   # - API URL: http://localhost:54321
   # - Studio URL: http://localhost:54323
   # - Anon key: eyJh...

   # Copy these to .env.local
   ```

5. **Run database migrations**
   ```bash
   # Migrations are in supabase/migrations/
   # They run automatically with supabase start or db push
   ```

6. **Seed the database** (optional)
   ```bash
   npx supabase db reset
   # This runs migrations + seed.sql
   ```

### Running the Application

```bash
# Development mode with Turbopack (fast HMR)
bun run dev

# Or with npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
bun run build

# Start production server
bun run start
```

## Usage Guide

### 1. Authentication

Navigate to the home page and click "Get Started" or "Sign In":

- **Email/Password**: Create account or sign in with email
- **OAuth**: Sign in with Google, GitHub, or X/Twitter
- **Demo Account**: Try the demo mode (limited features)

### 2. Dashboard Overview

After logging in, you'll see the main dashboard with:

- **Daily Timeline**: Today's stats and events in chronological order
- **Quick Actions**: Log data, add supplements, create journal entries
- **Metric Widgets**: Key health indicators at a glance
- **Navigation Sidebar**: Access all features

### 3. Logging Health Data

#### Manual Data Entry
1. Click the **"+ Log Data"** button
2. Select a metric from the dropdown (e.g., "Resting Heart Rate")
3. Enter the value and optional timestamp
4. Click "Save"

#### Conversational Logging (Planned)
Type natural language commands like:
- "Log that I took 500mg of Vitamin C"
- "I slept 7.5 hours last night"
- "Add my morning run: 5km in 28 minutes"

### 4. Supplement Tracking

#### Adding Products to Cabinet
1. Navigate to **Dashboard → Supplements → Cabinet**
2. Click **"+ Add Product"**
3. Follow the 3-step wizard:
   - **Step 1**: Select compound (e.g., "Magnesium L-Threonate")
   - **Step 2**: Select vendor (e.g., "Thorne Research")
   - **Step 3**: Enter product details (dosage, form factor)

#### Quick Logging
1. Go to **Dashboard → Supplements**
2. Click on a product button in "My Cabinet"
3. Adjust dosage if needed
4. Click "Log"

The system automatically:
- Normalizes dosage to elemental amount (e.g., 2000mg Magnesium L-Threonate → 144mg elemental Magnesium)
- Tracks adherence and streaks
- Updates history

### 5. Data Visualization

#### Viewing Charts
1. Navigate to **Dashboard → Data**
2. Select metrics to visualize
3. Choose date range (last 7 days, 30 days, custom)
4. Toggle chart type (line, bar, scatter)

#### Comparing Metrics
- Click **"Compare"** to overlay a second metric
- Useful for finding correlations (e.g., sleep quality vs. caffeine intake)

#### Exporting Data
- Click **"Export to CSV"** to download raw data
- Use for offline analysis or backup

### 6. Setting Goals

1. Navigate to **Dashboard → Goals**
2. Click **"+ Create Goal"**
3. Fill in the form:
   - **Metric**: What to track (e.g., "Steps")
   - **Target**: Desired value (e.g., 10000)
   - **Operator**: Comparison type (≥, ≤, =, range)
   - **Description**: Why this goal matters
4. Save and activate

The system will track your progress and show achievement history.

### 7. Exploring Insights

1. Navigate to **Dashboard → Insights**
2. Browse pre-computed insights:
   - **Correlations**: "Your sleep quality improves by 15% on days you exercise"
   - **Patterns**: "You're most productive between 9 AM and 12 PM"
   - **Clusters**: "Your stress levels spike every Monday"
3. Filter by metric, date range, or insight type
4. Click on an insight to see detailed analysis

### 8. Health Journal

1. Navigate to **Dashboard → Journal**
2. Click **"+ New Entry"**
3. Write your thoughts, moods, or observations
4. Add tags for categorization
5. The system automatically creates vector embeddings for semantic search

Later, you can search for similar entries or correlate journal content with quantitative health data.

### 9. Settings & Profile

1. Navigate to **Dashboard → Settings**
2. Update profile information:
   - Full name
   - Timezone (important for correct data interpretation)
3. Manage data privacy settings
4. Export or delete your data

## Development

### Project Structure

```
optihealth_web/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Authentication pages
│   │   ├── dashboard/        # Protected dashboard pages
│   │   │   ├── data/         # Data logging & visualization
│   │   │   ├── insights/     # AI insights
│   │   │   ├── goals/        # Goal tracking
│   │   │   ├── supplements/  # Supplement management
│   │   │   ├── journal/      # Health journal
│   │   │   └── settings/     # User settings
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components (Radix)
│   │   ├── dashboard/        # Dashboard-specific
│   │   ├── insights/         # Insight displays
│   │   └── journal/          # Journal components
│   ├── lib/                  # Utilities
│   └── utils/                # External helpers
│       └── supabase/         # Supabase client setup
├── supabase/
│   ├── migrations/           # Database migrations (14 files)
│   ├── functions/            # Edge Functions (Deno)
│   │   └── ingest-data/      # Bulk data ingestion
│   ├── config.toml           # Local dev config
│   └── seed.sql              # Database seeding
├── public/                   # Static assets
├── middleware.ts             # Auth middleware
├── next.config.ts            # Next.js config
├── tsconfig.json             # TypeScript config
├── biome.json                # Linter/formatter config
├── package.json              # Dependencies
└── docker-compose.yml        # Local dev services
```

### Code Conventions

- **Formatting**: Biome with 2-space indentation
- **Naming**:
  - Components: PascalCase (e.g., `DataLogger.tsx`)
  - Files: kebab-case (e.g., `daily-timeline.tsx`)
  - Functions: camelCase (e.g., `calculateNormalizedDosage`)
- **TypeScript**: Strict mode enabled, no `any` types
- **Styling**: Tailwind utility classes with dark theme primary
- **State**: React hooks for local state, SWR for server state
- **Forms**: React Hook Form + Zod schemas

### Running Linter

```bash
# Check code
bun run lint

# Format code
bun run format
```

### Database Migrations

```bash
# Create a new migration
npx supabase migration new your_migration_name

# Apply migrations
npx supabase db push

# Reset database (drops all data!)
npx supabase db reset
```

### Edge Functions

```bash
# Deploy edge functions
npx supabase functions deploy ingest-data

# Test locally
npx supabase functions serve

# Call function
curl -X POST http://localhost:54321/functions/v1/ingest-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "compressed_base64_string"}'
```

### Testing

```bash
# Currently no test suite configured
# Contributions welcome!

# Manual testing workflow:
# 1. Start local Supabase: npx supabase start
# 2. Run dev server: bun run dev
# 3. Test features in browser
# 4. Check database in Studio: http://localhost:54323
```

## Database Schema

### Indexes for Performance

The schema uses multiple index types for optimal query performance:

1. **B-tree indexes**: Standard indexes on foreign keys and common filters
   - `idx_datapoints_user_metric_id_timestamp` on `(user_id, metric_id, timestamp DESC)`

2. **GIN indexes**: For JSONB full-text search and containment queries
   - `idx_datapoints_value_json_gin` on `value_json` column

3. **BRIN indexes**: For large time-series tables (block-range indexes)
   - `idx_datapoints_timestamp_brin` on `timestamp` column

4. **GIST indexes**: For geographic queries (PostGIS)
   - `idx_datapoints_value_geography_gist` on `value_geography` column

5. **HNSW indexes**: For vector similarity search (pgvector)
   - `idx_events_embedding_hnsw` on `embedding` column (1536 dimensions)

### Partitioning Strategy

The `data_points` table is partitioned by month using PostgreSQL's native range partitioning:

- Each month gets its own partition table
- Partitions are created automatically via pg_cron job
- Queries are much faster when filtering by timestamp
- Allows for efficient data archival/deletion

Example partitions:
- `data_points_2024_01` (January 2024)
- `data_points_2024_02` (February 2024)
- etc.

### Row-Level Security (RLS)

All tables have RLS enabled with policies like:

```sql
-- Users can only access their own data
CREATE POLICY "Users manage own data" ON data_points
  FOR ALL USING (auth.uid() = user_id);

-- Metric definitions are read-only for authenticated users
CREATE POLICY "Auth users read metrics" ON metric_definitions
  FOR SELECT USING (auth.role() = 'authenticated');
```

This ensures data isolation at the database level, not just application level.

### Database Functions

Key PostgreSQL functions:

- `bulk_insert_data_points(jsonb)` - Efficient batch inserts with conflict handling
- `calculate_normalized_dosage()` - Trigger for supplement dosage normalization
- `manage_partitions()` - Automatic partition creation for future months
- `handle_updated_at()` - Auto-update `updated_at` timestamps

## API Reference

### Edge Functions

#### `ingest-data` - Bulk Data Ingestion

**Endpoint**: `POST /functions/v1/ingest-data`

**Authentication**: Bearer token (JWT from Supabase Auth)

**Request Body**:
```json
{
  "data": "base64_encoded_zstd_compressed_json"
}
```

**Compressed JSON Structure** (before compression):
```json
[
  {
    "metric_id": 1,
    "metric_source_id": 5,
    "timestamp": "2024-03-22T10:30:00Z",
    "value_numeric": 72.5,
    "value_text": null,
    "value_json": null,
    "value_geography": null
  },
  ...
]
```

**Response**:
```json
{
  "message": "Successfully ingested 150 data points"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid data format or missing required fields
- `500 Internal Server Error`: Database error

**Example Usage** (JavaScript):
```javascript
import * as fzstd from 'fzstd';

// Prepare data
const dataPoints = [
  { metric_id: 1, metric_source_id: 5, timestamp: '...', value_numeric: 72 },
  // ... more points
];

// Compress with Zstandard
const jsonString = JSON.stringify(dataPoints);
const compressed = fzstd.compress(new TextEncoder().encode(jsonString));

// Encode to base64
const base64 = btoa(String.fromCharCode(...compressed));

// Send to edge function
const response = await fetch('YOUR_SUPABASE_URL/functions/v1/ingest-data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: base64 })
});
```

### REST API Routes

#### Submit Missing Component

**Endpoint**: `POST /api/components/submit`

**Request Body**:
```json
{
  "submitted_name": "NAC (N-Acetyl Cysteine)",
  "category_suggestion": "Amino Acids",
  "notes": "Popular antioxidant supplement"
}
```

**Response**:
```json
{
  "success": true,
  "id": 42
}
```

### Database RPC Functions

Call via Supabase client:

```typescript
// Bulk insert data points
const { data, error } = await supabase.rpc('bulk_insert_data_points', {
  data_points: [
    { metric_id: 1, metric_source_id: 5, timestamp: '...', value_numeric: 72 },
    // ...
  ]
});

// Add new product (supplement)
const { data, error } = await supabase.rpc('add_new_product', {
  p_compound_id: 15,
  p_vendor_id: 3,
  p_unit_dosage: 500,
  p_unit_measure: 'mg',
  p_form_factor: 'capsule',
  p_default_intake_form: 'oral'
});
```

## Security

### Authentication

- **JWT Tokens**: Stateless authentication with Supabase
- **Refresh Tokens**: Automatic rotation every 10 seconds
- **OAuth Providers**: Google, GitHub, X/Twitter
- **Password Requirements**: Enforced by Supabase Auth
- **Email Verification**: Required for email/password signup

### Data Protection

1. **Row-Level Security (RLS)**: Database-level isolation
2. **Encryption at Rest**: All data encrypted in Supabase
3. **Encryption in Transit**: HTTPS only
4. **User-Owned Data**: Users can only access/modify their own data
5. **Audit Logs**: Track data access and modifications (via `created_at`, `updated_at`)

### Privacy Features

- **No Data Sharing by Default**: Explicit consent required
- **Data Export**: Users can download all their data
- **Data Deletion**: Users can delete their account and all data
- **Anonymization**: Research data is fully anonymized
- **Minimal PII**: Only essential user info collected (email, optional full name)

### Best Practices

1. Never commit `.env.local` or secrets to version control
2. Use environment variables for all sensitive configuration
3. Rotate API keys regularly
4. Monitor Supabase audit logs for suspicious activity
5. Keep dependencies updated (use `bun update` or `npm update`)

## Performance

### Frontend Optimizations

1. **Next.js Turbopack**: 10x faster than webpack for development
2. **Server Components**: Reduced JavaScript bundle size
3. **Lazy Loading**: Dynamic imports for heavy components
4. **SWR Caching**: Automatic request deduplication and caching
5. **Image Optimization**: Next.js automatic image optimization (when configured)

### Database Optimizations

1. **Partitioning**: Monthly partitions on `data_points` for fast range queries
2. **Indexes**: Strategic indexes on all common query patterns
3. **Pre-Aggregation**: Summary tables avoid real-time aggregation
4. **Connection Pooling**: Supabase handles connection management
5. **Query Optimization**: Use indexes, avoid N+1 queries

### Edge Function Performance

1. **Compression**: Zstandard reduces payload size by 70-90%
2. **Batch Processing**: Process 100-500 records per request
3. **Deno Runtime**: Fast cold start times (<100ms)
4. **Global Distribution**: Edge functions deploy to multiple regions

### Monitoring

- **Supabase Dashboard**: Real-time metrics on database load, API usage
- **Next.js Analytics**: Built-in performance monitoring (when deployed to Vercel)
- **Database Slow Query Log**: Identify optimization opportunities

## Documentation

### Available Documentation

1. **[WHITEPAPER.md](./WHITEPAPER.md)** - Comprehensive 14-chapter vision document
   - Platform architecture
   - Data models and analysis strategies
   - Social features and privacy design
   - AI agent architecture
   - Future roadmap

2. **[SUPPLEMENT_IMPLEMENTATION.md](./SUPPLEMENT_IMPLEMENTATION.md)** - Supplement tracking implementation guide
   - 5-table ontology explanation
   - Component descriptions
   - Database functions
   - User flow examples

3. **API Documentation** - See [API Reference](#api-reference) section above

4. **Supabase Documentation** - [supabase.com/docs](https://supabase.com/docs)

5. **Next.js Documentation** - [nextjs.org/docs](https://nextjs.org/docs)

### Key Concepts

- **Metric Definition**: A template for a measurable health metric (e.g., "Resting Heart Rate")
- **Data Point**: A single measurement of a metric at a specific timestamp
- **Event**: A qualitative life event with semantic context (e.g., journal entry)
- **Supplement Log**: A timestamped record of taking a supplement with normalized dosage
- **Goal**: A target value for a metric with comparison operator
- **Insight**: A pre-computed analysis result (correlation, pattern, cluster)
- **Vector Embedding**: A 1536-dimensional numerical representation for semantic search

## Contributing

We welcome contributions! Here's how to get started:

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/optihealth_web.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Set up local Supabase: `npx supabase start`
6. Copy environment variables from Supabase output to `.env.local`

### Development Workflow

1. Make your changes
2. Test locally: `bun run dev`
3. Format code: `bun run format`
4. Lint code: `bun run lint`
5. Commit with clear message: `git commit -m "feat: add X feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Contribution Guidelines

- **Code Style**: Follow existing patterns, use Biome formatter
- **TypeScript**: Use strict types, avoid `any`
- **Components**: Keep components small and focused
- **Commits**: Use conventional commits (feat, fix, docs, refactor, etc.)
- **Tests**: Add tests for new features (when test infrastructure is set up)
- **Documentation**: Update README if adding new features

### Areas for Contribution

- [ ] Test suite (unit tests, integration tests, E2E tests)
- [ ] LLM integration for conversational data logging
- [ ] Python analysis service implementation
- [ ] Android app for automated data sync
- [ ] Data visualization enhancements
- [ ] AI insight generation algorithms
- [ ] Social features (Circles, data sharing)
- [ ] Additional OAuth providers
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements

## Roadmap

### Current Status (v0.1.0)

✅ **Implemented**:
- Authentication (OAuth + email/password)
- Core database schema with RLS
- Dashboard with navigation
- Manual data logging interface
- Supplement 5-table ontology
- Supplement cabinet management
- Quick supplement logging
- Basic data visualization
- Goal creation interface
- Settings page

🚧 **In Progress**:
- AI-powered insights generation
- Data analysis engine
- Goal achievement tracking

📋 **Planned**:

**Phase 1: Data Analysis (Q2 2026)**
- Correlation detection algorithms
- Pattern recognition and clustering
- Supplement impact analysis
- Automated insight generation

**Phase 2: AI Integration (Q3 2026)**
- LLM integration for conversational interface
- Natural language data logging
- AI-powered recommendations
- Semantic search for journal entries

**Phase 3: Mobile App (Q4 2026)**
- Android app with Health Connect integration
- Automated data sync with compression
- Background service for continuous tracking
- Push notifications for goals and insights

**Phase 4: Social Features (Q1 2027)**
- Circles (private groups with data sharing)
- Anonymous research data contribution
- Leaderboards and challenges (opt-in)
- Expert consultations

**Phase 5: Advanced Analytics (Q2 2027)**
- Machine learning models for predictions
- Cyclical time features (24-hour cycle encoding)
- Smart location tracking with privacy
- Noise reduction and confidence scoring

## License

This project is currently **proprietary** - all rights reserved by the project owner.

For licensing inquiries, please contact: [contact information to be added]

---

## Quick Start Commands

```bash
# Installation
bun install

# Development
bun run dev                    # Start dev server
npx supabase start            # Start local Supabase

# Production
bun run build                 # Build for production
bun run start                 # Start production server

# Maintenance
bun run lint                  # Check code quality
bun run format                # Format code
npx supabase db reset         # Reset database with migrations
npx supabase db push          # Push migrations to remote
```

## Support

- **Issues**: [GitHub Issues](https://github.com/AntonIXO/optihealth_web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AntonIXO/optihealth_web/discussions)
- **Documentation**: See [Documentation](#documentation) section

## Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Supabase Team**: For the powerful BaaS platform
- **Radix UI Team**: For accessible component primitives
- **Biome Team**: For the fast linter/formatter
- **Open Source Community**: For the amazing tools that make this project possible

---

**Built with ❤️ for personal health optimization and scientific research**
