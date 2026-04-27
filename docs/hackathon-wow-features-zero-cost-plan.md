# Hackathon Wow Features + Zero-Cost Plan

## What Your Image Suggests

The image is powerful because it is not just advice. It is:

- category-based
- simple
- visual
- weekly
- actionable
- motivating
- easy to complete

That is exactly the missing layer in the current project.

Instead of giving users only:

- a score
- a chatbot
- some music
- some articles

the app should give them a **living weekly challenge board** that changes based on:

- profile type
- profession
- personality
- symptom severity
- current energy
- sleep quality
- completed tasks
- recent mood check-ins

## Best New Signature Feature

### Adaptive Recovery Challenge Board

This should become the heart of the product after assessment.

Inspired by your image, but smarter and personalized.

Each week, the system creates categories such as:

- Personal
- Inner Peace
- Health
- Family / Social
- Career / Study
- Joy / Fun

Each category gets a pool of recommended micro-tasks.
The app asks the user to complete:

- 2 tasks from 2 categories for basic recovery
- 2 tasks from 4 categories for strong consistency
- full-category completion for advanced streak users

But unlike the paper chart, tasks should be dynamic.

### Example dynamic assignment

A student with high exam stress might get:

- Inner Peace: 4-minute breathing reset
- Career / Study: 25-minute focus sprint
- Health: drink water 5 times today
- Joy / Fun: watch one light comedy clip after study block

A software engineer with burnout might get:

- Inner Peace: 3-minute eyes-closed reset between meetings
- Health: no-screen lunch break
- Family / Social: send one voice note to a trusted person
- Career: block one 30-minute deep-work window

A job seeker with low confidence might get:

- Personal: write 3 strengths
- Career: apply to 1 relevant opening only
- Joy / Fun: 10-minute walk with music
- Inner Peace: rejection reframing prompt

## The "Char Chand" Features

These are the features that can make the project feel memorable, not ordinary.

### 1. Two-Minute Rescue Mode

For users who feel overwhelmed right now.

One tap opens:

- guided breathing
- grounding exercise
- calming screen
- one small next step
- optional emergency support notice

Why it wins:

- immediate value
- emotionally powerful demo
- zero heavy backend needed

### 2. Adaptive Recovery Challenge Board

The image-inspired feature.

Why it wins:

- very visible
- easy for judges to understand
- creates habit loop
- feels more human than plain analytics

### 3. Mood Weather + Energy Map

Instead of only saying "stress high", show:

- mental weather
- energy level
- sleep debt
- social battery

Example:

- Mind Cloudy
- Energy 42%
- Social Battery Low
- Sleep Debt Moderate

Why it wins:

- beautiful visualization
- easier for users to relate to

### 4. Healing Garden / Recovery Space

Every completed task grows a calming visual world:

- seed
- leaf
- tree
- lantern
- stars

Why it wins:

- very emotional
- very visual for judges
- strong retention system
- works without paid APIs

### 5. Burnout Radar

A non-diagnostic early warning panel that detects patterns like:

- poor sleep for 4 days
- low mood streak
- low task completion
- high workload answers

Then it says:

- risk rising
- slow down plan intensity
- shift to recovery tasks this week

Why it wins:

- makes the app feel intelligent
- can be fully rule-based

### 6. Why This Was Chosen For You

For every task or recommendation, show a reason:

- chosen because sleep quality dropped this week
- chosen because your profile is exam-focused student
- chosen because high stress users need smaller steps first

Why it wins:

- builds trust
- makes AI feel transparent

### 7. Safe Support Circle

Let the app generate supportive actions like:

- send a check-in message to a friend
- ask a sibling for a walk
- share "I'm having a rough day" templates

Why it wins:

- real-world usefulness
- no paid API required
- adds social healing angle

### 8. Calm Mode UI

Special accessibility mode for distressed users:

- reduced motion
- softer contrast
- larger text
- fewer decisions per screen
- one-task-at-a-time view

Why it wins:

- directly aligned to mental health needs
- strong UX differentiator

### 9. Reflection Capsule

At the end of the week, users see:

- what improved
- what was difficult
- what helped most
- what next week should focus on

Why it wins:

- makes progress feel real
- easy to demo

### 10. Offline Recovery Kit

Keep some parts available even with poor internet:

- breathing flows
- grounding steps
- saved weekly tasks
- saved journal prompts

Why it wins:

- reliability
- great product thinking

### 11. Low-Stimulation Night Flow

Special night screen with:

- softer palette
- slower animation
- sleep wind-down routine
- no harsh charts

Why it wins:

- high empathy
- premium-feeling experience

### 12. Progress Story, Not Just Progress Chart

Instead of only graphs, tell the user:

- your sleep is improving
- your stress peaks happen mostly after busy weekdays
- fun activities correlate with better mood

Why it wins:

- feels intelligent
- more human than raw charts

## Zero-Cost Product Strategy

The core product should work even if all external AI or content APIs are unavailable.

That means:

- scoring should be rule-based
- task generation should be rules + templates
- reports should be mostly deterministic
- recommendations should come from local content libraries
- AI should enhance, not power the whole app

## Best Zero-Cost Architecture

### Rule 1: Remove duplicated storage

Right now the project has a cost and complexity smell:

- frontend reads Firestore
- backend saves user data in MongoDB
- backend still depends on Google Sheets sync

That creates:

- extra load
- extra confusion
- extra failure points
- unnecessary data duplication

For a hackathon, pick **one main database**.

### Recommended low-cost architecture

- React + Vite frontend
- Spring Boot backend
- one database only
- JSON-based question bank
- local rule engine for scoring
- optional free-tier LLM only for polish

### Best practical choices

Option A:

- Firebase Auth
- Cloud Firestore only
- remove MongoDB dependency

Option B:

- Firebase Auth
- MongoDB Atlas free cluster only
- remove Firestore user-data dependency

For your current codebase, **Option B is probably the smaller migration** because the backend already uses Mongo repositories.
But if the frontend should read/write directly in some places, **Option A can reduce backend complexity**.

Important architecture rule:

- do not keep both Firestore and Mongo for the same user wellness records

## Free-Service Notes I Verified

These were checked on official docs on April 25, 2026:

- Firebase still offers a no-cost Spark plan with free quotas for products like Authentication and quotas for Cloud Firestore. Source: [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- MongoDB Atlas still offers a free cluster / free tier with limited storage and throughput. Source: [MongoDB pricing](https://www.mongodb.com/pricing) and [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- Gemini Developer API still has a free tier, but with lower rate limits than paid usage. Source: [Gemini billing](https://ai.google.dev/gemini-api/docs/billing) and [Gemini rate limits](https://ai.google.dev/gemini-api/docs/quota)
- Freesound API is free for non-commercial use, which is fine for a hackathon demo but risky for a real commercial product. Source: [Freesound API terms](https://freesound.org/docs/api/terms_of_use.html)

## How To Stay Zero-Cost Even If AI Fails

Build these without any paid API:

- assessment engine
- scoring engine
- challenge board
- daily check-in
- weekly plan
- progress dashboard
- rescue mode
- grounding toolkit
- static resource library

Use AI only for:

- better wording
- deeper summaries
- optional conversational polish

That way the app still works if quotas are exhausted.

## Best Time And Space Complexity Strategy

Mental health apps should feel instant. Slow systems increase anxiety.

### Backend rules

1. Precompute report summaries after assessment submission.
2. Store dimension scores directly instead of recalculating all answers on every dashboard load.
3. Generate weekly plans once, then patch only changed tasks.
4. Use pagination or small slices for journal/check-in history.
5. Keep task recommendation logic rule-based and O(n) over a small filtered pool.
6. Cache question sets in memory because they change rarely.
7. Use indexes on:
   - userId
   - createdAt
   - assessmentId
   - weekStart

### Frontend rules

1. Load dashboard in sections, not one giant request.
2. Lazy-load heavy tabs like charts and immersive visuals.
3. Avoid rerendering the whole dashboard when one task changes.
4. Keep animation mostly transform + opacity based.
5. Use skeletons instead of spinners where possible.
6. Persist only essential local state.
7. Compress illustration assets and reuse them.

### Complexity targets

- assessment scoring: O(q)
- weekly task selection: O(t) after filtered pool creation
- dashboard summary fetch: O(1) request per section
- trend rendering: O(d) where d is displayed days, not all history

## Best UI/UX Direction For Disturbed Users

This product must not feel noisy, sharp, or overwhelming.

### Visual principles

- soft but not childish
- reassuring but not clinical
- premium but not dark and heavy
- animated but not hyperactive

### UI style recommendation

Use a visual language built around:

- soft blue
- warm teal
- mist white
- muted coral for alerts
- gentle gradients
- rounded cards
- spacious layout
- strong readability

Avoid:

- too much neon
- too much purple glow everywhere
- dense dashboards
- too many simultaneous animations
- harsh red warnings

### Motion system

Use motion with purpose:

- slow fade-in for reports
- staggered task card reveal
- gentle floating background shapes
- breathing animation in rescue mode
- growth animation for healing garden
- soft completion confetti, not loud celebration

For sensitive users, every animation must support:

- reduced motion mode
- calm mode
- instant disable toggle

## Best UX Flows

### Flow 1: Overwhelmed user

- open app
- tap rescue mode
- finish 2-minute calming flow
- see only one suggested task
- avoid full dashboard overload

### Flow 2: New user

- choose profile type
- complete short intake
- take dynamic assessment
- see simple summary first
- unlock deeper report after summary

### Flow 3: Returning user

- open dashboard
- see mood check-in first
- see today's 3 small tasks
- see progress only after actions

## The Best Feature Mix For Winning

If you want the highest judge impact with realistic build scope, I would combine:

1. Adaptive assessment engine
2. Deep analysis report
3. Adaptive Recovery Challenge Board
4. Two-Minute Rescue Mode
5. Burnout Radar
6. Healing Garden progress visualization
7. Daily check-in
8. Calm Mode UI

That mix feels original, helpful, emotional, and demo-friendly.

## Smart Task Category Model

Use a task library like this:

- inner_peace
- body_health
- social_support
- purpose_work
- joy_play
- self_respect

Each task should have metadata:

- title
- description
- category
- minSeverity
- maxSeverity
- audienceTypes
- estimatedMinutes
- requiresOutdoor
- requiresOtherPeople
- energyLevelNeeded
- sleepFriendly
- repeatCooldownDays

This lets the system generate dynamic plans without expensive AI.

## Task Selection Logic

Use a weighted rules engine:

1. detect user state
2. filter unsafe or unsuitable tasks
3. rank tasks by relevance
4. enforce category diversity
5. avoid recently repeated tasks
6. keep difficulty appropriate to current energy

This is fast, cheap, and explainable.

## Important Safety Rule

Never push high-effort productivity tasks when:

- user is in severe distress
- sleep is collapsing
- mood trend is sharply negative

In those cases, the weekly board should prioritize:

- rest
- grounding
- hydration
- brief movement
- safe social connection
- professional help suggestion if needed

## Most Important Product Reframe

The product should not feel like:

**"Take this test and see your score."**

It should feel like:

**"This app understands my current state, calms me down, gives me manageable next steps, and helps me recover over time."**

## My Strongest Recommendation

If we build the next version, the first major transformation should be:

1. remove Google Form dependency
2. unify storage into one data source
3. create adaptive assessment
4. launch the Adaptive Recovery Challenge Board
5. add Rescue Mode + Calm Mode

That combination will add the real "char chand" to the project.
