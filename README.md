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

## Overview

### Vision

OptiHealth transforms siloed, raw data from wearables, apps, and manual logs into a unified, secure database, then leverages modern data analysis and AI to uncover personalized, actionable insights.

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

### 📊 Data Visualization
- **Interactive charts**: Chart.js and Recharts for flexible visualizations
- **Daily timeline**: Real-time stats display with event timeline
- **Data explorer**: Select metrics, date ranges, and chart types
- **Trend analysis**: Compare multiple metrics over time

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

## Technology Stack

### Frontend
- **Framework**: Next.js
- **Forms**: React Hook Form + Zod validation
- **Data Viz**: Chart.js 4.5.1, Recharts 3.4.1
- **Data Fetching**: SWR 2.3.6 (stale-while-revalidate)

### Backend
- **BaaS**: Supabase (PostgreSQL + Auth + Real-time + Edge Functions)
- **Database**: PostgreSQL 17
- **Extensions**: pgvector, pg_cron, PostGIS
- **Auth**: Supabase Auth with JWT tokens
- **Edge Functions**: Deno TypeScript runtime

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Devices                            │
│  ┌────────────────────┐          ┌──────────────────────┐       │
│  │ Web Application    │          │ Android Application  │       │
│  │                    │          │ (Kotlin)             │
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
│              Python Analysis Service                            │
│  - Insight generation                                      │
│  - Computationally intensive analysis                           │
└─────────────────────────────────────────────────────────────────┘

```
External Integrations:
  - [Android app](https://github.com/AntonIXO/optihealth_android)
  - [Analysis engine](https://github.com/AntonIXO/optihealth_analysis)
    
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

### Running with Docker

```bash
# IMPORTANT: use --env-file so build args are populated during image build
docker compose --env-file .env.local up -d --build
```

Without `--env-file .env.local`, Docker Compose can start the container with runtime env values from `env_file`, but `build.args` may stay empty during image build.

For this project that means Supabase public vars can be missing at build time, which can lead to broken auth/runtime behavior.

## Usage Guide

### 1. Authentication

Navigate to the home page and click "Get Started" or "Sign In":

- **Email/Password**: Create account or sign in with email
- **OAuth**: Sign in with Google or password
- **Demo Account**: Try the demo mode

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
3. Choose date range (last 7 days, 30 days)
4. Toggle chart type (line, bar, scatter)

#### Comparing Metrics
- Click **"Compare"** to overlay a second metric
- Useful for finding correlations (e.g., sleep quality vs. caffeine intake)

### 6. Health Journal

1. Navigate to **Dashboard → Journal**
2. Click **"+ New Entry"**
3. Write your thoughts, moods, or observations
4. Add tags for categorization
5. The system automatically creates vector embeddings for semantic search

Later, you can search for similar entries or correlate journal content with quantitative health data.

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
