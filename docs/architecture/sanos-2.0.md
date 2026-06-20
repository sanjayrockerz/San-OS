# SAN OS 2.0

## STUDENT INTELLIGENCE CORE + COMMAND CENTER ARCHITECTURE

### MASTER EXECUTION PROMPT

### Mission

Stop thinking in modules.

Stop thinking in pages.

Stop thinking in CRUD.

SanOS currently contains:

* Habit Engine
* Notification Engine
* Memory Intelligence Engine
* Revision System
* Concepts
* Knowledge Vault
* Roadmaps
* IIT Workspace
* Dashboard
* Timeline
* AI Insights
* Focus Modes
* Daily Briefs

The problem is not lack of features.

The problem is lack of unification.

The user still experiences:

```text
Dashboard

Roadmaps

Concepts

Vault

IIT

Revision
```

as separate systems.

This sprint transforms SanOS into a true Personal Learning Operating System.

The objective is:

> Make every subsystem feel like one intelligence helping the student succeed.

---

# CRITICAL RULE

Before writing code:

Perform a full architecture audit.

Do not build anything.

Analyze:

* DashboardAggregationService
* HabitEngineService
* MemoryIntelligenceService
* MemoryCoachService
* KnowledgeGraphService
* IIT services
* Roadmap services
* Concepts services
* Timeline
* AI insights
* Notifications
* Focus modes

Answer:

### Which systems are disconnected?

### Which systems duplicate information?

### Which systems should be orchestrated together?

### Which systems should become part of a unified intelligence layer?

Generate an internal architecture report first.

---

# PHASE 1

## STUDENT INTELLIGENCE CORE

Create a new architecture layer:

```text
StudentIntelligenceCore
```

This becomes the highest-level decision engine.

It does NOT store data.

It orchestrates existing systems.

---

Responsibilities:

### Understand student state

### Understand academic state

### Understand memory state

### Understand roadmap state

### Understand project state

### Understand consistency state

### Produce actions

---

The core should answer:

### What should the user do next?

### What is currently dangerous?

### What should be ignored temporarily?

### What gives the highest ROI today?

### What is blocking progress?

---

Never duplicate logic.

Reuse existing services.

---

# PHASE 2

## COMMAND CENTER DASHBOARD

The dashboard must stop being a statistics page.

Current mindset:

```text
Metrics
Charts
Cards
```

Future mindset:

```text
Mission Control
```

---

When the user opens SanOS:

The first thing they see should be:

```text
Good Morning Sanjay

Memory Health
Academic Health
Consistency Health

Today's Mission

Risk Alerts

Recommended Actions

Upcoming Deadlines

Continue Learning
```

---

The dashboard must answer:

### What matters today?

### What can wait?

### What should I start with?

---

Remove unnecessary information hierarchy.

Prioritize decisions.

Not metrics.

---

# PHASE 3

## EXPERIENCE ARCHITECTURE

Audit every screen.

Determine:

### Why does this screen exist?

### What decision does it help make?

### What action does it encourage?

If none:

The screen is weak.

---

Create:

### Learning Flow

```text
Morning Brief

↓

Mission

↓

Revision

↓

Problem Solving

↓

Reflection

↓

Knowledge Capture

↓

Review

↓

Summary
```

---

Create:

### Academic Flow

```text
Assignment

↓

Preparation

↓

Completion

↓

Review

↓

Archive
```

---

Create:

### Knowledge Flow

```text
Learn

↓

Capture

↓

Connect

↓

Revise

↓

Master
```

---

# PHASE 4

## PREMIUM DESIGN SYSTEM

Current UI feels like:

```text
Modern SaaS
```

Target:

```text
Apple
+
Linear
+
Notion
+
Arc
```

Principles:

### Calm

### Spacious

### Premium

### Intentional

### Emotional

### Student Friendly

---

Audit:

* colors
* spacing
* typography
* hierarchy
* density
* navigation

---

Create:

### Semantic Colors

Not random gradients.

Examples:

Memory Health

Academic Health

Risk

Warning

Success

Focus

Mission

---

Each color must have meaning.

---

# PHASE 5

## INFORMATION HIERARCHY REBUILD

Current:

Too many cards.

Too many equal-priority elements.

Future:

Hierarchy:

### Level 1

Mission

---

### Level 2

Risk

---

### Level 3

Recommendations

---

### Level 4

Progress

---

### Level 5

History

---

The user should know what matters within 3 seconds.

---

# PHASE 6

## RESPONSIVE EXPERIENCE ARCHITECTURE

Audit:

* mobile
* tablet
* desktop
* ultrawide

Current issue:

Many systems were built desktop-first.

Fix completely.

---

Rules:

Nothing disappears.

Nothing becomes inaccessible.

No hidden functionality.

No mobile degradation.

---

Design:

### Mobile Command Center

### Tablet Workspace

### Desktop Mission Control

Each optimized.

Same capabilities.

---

# PHASE 7

## CROSS-SYSTEM INTELLIGENCE

Connect:

Memory Engine
↓
Roadmaps

Roadmaps
↓
Concepts

Concepts
↓
Knowledge Vault

IIT
↓
Daily Mission

Habit Engine
↓
Mission

Notifications
↓
Recommendations

AI Insights
↓
Actions

---

Every system should influence every relevant system.

---

# PHASE 8

## STUDENT COACH

Create:

StudentCoachService

Not a chatbot.

Decision engine.

Must produce:

### Mission

### Priorities

### Risk Alerts

### Focus Recommendations

### Intervention Recommendations

---

Examples:

```text
Your DP retention is dropping.

Revise DP before continuing Graphs.
```

---

```text
Assignment risk is critical.

Pause roadmap work today.
```

---

# PHASE 9

## DELIGHT & ENGAGEMENT

The application must feel rewarding.

Add:

### Weekly Wins

### Learning Milestones

### Consistency Achievements

### Progress Celebrations

### Positive Reinforcement

Without becoming gamified nonsense.

---

# PHASE 10

## CTO PRODUCT AUDIT

After implementation:

Perform another audit.

Score:

### Learning Effectiveness

### Memory Retention

### Academic Utility

### Daily Usage Potential

### Intelligence

### Product Cohesion

### UI Quality

### Mobile Experience

### Student Value

---

Identify remaining weaknesses.

---

# VERIFICATION

Run:

node scripts/verify-db.mjs

node scripts/verify-engine.mjs

npm run lint

npx tsc --noEmit

npm run build

Fix all failures.

---

# SUCCESS CRITERIA

The sprint succeeds only if:

* The application feels like one product.
* The dashboard becomes mission control.
* Systems no longer feel isolated.
* Mobile experience is fully functional.
* Students immediately know what to do next.
* The platform actively guides behavior.
* UI feels premium and intentional.
* The product genuinely helps students make better decisions every day.

Do not stop after redesigning screens.

Continue until SanOS behaves like an intelligent operating system rather than a collection of excellent tools.
