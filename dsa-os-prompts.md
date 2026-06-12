# DSA OS — Architecture & Claude Code Prompt Sequence

> Read the architecture section once. Then run Prompts 1–10 in order inside Claude Code terminal. Paste the MASTER CONTEXT at the top of every new session.

---

## Architecture Analysis

### What this app actually is

A **personal cognitive tracker**, not a problem tracker. Most DSA tools track *completions*. This one tracks *thinking quality*. The entire architecture is built around that distinction.

Three modules, one data model:

```
LEARNING MODULE      → New Problem Entry (your thoughts, algorithm, code, sliders)
REVISION MODULE      → SM-2 spaced repetition (swipeable cards)
INTELLIGENCE MODULE  → Analytics + AI Mentor (patterns from your own data)
```

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MOBILE (<768px)              │  DESKTOP (≥768px)            │
│                               │                              │
│  ┌─────────────────────────┐  │  ┌──────┬──────────────────┐ │
│  │     Top Bar (page title)│  │  │      │  Page Content    │ │
│  ├─────────────────────────┤  │  │Side  │                  │ │
│  │                         │  │  │Bar   │                  │ │
│  │     Page Content        │  │  │      │                  │ │
│  │                         │  │  │      │                  │ │
│  ├─────────────────────────┤  │  └──────┴──────────────────┘ │
│  │  Bottom Nav (5 tabs)    │  │                              │
│  └─────────────────────────┘  │                              │
└─────────────────────────────────────────────────────────────┘
```

**Bottom Nav tabs (mobile):**  
Home · Problems · ＋ (center, elevated) · Revision · Stats

**Route structure:**
```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
    layout.tsx          ← clean centered auth layout
  (app)/
    layout.tsx          ← app-shell: sidebar + bottom-nav
    dashboard/page.tsx
    problems/
      page.tsx          ← list with filter/search
      new/page.tsx      ← 3-step entry form
      [id]/page.tsx     ← detail with all attempts
    revision/page.tsx   ← swipe deck
    analytics/page.tsx  ← heatmap + bottleneck
  api/
    ai-mentor/route.ts
    problems/fetch-meta/route.ts
```

### Data Model

```
auth.users
    │
    ├── problems (1:many)
    │       │
    │       ├── attempts (1:many)
    │       │       └── cognitive_scores (1:1 per attempt)
    │       │
    │       └── revisions (1:1, updated after each attempt)
    │
    └── daily_goals (1 per day)
```

**SM-2 Spaced Repetition logic lives in the DB as a PostgreSQL function.** After each attempt, a trigger calls `calculate_sm2()` and updates the revision row.

### Design Identity

Not a SaaS template. Inspired by Linear, Raycast, Vercel dark mode.

- **Dark by default.** No light mode. You code at night.
- **Pattern color system.** Every DSA pattern has a canonical color used everywhere — card borders, badges, chart fills, filter pills. Builds visual memory.
- **Density varies by screen.** Dashboard is scannable. Problem entry is focused, distraction-free.
- **Micro-animations.** Page transitions slide in. Cards lift on hover. Revision swipe has spring physics.
- **Mobile gestures.** Swipe right = done (green). Swipe left = skip (gray). Tap = expand.

### Pattern Color System (canonical, use everywhere)

```typescript
// lib/utils/patterns.ts — these colors are the design language
export const PATTERNS = [
  { id: 'arrays',          name: 'Arrays',              color: '#3B82F6', bg: '#1D3461' },
  { id: 'strings',         name: 'Strings',             color: '#8B5CF6', bg: '#2D1B69' },
  { id: 'hashmap',         name: 'HashMap',             color: '#06B6D4', bg: '#0C3B4A' },
  { id: 'two-pointers',    name: 'Two Pointers',        color: '#10B981', bg: '#0A3728' },
  { id: 'sliding-window',  name: 'Sliding Window',      color: '#F59E0B', bg: '#3D2B08' },
  { id: 'binary-search',   name: 'Binary Search',       color: '#EF4444', bg: '#3D1515' },
  { id: 'trees',           name: 'Trees',               color: '#84CC16', bg: '#233409' },
  { id: 'graphs',          name: 'Graphs',              color: '#F97316', bg: '#3D1E08' },
  { id: 'dp',              name: 'Dynamic Programming', color: '#A855F7', bg: '#2D1455' },
  { id: 'backtracking',    name: 'Backtracking',        color: '#EC4899', bg: '#3D1030' },
  { id: 'greedy',          name: 'Greedy',              color: '#14B8A6', bg: '#0A3330' },
  { id: 'heap',            name: 'Heap / Priority Queue', color: '#6366F1', bg: '#1E1B55' },
] as const
```

---

## MASTER CONTEXT BLOCK
*Paste this at the top of every new Claude Code session before your prompt.*

```
PROJECT: DSA OS — personal DSA learning system for a CS engineering student.
PURPOSE: Track thinking quality (not just completions) across DSA problems. Problem journal + spaced repetition + AI mentor.
STACK: Next.js 15 App Router + TypeScript strict, Tailwind CSS v3, shadcn/ui, Supabase (Auth + PostgreSQL), Framer Motion, Zustand, @uiw/react-codemirror, Recharts, Gemini 1.5 Flash API (free)
DESIGN: Dark-first premium mobile PWA. NOT a generic SaaS template. Think Linear/Raycast dark mode aesthetic.
NAVIGATION: Mobile (<768px) = bottom tab bar with 5 tabs. Desktop (≥768px) = left sidebar.
PATTERN COLORS (use exactly these, consistently everywhere):
  arrays=#3B82F6 strings=#8B5CF6 hashmap=#06B6D4 two-pointers=#10B981 sliding-window=#F59E0B
  binary-search=#EF4444 trees=#84CC16 graphs=#F97316 dp=#A855F7 backtracking=#EC4899
  greedy=#14B8A6 heap=#6366F1
CONSTRAINTS: Zero paid services. Single user personal app. All Supabase queries use server components where possible.
```

---

## Prompt 1 — Project Init + Design System

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Initialize the DSA OS project with a premium dark design system.

STEP 1: Create the project
  npx create-next-app@latest dsa-os --typescript --tailwind --eslint --app --import-alias="@/*"
  cd dsa-os
  npx shadcn@latest init

When shadcn init asks:
  - Style: Default
  - Base color: Slate
  - CSS variables: Yes

STEP 2: Install all dependencies
  npm install @supabase/supabase-js @supabase/ssr framer-motion zustand recharts date-fns
  npm install @uiw/react-codemirror @codemirror/lang-javascript @codemirror/lang-java @codemirror/lang-cpp @codemirror/lang-python @codemirror/theme-one-dark
  npm install next-pwa lucide-react clsx tailwind-merge
  npx shadcn@latest add button input label textarea badge card separator skeleton tabs progress

STEP 3: Create the full folder structure
  mkdir -p app/{auth}/{login,signup} app/{app}/{dashboard,revision,analytics}
  mkdir -p "app/{app}/problems/new" "app/{app}/problems/[id]"
  mkdir -p app/api/ai-mentor "app/api/problems/fetch-meta"
  mkdir -p components/{layout,problems,dashboard,analytics,revision,ai}
  mkdir -p lib/{supabase,ai,utils,hooks} store types supabase/migrations

STEP 4: Replace app/globals.css entirely with this design system:

  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --background: 222 14% 6%;
    --foreground: 210 20% 96%;
    --card: 220 13% 9%;
    --card-foreground: 210 20% 96%;
    --popover: 220 13% 9%;
    --popover-foreground: 210 20% 96%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 13% 13%;
    --secondary-foreground: 210 10% 65%;
    --muted: 220 13% 13%;
    --muted-foreground: 215 10% 45%;
    --accent: 220 13% 16%;
    --accent-foreground: 210 20% 96%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 10% 18%;
    --input: 220 10% 18%;
    --ring: 239 84% 67%;
    --radius: 0.75rem;
    --success: 142 76% 50%;
    --warning: 38 92% 50%;
    --danger: 0 72% 51%;
  }

  * { border-color: hsl(var(--border)); box-sizing: border-box; }
  body {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 2px; }

STEP 5: Replace tailwind.config.ts with a config that:
  - Extends colors with pattern colors (see master context above), each as named tokens
  - Adds custom animations: shimmer (loading), slide-up (page entry), fade-in, scale-in
  - Sets font family: sans = Inter, mono = JetBrains Mono
  - Darkens shadcn slate tokens to match our dark theme

STEP 6: Create lib/utils/patterns.ts
  Export the PATTERNS array (12 patterns with id, name, color, bg as shown in architecture section).
  Also export helper: getPatternById(id: string), getPatternColor(id: string).

STEP 7: Create types/app.ts
  Define and export TypeScript interfaces:
  - Problem: matches problems table
  - Attempt: matches attempts table
  - CognitiveScore: matches cognitive_scores table
  - Revision: matches revisions table, includes problem (Problem) nested
  - DailyGoal: matches daily_goals table
  - PatternStats: { patternId, name, color, totalSolved, avgTime, avgConfidence }
  - BottleneckData: { stage: string, avgScore: number, label: string }

STEP 8: Create .env.local with placeholder values:
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  GEMINI_API_KEY=your_gemini_key

STEP 9: Create next.config.ts that:
  - Wraps with next-pwa({ dest: 'public', disable: process.env.NODE_ENV === 'development' })
  - Sets images.remotePatterns for leetcode.com
  - Adds security headers

STEP 10: Create public/manifest.json for PWA:
  name: "DSA OS"
  short_name: "DSA OS"
  theme_color: "#0D0D10"
  background_color: "#0D0D10"
  display: "standalone"
  orientation: "portrait"
  icons: 192x192 and 512x512 (use placeholder paths for now)

Verify: npm run dev loads at localhost:3000 with the dark background (#0D0D10 approx). No TypeScript errors.
```

---

## Prompt 2 — Supabase Database Schema

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Create the complete Supabase database schema. Write this to supabase/migrations/001_initial.sql.
Give me the COMPLETE SQL — no truncation, no "...rest follows the same pattern".

The file must contain in order:

1. Enable uuid-ossp extension.

2. CREATE TABLE problems:
   id uuid PK gen_random_uuid()
   user_id uuid NOT NULL → auth.users ON DELETE CASCADE
   platform text NOT NULL DEFAULT 'leetcode' CHECK IN ('leetcode','gfg','iit','custom','striver','codeforces')
   problem_number integer
   title text NOT NULL
   url text
   topic text NOT NULL
   pattern text[] NOT NULL DEFAULT '{}'
   difficulty text NOT NULL CHECK IN ('easy','medium','hard')
   source text DEFAULT 'custom'
   notes text
   created_at timestamptz DEFAULT now()
   updated_at timestamptz DEFAULT now()

3. CREATE TABLE attempts:
   id uuid PK gen_random_uuid()
   problem_id uuid NOT NULL → problems ON DELETE CASCADE
   user_id uuid NOT NULL → auth.users ON DELETE CASCADE
   solved boolean NOT NULL DEFAULT false
   hint_used boolean DEFAULT false
   time_taken_minutes integer
   language text DEFAULT 'python' CHECK IN ('python','java','cpp','javascript','typescript')
   first_observation text
   algorithm_text text
   code text
   mistakes_made text
   final_takeaway text
   created_at timestamptz DEFAULT now()

4. CREATE TABLE cognitive_scores:
   id uuid PK gen_random_uuid()
   attempt_id uuid NOT NULL → attempts ON DELETE CASCADE
   user_id uuid NOT NULL → auth.users ON DELETE CASCADE
   understanding_score integer NOT NULL CHECK BETWEEN 1 AND 5
   pattern_score integer NOT NULL CHECK BETWEEN 1 AND 5
   algorithm_score integer NOT NULL CHECK BETWEEN 1 AND 5
   coding_score integer NOT NULL CHECK BETWEEN 1 AND 5
   no_hints_score integer NOT NULL CHECK BETWEEN 1 AND 5
   overall_score numeric GENERATED ALWAYS AS (
     round((understanding_score + pattern_score + algorithm_score + coding_score + no_hints_score) / 5.0, 1)
   ) STORED
   created_at timestamptz DEFAULT now()

5. CREATE TABLE revisions:
   id uuid PK gen_random_uuid()
   problem_id uuid NOT NULL → problems ON DELETE CASCADE
   user_id uuid NOT NULL → auth.users ON DELETE CASCADE
   due_date date NOT NULL DEFAULT CURRENT_DATE + 1
   status text DEFAULT 'pending' CHECK IN ('pending','done','skipped')
   mastery_level text DEFAULT 'new' CHECK IN ('new','learning','reviewing','mastered','copied')
   interval_days integer DEFAULT 1
   ease_factor numeric DEFAULT 2.5
   repetitions integer DEFAULT 0
   last_reviewed_at timestamptz
   created_at timestamptz DEFAULT now()

6. CREATE TABLE daily_goals:
   id uuid PK gen_random_uuid()
   user_id uuid NOT NULL → auth.users ON DELETE CASCADE
   date date NOT NULL
   target_count integer DEFAULT 5
   completed_count integer DEFAULT 0
   streak_day integer DEFAULT 1
   UNIQUE (user_id, date)

7. ROW LEVEL SECURITY — enable on ALL 5 tables.
   For each table add:
   - SELECT policy: user_id = auth.uid()
   - INSERT policy: user_id = auth.uid()
   - UPDATE policy: user_id = auth.uid()
   - DELETE policy: user_id = auth.uid()

8. INDEXES:
   problems: (user_id), (user_id, difficulty), (user_id, created_at DESC)
   attempts: (problem_id), (user_id, created_at DESC)
   cognitive_scores: (attempt_id)
   revisions: (user_id, due_date), (user_id, status)
   daily_goals: (user_id, date DESC)

9. FUNCTION calculate_sm2(p_ease_factor numeric, p_repetitions int, p_quality int)
   Returns TABLE(next_interval int, new_ease_factor numeric, new_repetitions int)
   Implement the standard SM-2 algorithm:
     if quality < 3: reset (interval=1, repetitions=0, ease unchanged)
     if quality >= 3:
       if repetitions=0: interval=1
       elif repetitions=1: interval=6
       else: interval = round(prev_interval * ease_factor)
       new_ease = ease_factor + (0.1 - (5-quality)*(0.08 + (5-quality)*0.02))
       clamp new_ease to minimum 1.3
       repetitions += 1
   Map overall_score (1.0-5.0) to quality (0-5) linearly.

10. TRIGGER: update_updated_at_problems
    BEFORE UPDATE on problems → set updated_at = now()

11. TRIGGER: auto_schedule_revision
    AFTER INSERT on attempts FOR EACH ROW WHEN (NEW.solved = true)
    If no revision exists for this problem+user, INSERT into revisions with due_date = CURRENT_DATE + 1.
    If revision exists, call calculate_sm2 with the attempt's overall_score and update the revision row.

12. TRIGGER: track_daily_goal
    AFTER INSERT on attempts FOR EACH ROW WHEN (NEW.solved = true)
    Upsert into daily_goals (user_id, CURRENT_DATE): increment completed_count by 1.
    Compute streak_day: count consecutive days where completed_count > 0 going back from today.

Also create supabase/seed.sql:
  CREATE TABLE IF NOT EXISTS pattern_definitions (
    id text PRIMARY KEY,
    name text,
    color_hex text,
    bg_hex text,
    description text,
    example_lc_numbers integer[]
  );
  Insert all 12 patterns from the PATTERNS constant in architecture section.
  Add 5 sample problems for 'arrays' pattern with difficulty='easy' for testing.
  Make sure seed inserts are idempotent (ON CONFLICT DO NOTHING).

Also create supabase/README.md explaining:
  1. How to apply the migration: paste into Supabase SQL editor
  2. How to apply seed: paste seed.sql after migration
  3. How to get the project URL and anon key (Dashboard → Settings → API)
  4. Note that SUPABASE_SERVICE_ROLE_KEY is only for server-side routes
```

---

## Prompt 3 — Supabase Client + Auth + App Shell

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Database schema is done. Now set up Supabase auth integration and the app shell layout.

PART A: Supabase Client Setup

1. lib/supabase/client.ts — browser client (use createBrowserClient from @supabase/ssr)
2. lib/supabase/server.ts — server client (use createServerClient from @supabase/ssr, read cookies)
3. middleware.ts (root level) — refresh session on every request, redirect /app/* to /login if no session, redirect / to /dashboard if session exists

PART B: Auth Pages

Create app/(auth)/layout.tsx:
  Full-screen centered layout. Background: hsl(var(--background)).
  Show the DSA OS logo (text logo: "DSA OS" in indigo, monospace font, 24px) top center.
  No sidebar, no nav. Clean.

Create app/(auth)/login/page.tsx:
  Card (max-width 400px, centered vertically and horizontally).
  Title: "Welcome back"
  Subtitle: "Continue your DSA journey"
  Email + password inputs (shadcn Input).
  "Sign in" button (full width, primary color).
  Google OAuth button with Google icon.
  "Don't have an account? Sign up" link.
  On success: redirect to /dashboard.
  Show error states inline (not toast, inline red text under the field).
  Use server action for form submission.

Create app/(auth)/signup/page.tsx:
  Same card layout.
  Email + password + confirm password.
  On success: show "Check your email" confirmation view (no redirect).

PART C: App Shell

Create components/layout/app-shell.tsx:
  Client component that wraps all (app) pages.
  On mobile (<768px): renders TopBar + page content + BottomNav
  On desktop (≥768px): renders Sidebar + page content (no bottom nav, no top bar)
  Use framer-motion AnimatePresence for page transitions (slide-up on enter, fade on exit, 200ms).

Create components/layout/top-bar.tsx (mobile only):
  Height: 52px. Background: hsl(var(--card)). Border bottom: 1px hsl(var(--border)).
  Left: back button (if not root page) OR hamburger (never needed actually, skip it)
  Center: page title (passed as prop)
  Right: optional action slot (passed as ReactNode)
  Sticky top-0. z-index: 50.

Create components/layout/bottom-nav.tsx (mobile only):
  Fixed bottom-0. Height: 64px + safe-area-inset-bottom padding.
  Background: hsl(var(--card)) with backdrop-blur.
  Border top: 1px hsl(var(--border)).
  5 tabs in order: Home (ti-home), Problems (ti-list), + (center FAB), Revision (ti-refresh), Stats (ti-chart-bar).
  Center FAB (the + button):
    - Circular, 56px diameter
    - Background: hsl(var(--primary)) = indigo
    - Positioned -16px above the nav bar (elevated)
    - On press: navigate to /problems/new
    - Scale animation on press (0.95 scale, spring)
  Active tab: icon fills indigo, 11px label appears below icon.
  Inactive tab: icon stroke gray, no label.
  Use usePathname() to determine active tab.

Create components/layout/sidebar.tsx (desktop only):
  Width: 240px. Fixed left. Full height.
  Background: hsl(var(--card)). Border right: 1px hsl(var(--border)).
  Top section: "DSA OS" logo + user email.
  Nav items (with icons): Dashboard, Problems, Revision Queue, Analytics.
  Bottom section: Settings link, streak counter (compact).
  Active item: indigo background at 15% opacity, indigo text, indigo left border 3px.

Create app/(app)/layout.tsx:
  Server component that:
    1. Gets session from Supabase server client
    2. Redirects to /login if no session
    3. Wraps children in <AppShell>

Routing:
  app/(app)/page.tsx: redirect('/dashboard')
  app/(app)/dashboard/page.tsx: placeholder page with title "Dashboard"
  app/(app)/problems/page.tsx: placeholder
  app/(app)/revision/page.tsx: placeholder
  app/(app)/analytics/page.tsx: placeholder

After this prompt: Auth should work end-to-end. Login → see dashboard shell → bottom nav on mobile, sidebar on desktop. All pages have the layout. Page transitions animate.
```

---

## Prompt 4 — Dashboard Page

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Auth and layout are working. Build the Dashboard page with real Supabase data.

File: app/(app)/dashboard/page.tsx — server component, fetches data server-side.

DATA TO FETCH (all filtered to current user):
  1. today's daily_goal row (or null if no problems solved today)
  2. streak_day from the most recent daily_goals row
  3. revisions where status='pending' AND due_date <= today, ordered by due_date ASC, limit 5
  4. recent attempts (last 5) joined with problems
  5. pattern stats: for each pattern in problems solved, avg overall_score from cognitive_scores

LAYOUT (mobile-first):

Section 1 — Header greeting:
  "Good morning, Sanjay 👋" (use current hour to pick greeting)
  Subtitle: today's date in "Friday, 13 Jun" format

Section 2 — Stats row (4 metric cards in a 2x2 grid on mobile, 4-col row on desktop):
  Card 1: Current Streak — number + flame icon, indigo accent
  Card 2: Today's Progress — "X / 5" problems, small progress bar below
  Card 3: Total Solved — total count from problems table
  Card 4: Revision Due — count of pending revisions due today/overdue

Each card: hsl(var(--card)) background, border, border-radius-lg, padding 1rem.
  Numbers in 28px font-weight-500. Labels in 12px muted color.
  If streak >= 7: flame icon in amber. If streak = 0: gray.

Section 3 — Revision Queue Preview:
  Title row: "Due for revision" + "See all →" link to /revision
  If 0 revisions due: empty state ("You're all caught up! 🎉", muted text)
  If revisions exist: show up to 3 revision cards.
  
  Each revision card (horizontal):
    Left: 3px border in pattern color (from problem's pattern[0])
    Pattern badge (small, colored pill)
    Problem title (14px, truncated)
    Right: mastery level badge (new=gray, learning=blue, reviewing=amber, mastered=green)
    Due date: "Today" / "2 days overdue" in red if overdue
    Tap → navigate to /problems/[id]

Section 4 — Pattern Confidence Grid:
  Title: "Pattern confidence"
  Grid of pattern pills (2 per row on mobile, 4 per row on desktop):
    Each pill: pattern color background (15% opacity), colored text, colored left dot
    Shows pattern name + confidence % (avg overall_score / 5 * 100)
    If no data for a pattern: show it grayed out with "—"
  Only show patterns that appear in at least 1 solved problem.

Section 5 — Recent Activity:
  Title: "Recent solves"
  Last 5 problems attempted, compact list:
    Difficulty badge (easy=green, medium=amber, hard=red dot)
    Problem title
    Time: "2 hrs ago" / "Yesterday" using date-fns formatDistance
    Cognitive score: small ring or bar showing overall_score/5

BEHAVIOR:
  All data fetched server-side. No loading spinners on initial load.
  Wrap the entire page in a div with padding-bottom: 80px (for bottom nav on mobile).
  Add framer-motion variants to animate each section in on mount (stagger 0.1s each).

Create components/dashboard/stats-row.tsx (client, receives data as props).
Create components/dashboard/revision-queue-preview.tsx (client, receives revisions as props).
Create components/dashboard/pattern-grid.tsx (client, receives patternStats as props).
```

---

## Prompt 5 — New Problem Entry Form (The Core Screen)

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

This is the most important screen. Build it right. 3-step form on a dedicated full-screen page.

File: app/(app)/problems/new/page.tsx — client component (form state), server action for submit.

STEP INDICATOR:
  3 steps shown as numbered dots at the top: ① Problem Info → ② Your Approach → ③ Reflection
  Active step: indigo filled circle + indigo connecting line.
  Past steps: check icon + full line. Future: gray circle + gray line.
  Sticky top (below the TopBar on mobile). White text labels hidden on mobile, shown on desktop.

STEP 1 — Problem Info:
  Field 1: Platform selector (4 pill buttons, single select): LeetCode · GFG · IIT · Custom
    Default: LeetCode. Active pill: indigo bg, white text. Inactive: secondary bg.
  
  Field 2: Problem URL (text input, full width)
    Placeholder: "https://leetcode.com/problems/..."
    On paste/blur: auto-fetch metadata via /api/problems/fetch-meta?url=...
    Show loading spinner inside the input while fetching.
    On success: auto-fill title + problem_number fields below.
  
  Field 3: Problem Number (auto-filled or manual, small input, 120px wide)
  Field 4: Title (text input, auto-filled or manual, full width)
  
  Field 5: Difficulty (3 buttons, single select):
    Easy (green) · Medium (amber) · Hard (red)
    Selected: filled bg. Unselected: border only.
  
  Field 6: Pattern (multi-select grid):
    Show all 12 patterns as pills in a 2-column grid on mobile.
    Each pill: pattern color border, pattern name.
    Selected: fill with pattern bg color, text in pattern color.
    Up to 3 patterns selectable.
  
  Field 7: Topic (text input with datalist suggestions): Arrays, Strings, Trees, Graphs, DP, etc.
  
  "Next →" button: full width, sticky bottom on mobile (above safe area). Disabled until title + difficulty + 1 pattern selected.

STEP 2 — Your Approach:
  "Write before you code. Seriously." — small muted instruction text.
  
  Field 1: First Observation (textarea, 3 rows)
    Label: "What did you notice immediately?"
    Placeholder: "The array is sorted. There are duplicates adjacent..."
    Character counter bottom-right.
  
  Field 2: Algorithm (textarea, 5 rows, resizable)
    Label: "Algorithm in plain English (no code)"
    Placeholder: "Read pointer explores. Write pointer maintains the unique region. Move write pointer only when..."
    This is the most important field. Make the textarea stand out — slightly brighter bg, indigo focus ring.
  
  Field 3: Language selector (4 pills: Python · Java · C++ · JavaScript)
  
  Field 4: Code Editor
    Use @uiw/react-codemirror with:
      - oneDark theme (already installed)
      - Language extension based on selected language above
      - Min height: 200px on mobile, 300px on desktop
      - lineNumbers: true
      - placeholder: "// Paste or type your solution here"
    The editor should feel premium — not a textarea.
  
  Time tracking: small timer in top-right of this step, starts when step 2 renders, records time_taken_minutes.
  
  "← Back" (ghost) + "Next →" (primary) button row. Sticky bottom.

STEP 3 — Reflection (the honest part):

  Field 1: Solved without hints? (toggle, yes/no)
  
  Field 2: Mistakes Made (multi-select checkboxes, 2-column grid):
    □ Couldn't identify pattern
    □ Algorithm logic was wrong
    □ Pointer/index mistakes
    □ Edge cases missed
    □ Wrong data structure
    □ Syntax / runtime errors
    □ TLE / optimization missed
    □ Just copied solution
  
  Field 3: Final Takeaway (textarea, 3 rows)
    Label: "One thing to remember about this problem"
    Placeholder: "Separate reading from writing. The write pointer only advances when..."
  
  Field 4: Cognitive Score Sliders (THE KEY FEATURE)
    5 sliders, each labeled:
      "Understood the problem"
      "Identified the correct pattern"
      "Wrote clean algorithm before coding"
      "Converted algorithm to code cleanly"
      "Solved without hints / reading editorial"
    Each slider: 1–5 range, step 1.
    Visual: custom styled range input. Below each slider: star display (★★★☆☆) + numeric label.
    Colors: 1-2 = red, 3 = amber, 4-5 = green.
    Overall score shown at bottom: avg of 5 scores, large number with colored circle.
  
  "Save Problem" button (full width, primary, large).
  Below it: small muted text "This problem + your thinking will be saved and scheduled for revision."

SERVER ACTION — app/actions/problems.ts:
  createProblem(formData):
    1. Insert into problems table
    2. Insert into attempts table with problem_id
    3. Insert into cognitive_scores table with attempt_id
    4. The DB trigger will auto-create revision row
    5. Redirect to /problems/[id] on success

API ROUTE — app/api/problems/fetch-meta/route.ts:
  GET ?url=...
  For LeetCode URLs: extract problem slug from URL, fetch the title using LC's public GraphQL endpoint:
    POST https://leetcode.com/graphql with query: { question(titleSlug: "...") { questionId title difficulty } }
  Return: { title, problem_number, difficulty }
  Add a 5s timeout. On failure: return { error: "Could not fetch" } — user fills manually.

Create components/problems/cognitive-sliders.tsx as a separate client component.
Create components/problems/code-editor.tsx as a dynamic import (no SSR) component.

After this prompt: The core loop works. You can enter a problem, write your algorithm, paste code, rate yourself, and save. This alone makes the app valuable.
```

---

## Prompt 6 — Problem List + Detail View

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Build the problems browser and detail view.

FILE 1: app/(app)/problems/page.tsx (server component for initial data, client interactivity)

LAYOUT:
  Top: Search bar (full width, magnifier icon inside, clear button appears when typing)
  Below search: Filter pills row (horizontal scroll, no wrap):
    All · Easy · Medium · Hard | then pattern pills (all 12)
    Active filter: filled. Tap to toggle. Multiple selects allowed.
  Sort selector (right side): "Newest · Oldest · Hardest · Confidence ↑ · Confidence ↓"
  
  Problem list (below filters):
    Each problem is a CARD:
      Left border: 3px solid [primary pattern color]
      Top row: title (bold, 15px) + difficulty badge (small, colored dot + text)
      Second row: pattern pills (colored, compact, max 2 shown + "+1" if more)
      Bottom row: last solved date (muted, 12px) + overall confidence score (colored number, right-aligned)
      Tap: navigate to /problems/[id]
      Long press (mobile) / hover (desktop): show quick action menu (Edit, Delete, Add Attempt)
    
    Empty state (no problems yet): 
      Large icon, "Start your journey"
      "Add your first problem →" button → /problems/new
    
    Empty state (no results for filter):
      "No problems match this filter", "Clear filters" link

  Fetch: server-side with filter/sort params from searchParams. Client-side updates on filter change using router.replace.

FILE 2: app/(app)/problems/[id]/page.tsx (server component)

Fetch: problem + all attempts + cognitive_scores + revision status.

LAYOUT:

Header section:
  Problem number + title (large, 20px)
  Row: platform badge + difficulty badge + pattern badges
  Row: LeetCode link (external), "Add attempt" button

Revision status banner (if revision exists):
  If mastered: green banner "✓ Mastered"
  If due today: amber banner "⏰ Due for revision today"
  If overdue: red banner "⚠ X days overdue"
  Mastery level selector: new → learning → reviewing → mastered → copied (horizontal step pills, tappable to manually override)

Tabs (if multiple attempts): "Latest" | "All attempts (N)"

ATTEMPT DISPLAY (for each attempt, most recent first):

  Section: Your Thinking
    Label + text for: First Observation, Algorithm (styled with a code-like monospace box), Final Takeaway
  
  Section: Code
    @uiw/react-codemirror viewer (readOnly: true, oneDark theme)
    Language label + "Copy" button in top-right corner of the editor
  
  Section: Cognitive Scores
    Horizontal bar chart (custom, no library needed — CSS widths):
      5 rows: Understood Problem | Pattern ID | Algorithm | Coding | No Hints
      Each row: label (left, 140px) + colored bar + score number (right)
      Bar color: score 1-2=red, 3=amber, 4-5=green
      Overall score: big number, colored circle background

  Section: Mistakes (if any checked): bulleted list of selected mistake labels
  
  Section: Attempt metadata:
    Date solved, time taken, language used, hint used indicator

"Add new attempt" FAB (bottom-right on desktop, or a button in header on mobile)
→ navigates to the same multi-step form pre-filled with problem data

Create lib/hooks/use-problems.ts for any client-side state needed.
```

---

## Prompt 7 — Revision System

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Build the spaced repetition revision system. This should feel like a polished mobile experience.

FILE: app/(app)/revision/page.tsx (server component, fetches due revisions)

Fetch:
  - revisions WHERE status='pending' AND due_date <= today AND user_id = auth.uid()
  - JOIN problems table to get title, pattern, difficulty
  - JOIN cognitive_scores (latest attempt) to get last overall_score
  - ORDER BY due_date ASC (oldest due first)

If 0 revisions: full-screen empty state
  Large check icon (green), "All caught up for today!"
  "Next revision: [date of next pending revision]"
  "Go solve something new →" button to /problems/new

If revisions exist: render <SwipeDeck> client component

Create components/revision/swipe-deck.tsx (CLIENT component):

Props: revisions: RevisionWithProblem[]

STATE:
  - currentIndex: number
  - swipeDirection: 'left' | 'right' | null
  - completed: revision ids marked done

CARD DESIGN (each revision card, full-screen height minus nav):
  Background: hsl(var(--card))
  Top-left: pattern badge (colored)
  Top-right: "X of Y remaining" counter (small, muted)
  
  Center section:
    Difficulty badge
    Problem title (large, 22px, bold, centered)
    Platform + problem number (muted, small)
    
    Mastery level: horizontal pills showing current level (new/learning/reviewing/mastered)
    
  Collapsed section (tap to expand):
    "Your last algorithm" — shows algorithm_text from latest attempt
    "Your last code" — shows code in CodeMirror read-only viewer, collapsed by default
    
  Bottom section:
    Last solved: "3 days ago"
    Cognitive score from last attempt: star display

SWIPE INTERACTION:
  Use framer-motion drag gesture (dragConstraints, onDragEnd).
  Swipe RIGHT (x > 80px): mark revision done
    - Card flies right with green tint
    - Green checkmark animates in
    - Next card slides up from below
    - Call updateRevision(id, 'done') server action
  
  Swipe LEFT (x < -80px): skip for now
    - Card flies left with gray tint  
    - Next card
    - Call updateRevision(id, 'skipped') — does NOT advance SM-2, just snoozes 1 day
  
  BUTTONS below the card (fallback for desktop / users who don't swipe):
    "Skip today" (ghost, left) + "Mark done" (primary green, right)
  
  HINT: show small swipe arrows fading in after 2s on first card (first-time guidance)
  
  Progress bar at very top: completed/total, animated fill

SERVER ACTIONS — app/actions/revisions.ts:
  markRevisionDone(revisionId: string, qualityScore?: number):
    If qualityScore provided: call calculate_sm2 and update interval, ease_factor, repetitions, due_date
    Else: set status='done', interval stays default
    Update mastery_level based on repetitions count:
      repetitions 0-1: 'learning', 2-3: 'reviewing', 4+: 'mastered'
  
  skipRevision(revisionId: string):
    Update due_date = today + 1, status stays 'pending'

After revision session (all cards swiped):
  Show completion screen:
    "Session complete! ✓"
    Show stats: X done, Y skipped
    Pattern breakdown of what was reviewed
    "Back to dashboard" button

Create lib/utils/sm2.ts — TypeScript implementation of SM-2 algorithm (mirrors the SQL function, used for client-side preview of next due date).
```

---

## Prompt 8 — Analytics Dashboard

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Build the analytics page. This is where patterns in the user's cognition become visible.

FILE: app/(app)/analytics/page.tsx (server component, heavy data aggregation)

All queries are for current authenticated user only. Do all aggregation in SQL via Supabase RPC or via JS after fetching raw data.

DATA TO COMPUTE:

1. pattern_stats (array): for each pattern in user's problems:
   - totalSolved: count of problems with solved attempt
   - avgConfidence: avg overall_score from cognitive_scores
   - avgTimeMins: avg time_taken_minutes from attempts
   - trend: compare last 5 vs first 5 attempts (improving/declining)

2. cognitive_breakdown (5 values):
   - avg understanding_score across all cognitive_scores
   - avg pattern_score
   - avg algorithm_score
   - avg coding_score
   - avg no_hints_score

3. bottleneck: lowest average of the 5 above scores → the user's weakest step

4. difficulty_distribution: { easy: N, medium: N, hard: N }

5. solve_trend: last 30 days, count solves per day → sparkline data

6. mastery_distribution: count by mastery_level across revisions

LAYOUT (all sections stacked, no tabs):

SECTION 1 — Headline Insight (the "smart" section):
  Auto-generated insight card based on data:
  Example: "You understand problems well (avg 4.2/5) but struggle to convert algorithms to code (avg 2.8/5). Focus next: dry-run practice."
  Generate this insight in a lib/utils/analytics.ts function generateInsight(cognitiveBreakdown).
  Card: indigo left border, slightly lighter background, insight text in 15px.

SECTION 2 — Pattern Confidence Grid:
  Title: "Patterns"
  Each pattern the user has attempted gets a card:
    Pattern color left border (3px)
    Pattern name + colored badge
    Large confidence number (e.g. "84%") in pattern color
    Sub-row: "N solved · avg Xmin"
    Bottom: mini trend bar (5 segments, colored by recent confidence vs old)
  Grid: 1-column on mobile, 2-column on desktop.
  Patterns with 0 attempts: shown at the bottom, grayed out, "Not started"
  Sort: by confidence descending (weakest patterns float to top when sorted "Weakest first")
  Toggle button: "Strongest first ↔ Weakest first"

SECTION 3 — Cognitive Score Breakdown:
  Title: "Where you struggle"
  5-row horizontal bar chart (custom CSS, not a library):
    Each row: stage label (left, fixed 160px) + colored bar (fills % of max 5.0) + score number
    Colors: same as form (1-2 red, 3 amber, 4-5 green)
    The lowest-scoring bar has a pulsing amber dot next to it labeled "Bottleneck"
  
  Below bars: bottleneck recommendation card
    E.g. "Your pattern recognition (2.8/5) is your bottleneck. When you see a problem, spend 2 minutes writing the pattern name before touching code."
    Colored amber, icon, text.

SECTION 4 — Solve Trend (last 30 days):
  Use Recharts BarChart.
  X axis: last 30 days (show only every 5th date label).
  Y axis: number of problems solved.
  Bar fill: indigo primary.
  Tooltip: "Jun 13 — 5 problems solved"
  No grid lines (just the bars). Height: 160px. Minimal styling.
  If no data: show "Start solving to see your trend" message.

SECTION 5 — Difficulty Breakdown:
  3 stat cards (horizontal): Easy (green) · Medium (amber) · Hard (red)
  Each: number large + "solved" label.

SECTION 6 — Mastery Distribution:
  Simple 5-segment bar (CSS flex):
    new=gray, learning=blue, reviewing=amber, mastered=green, copied=red
  Legend below showing N problems per level.
  Title: "Revision progress across all problems"

Create lib/utils/analytics.ts:
  - generateInsight(data: CognitiveBreakdown): string
  - computeBottleneck(data: CognitiveBreakdown): { stage: string, avg: number, recommendation: string }
  - computePatternTrend(attempts: Attempt[]): 'improving' | 'declining' | 'stable'

Use Recharts only for the trend chart. Everything else is CSS.
```

---

## Prompt 9 — AI Mentor (Gemini Flash Integration)

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Build the AI Mentor feature using Gemini 1.5 Flash (free tier, aistudio.google.com).

FILE: app/api/ai-mentor/route.ts (POST, streaming)

Request body:
  {
    problemTitle: string,
    problemUrl: string,
    patterns: string[],
    difficulty: string,
    algorithmText: string,    // user's English algorithm
    code: string,             // user's code
    language: string,
    cognitiveScores: {
      understanding: number,
      pattern: number,
      algorithm: number,
      coding: number,
      noHints: number
    },
    mistakesMade: string[]
  }

SYSTEM PROMPT (exact, do not change):
  "You are a senior DSA mentor reviewing a student's problem-solving approach. Your role is Socratic — guide thinking, never give away answers.

  RULES:
  1. Start with what the student did CORRECTLY. Be specific and genuine.
  2. Identify the single most important gap in their approach.
  3. Ask ONE Socratic question that guides them toward the insight they're missing.
  4. If their algorithm_text shows good thinking but code is wrong, focus on the implementation gap specifically.
  5. If cognitive scores show pattern recognition is weak (< 3), focus on pattern identification.
  6. Suggest exactly 2 related problems to practice next (mention problem names only, not solutions).
  7. Keep the entire response under 250 words.
  8. Format: use 3 sections with labels: ✓ What you got right | ⚡ Where to focus | → Try next"

USER PROMPT template:
  "Problem: {title} ({difficulty})
   Pattern: {patterns.join(', ')}
   
   Student's algorithm (in English):
   {algorithmText}
   
   Student's code ({language}):
   {code}
   
   Self-assessment scores: Understanding={u}/5, Pattern={p}/5, Algorithm={a}/5, Coding={c}/5, No-hints={n}/5
   Mistakes they flagged: {mistakesMade.join(', ')}"

Gemini API call:
  POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key={GEMINI_API_KEY}
  Headers: Content-Type: application/json
  Body: { contents: [{ role: 'user', parts: [{ text: fullPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { maxOutputTokens: 400, temperature: 0.7 } }
  
  Stream the response back to the client using ReadableStream.
  Handle Gemini's chunk format: parse each chunk's candidates[0].content.parts[0].text.

FILE: components/ai/mentor-panel.tsx (client component)

This panel appears on the problem detail page (/problems/[id]) as a slide-up panel (bottom sheet on mobile, right panel on desktop).

States: idle | loading | streaming | done | error

IDLE state:
  Button: "Get AI Review" (indigo, with sparkle icon)
  Small note: "Powered by Gemini Flash · Free"

LOADING state:
  3 skeleton lines (shimmer animation), label "Analyzing your approach..."

STREAMING state:
  Show text as it streams in — character by character using a typed text effect.
  3 sections (✓ / ⚡ / →) color-coded:
    ✓ section: green left border
    ⚡ section: amber left border
    → section: indigo left border

DONE state:
  Full response visible.
  Below: "This helped" 👍 / "Not helpful" 👎 buttons (just UI, no tracking needed for V1).
  "Analyze again" ghost button.

ERROR state (API failed, quota hit):
  "Couldn't reach AI mentor. Check your Gemini API key in .env.local"
  Friendly, not alarming.

Add the mentor panel to app/(app)/problems/[id]/page.tsx:
  On mobile: floating button bottom-right "✦ Review" → triggers slide-up bottom sheet
  On desktop: sticky right column (240px) showing the panel always visible

Create lib/ai/gemini.ts:
  Export async function streamMentorReview(payload): ReadableStream
  Handles the fetch + streaming
  Includes 30s timeout
  Rate limit note in comment: free tier allows 15 req/min
```

---

## Prompt 10 — PWA, Telegram Bot, Polish, Deploy

```
[PASTE MASTER CONTEXT ABOVE THIS LINE]

Final prompt: PWA, Telegram reminders, polish, and deploy to Vercel.

PART A: PWA Setup

1. Update public/manifest.json (complete, not placeholder):
   {
     "name": "DSA OS",
     "short_name": "DSA OS",
     "description": "Your personal DSA learning system",
     "theme_color": "#0D0D10",
     "background_color": "#0D0D10",
     "display": "standalone",
     "orientation": "portrait",
     "scope": "/",
     "start_url": "/dashboard",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
     ]
   }

2. Create public/icons/icon-192.png and icon-512.png:
   Generate via bash using ImageMagick if available, or create a simple SVG-based icon:
   Background: #6366F1 (indigo), text: "DS" in white, rounded corners.
   Script: create-icons.sh using canvas or svg.

3. Verify next.config.ts has next-pwa configured with:
   - dest: 'public'
   - disable: process.env.NODE_ENV === 'development'
   - register: true
   - skipWaiting: true

4. Add to app/layout.tsx:
   <link rel="manifest" href="/manifest.json" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   <meta name="theme-color" content="#0D0D10" />

5. Create components/pwa-install-prompt.tsx:
   Listens for 'beforeinstallprompt' event.
   Shows a subtle banner at the bottom (above bottom nav) after 30 seconds:
     "Install DSA OS for the best experience →"
     "Install" button + "✕" dismiss.
   Only shows once (localStorage flag). Only on mobile.

PART B: Telegram Bot Notifications

1. Create app/api/telegram-webhook/route.ts:
   POST endpoint that receives Telegram bot messages.
   Accept /start command: save chat_id to a telegram_chats table in Supabase.
   Accept /stop command: remove chat_id.

2. Create supabase/migrations/002_telegram.sql:
   TABLE telegram_chats:
     id uuid PK
     user_id uuid → auth.users
     chat_id bigint UNIQUE
     is_active boolean DEFAULT true
     created_at timestamptz DEFAULT now()
   RLS: user can only see their own chat.

3. Create lib/telegram.ts:
   sendMessage(chatId: bigint, text: string): fetch POST to Telegram Bot API
   Format messages with Telegram MarkdownV2.

4. Create app/api/cron/daily-reminder/route.ts:
   This is called by Vercel Cron (free, up to 2/day).
   Query: for each user with an active telegram_chat, check their revision queue for today.
   Send message: "🧠 *DSA OS*\nYou have {N} problems due for revision today. Open the app to review\\."
   
   Add to vercel.json:
   { "crons": [{ "path": "/api/cron/daily-reminder", "schedule": "0 8 * * *" }] }
   
   Also: /api/cron/evening-summary → 9 PM, send: "✅ {N} problems solved today. Streak: {D} days."
   { "path": "/api/cron/evening-summary", "schedule": "0 15 * * *" } (UTC, = 8:30 PM IST)

5. In app/(app)/dashboard/page.tsx add a Telegram connect section:
   If no telegram_chat exists for user:
     Card: "Connect Telegram for reminders"
     Button → opens t.me/[BOTNAME] with ?start=[user_id] deep link
   If connected:
     Shows "Telegram notifications active ✓" with disconnect option.

PART C: Final Polish

1. Add loading.tsx to all (app) route segments (Next.js streaming):
   Each shows skeleton of the actual page layout, not a spinner.
   Use Tailwind animate-pulse on placeholder blocks.

2. Add error.tsx to all (app) route segments:
   Friendly error: "Something went wrong", "Try again" button, "Back to dashboard" link.

3. Wrap all server actions with proper error handling:
   Return { success: boolean, error?: string } instead of throwing.
   Show toast notifications on client (add sonner: npm install sonner, configure in root layout).

4. Mobile polish:
   - All tap targets minimum 44x44px
   - Prevent zoom on input focus: add viewport meta with minimum-scale=1
   - Add -webkit-tap-highlight-color: transparent to body
   - Bottom nav safe area: padding-bottom: env(safe-area-inset-bottom, 16px)
   - Smooth scroll: scroll-behavior: smooth on html

5. Performance:
   - Wrap @uiw/react-codemirror in dynamic import: dynamic(() => import(...), { ssr: false })
   - Wrap recharts charts in dynamic imports
   - Add loading prop fallback for both

PART D: Deploy to Vercel

1. Create .gitignore (if not exists) — ensure .env.local is excluded.

2. Create README.md with setup steps:
   - Clone repo
   - npm install
   - Fill .env.local
   - Apply Supabase migrations
   - npm run dev
   - Deploy: push to GitHub → connect Vercel → add env vars

3. Deployment steps:
   - Push to GitHub (create repo, git init, commit all)
   - vercel login → vercel deploy → set env vars in Vercel dashboard
   - Add Vercel deployment URL to Supabase Auth → Site URL
   - Add Vercel URL to Supabase Auth → Redirect URLs

4. Final check: run `npm run build` locally. Fix all TypeScript errors and build warnings before deploying.

After this prompt: The app is live, installable on your phone, and sending you Telegram reminders. Done in 7 days.
```

---

## Quick Reference

### Supabase env vars (Dashboard → Settings → API)
| Var | Where to find |
|-----|--------------|
| NEXT_PUBLIC_SUPABASE_URL | Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon public key |
| SUPABASE_SERVICE_ROLE_KEY | service_role key (secret, server only) |
| GEMINI_API_KEY | aistudio.google.com → Get API Key |

### Prompt run order
```
Prompt 1 → npm run dev works, dark theme loads
Prompt 2 → paste SQL into Supabase SQL editor, run seed.sql
Prompt 3 → auth works, app shell renders
Prompt 4 → dashboard shows data
Prompt 5 → can enter + save a problem end-to-end
Prompt 6 → can browse and review problems
Prompt 7 → swipeable revision deck works
Prompt 8 → analytics show real patterns
Prompt 9 → AI mentor reviews your code
Prompt 10 → deployed, on your phone, reminders on Telegram
```

### When Claude Code goes off-track
If a prompt generates generic code or misses the design:
> "This is DSA OS, a premium dark PWA. The component you just wrote looks too generic. Redo [component name] with: dark background (#131316), the pattern color system from patterns.ts for all colored elements, mobile-first layout with minimum 44px tap targets, and framer-motion fade-in animation on mount."

### Component checklist (every component you build)
- [ ] Mobile-first (320px base, scale up)
- [ ] Uses CSS variables (no hardcoded dark hex values)  
- [ ] Pattern colors come from patterns.ts, not inline
- [ ] Tap targets ≥ 44px
- [ ] Loading skeleton provided (not spinner)
- [ ] Empty state designed (not just "No data")
- [ ] Framer Motion animation on mount
