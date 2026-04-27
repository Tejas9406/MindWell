# Digital Psychiatrist Roadmap

## Product Vision

Transform this project from a student-only stress checker into a universal mental wellness platform that works for students, working professionals, job seekers, parents, freelancers, founders, and older adults.

The strongest positioning for a hackathon is:

**"An AI mental wellness companion that simulates the structured intake, analysis, follow-up, and improvement planning workflow of a real mental health professional."**

For production, avoid claiming that the product is a real psychiatrist unless a licensed clinician is involved. A safer public name is:

- Digital Mental Wellness Companion
- AI Mental Health Coach
- Personal Mind Care Assistant

## What Is Limiting The Current Project

The current app already has a useful base flow:

- assessment
- result
- AI chatbot
- music
- articles

But right now the product is limited because:

1. The assessment is tied to one embedded Google Form.
2. The questions are student-specific.
3. The scoring model produces only one broad stress score.
4. The analysis is shallow and mostly question-by-question.
5. Articles are static and not personalized.
6. Music is lightly personalized but not part of a recovery plan.
7. Chat has limited user memory and no structured care-plan context.
8. There is no progress tracking, daily check-in, or follow-up workflow.
9. There is no safety layer for high-risk answers.

## How Real Mental Health Workflows Usually Feel

A real psychiatrist or therapist workflow is not just "take test and get score". It usually feels like this:

1. Intake and identity context
2. Presenting problem
3. Symptom screening
4. Life context analysis
5. Severity and pattern analysis
6. Risk detection
7. Personalized improvement plan
8. Follow-up and progress tracking

Your product should mirror this structure in a safe, non-diagnostic way.

## Recommended New Core Flow

The future user journey should be:

1. Sign up / log in
2. Choose profile type
3. Complete adaptive intake
4. Take dynamic assessment
5. Receive deep wellness report
6. Get a personalized 7-day or 14-day improvement plan
7. Complete daily tasks and check-ins
8. Chat with the AI coach using report context
9. Track mood, sleep, energy, and progress over time
10. Retake mini-assessments weekly

## Universal User Types

Start with these audience groups:

- Students
- Working professionals
- Job seekers
- Parents
- Entrepreneurs / founders
- Freelancers / creators
- Homemakers
- Senior citizens

Each type should have:

- different stress triggers
- different language
- different task recommendations
- different resource recommendations

## New Feature Pillars

### 1. Smart Onboarding And Intake

Collect the context that real analysis needs:

- age range
- profession / life role
- daily routine
- work or study pressure
- sleep quality
- screen time
- social support level
- recent major life event
- goals
- preferred support style
- communication tone preference

This should happen before the main assessment.

### 2. Adaptive Assessment Engine

Replace the single Google Form with a native in-app assessment engine.

Structure:

- Core mental wellness screening for everyone
- Role-based modules
- Personality / coping-style module
- Optional deep-dive modules

Suggested dimensions:

- stress
- anxiety
- burnout
- mood
- sleep
- social isolation
- concentration
- self-esteem
- work-life balance
- emotional regulation

Example role-based modules:

- students: exams, academic pressure, peer comparison, future fear
- professionals: deadlines, manager pressure, burnout, work-life balance
- parents: caregiving overload, guilt, lack of rest, relationship strain
- job seekers: rejection stress, uncertainty, confidence drop
- founders: financial pressure, decision fatigue, loneliness

### 3. Deep Analysis Report

Instead of only showing one score, show:

- overall wellness status
- severity by category
- top 3 likely stress triggers
- strongest emotional patterns
- protective strengths
- coping style
- priority improvement areas
- weekly focus recommendation
- explanation in simple language

Best report sections:

- Wellness Summary
- Stress Breakdown
- Trigger Map
- Strengths And Protective Factors
- Risk Signals
- Recommended Focus For This Week

### 4. Dynamic Weekly Improvement Plan

This is one of the most important features and a strong differentiator.

After analysis, automatically generate a personalized weekly plan using:

- personality
- profession
- stress score
- symptom dimensions
- time availability
- current habits
- user goals

Task categories:

- breathing exercises
- guided journaling
- sleep reset tasks
- hydration and food reminders
- walking / movement goals
- focus-management tasks
- gratitude tasks
- social reconnection tasks
- screen detox tasks
- self-reflection prompts
- confidence-building tasks

Make the plan dynamic:

- easier tasks for high-stress users
- deeper tasks for stable users
- different tasks for different professions
- changing tasks based on completion and check-ins

Example:

- student with exam stress: 25-minute study blocks, sleep reset, worry journal
- employee with burnout: calendar boundary task, micro-break reminders, evening wind-down
- job seeker with anxiety: confidence log, skill sprint, rejection reframing task

### 5. Daily Check-In System

Add a small daily flow:

- current mood
- energy
- sleep
- anxiety level
- completed tasks
- one-line journal entry

Then the AI should adapt recommendations based on the check-in.

### 6. Contextual AI Coach

Upgrade the chatbot from general responses to a context-aware assistant that knows:

- the user profile
- latest report
- weekly plan
- recent task completion
- current check-in state

The chatbot should be able to:

- explain report results
- motivate the user
- adjust daily tasks
- suggest coping steps
- recommend resources
- encourage follow-up assessment

### 7. Personalized Resource Engine

Replace static articles with a recommendation engine.

Recommend:

- articles
- music
- breathing audios
- meditation sessions
- short exercises
- motivational reflections

Filter recommendations using:

- role
- stress dimensions
- mood
- preferred format
- available time

### 8. Progress And Recovery Dashboard

Track improvement over time:

- weekly scores
- stress category changes
- task completion rate
- mood trend
- sleep trend
- streaks
- risk reduction

This is important for demo impact because judges like visible before/after progress.

### 9. Safety And Escalation Layer

This is essential if the app handles serious mental health content.

If answers or chat indicate high risk:

- show crisis guidance
- show emergency helpline suggestions
- suggest speaking to a human professional
- avoid overconfident AI advice

Also clearly state:

- not a medical diagnosis
- not a replacement for licensed care

## The Best Hackathon Winner Version

Do not try to build every possible feature first. Build the strongest demo story.

### Hackathon V1 Must-Have Features

1. Universal onboarding with role selection
2. Dynamic question engine with role-based question sets
3. Deep analysis report with multiple dimensions
4. AI-generated weekly improvement plan
5. Daily check-in with adaptive task updates
6. Context-aware AI coach
7. Personalized article + music + exercise recommendations
8. Progress dashboard with trends

### "Wow" Demo Script

This is the pitch flow:

1. User selects "working professional"
2. App asks adaptive questions about burnout, sleep, workload, and mood
3. App generates a deep psychological wellness report
4. App identifies top triggers and strengths
5. App creates a 7-day personalized action plan
6. User completes tasks and daily check-ins
7. Dashboard shows measurable improvement over time
8. AI coach explains why the plan changed dynamically

That story is much stronger than "we have a chatbot and articles".

## Recommended Feature Priorities

### Priority 1: Foundation

- replace embedded Google Form with native assessment flow
- create user profile model
- create configurable question-bank model
- create multidimensional scoring engine

### Priority 2: Intelligence Layer

- deep report generation
- personalized weekly plan generation
- contextual chatbot memory
- adaptive resource recommendation

### Priority 3: Engagement Layer

- daily check-ins
- task tracking
- progress trends
- streaks and recovery milestones

### Priority 4: Safety And Trust

- risk flags
- crisis escalation UI
- privacy controls
- responsible AI disclaimer

## Suggested Data Model

Add these collections or tables:

- `user_profiles`
- `question_sets`
- `assessment_sessions`
- `assessment_answers`
- `analysis_reports`
- `weekly_plans`
- `weekly_tasks`
- `task_completions`
- `daily_checkins`
- `resource_catalog`
- `resource_recommendations`
- `chat_context`
- `risk_flags`

### Example `user_profiles`

Fields:

- userId
- ageRange
- profileType
- occupation
- goals
- preferredSupportStyle
- preferredTaskDifficulty
- availableTimePerDay
- sleepPattern
- createdAt
- updatedAt

### Example `question_sets`

Fields:

- id
- audienceType
- dimension
- questionText
- options
- weight
- severityMap
- active

### Example `analysis_reports`

Fields:

- userId
- assessmentId
- overallScore
- dimensionScores
- topTriggers
- strengths
- riskLevel
- summary
- createdAt

### Example `weekly_tasks`

Fields:

- planId
- title
- category
- difficulty
- targetDay
- estimatedMinutes
- reason
- completed

## Suggested Backend APIs

Add endpoints like:

- `POST /api/profile`
- `GET /api/question-sets?profileType=student`
- `POST /api/assessment/start`
- `POST /api/assessment/submit`
- `GET /api/report/{userId}`
- `POST /api/weekly-plan/generate`
- `GET /api/weekly-plan/{userId}`
- `POST /api/tasks/{taskId}/complete`
- `POST /api/checkin`
- `GET /api/progress/{userId}`
- `GET /api/resources/recommendations/{userId}`
- `POST /api/risk/analyze`

## Suggested Frontend Screens

Replace the current dashboard tabs with:

- Home
- Assessment
- Report
- Weekly Plan
- Daily Check-In
- AI Coach
- Resources
- Progress

Possible landing-page sections:

- your current state
- today'"'"'s mission
- this week'"'"'s goals
- recommended support tools
- progress snapshot

## Best UI/UX Improvements

To feel like a real product and not a student tool:

- use a guided multi-step onboarding flow
- show progress indicators during assessment
- show radar charts and trigger summaries
- show task cards with completion states
- show a "today plan" card on the dashboard
- show "why this task was chosen for you"
- show timeline history for progress

## What Should Change In The Current Codebase

### Frontend

Current issues:

- `GoogleFormTab.jsx` uses a fixed embedded Google Form
- `Dashboard.jsx` assumes one static score flow
- `ArticlesTab.jsx` consumes static articles

Needed changes:

- build a native assessment wizard
- create role selection and onboarding
- create analysis report page
- create weekly task planner
- create daily check-in UI
- convert resources into personalized recommendations

### Backend

Current issues:

- `SheetsSyncService` is designed for one sheet and 16 fixed answers
- `UserData` stores only one score structure
- `ApiController` exposes static article and simple result endpoints

Needed changes:

- move from sheet-based syncing to app-native assessment submission
- support multiple question sets
- compute dimension-wise scoring
- generate dynamic care plans
- store progress and check-ins
- provide safer risk-aware responses

## 48-Hour Hackathon Build Order

If this is for a hackathon, build in this order:

### Phase 1

- create universal onboarding
- create native role-based assessment
- store answers in MongoDB

### Phase 2

- generate deep analysis report
- build report UI with charts and insights

### Phase 3

- generate dynamic 7-day weekly task plan
- let users complete tasks

### Phase 4

- daily check-in
- update task suggestions using check-in data

### Phase 5

- improve chatbot context
- personalize resources

### Phase 6

- add safety flows
- polish visuals and pitch demo

## Features To Avoid Early

These sound exciting but should not be first:

- voice therapy
- video calling
- too many wearable integrations
- full medical diagnosis claims
- medication suggestion features
- social network features

They add complexity without improving the core demo story enough.

## One Strong Positioning Statement For Judges

**"We built a universal AI mental wellness companion that does more than detect stress. It understands who the user is, adapts assessments to their life situation, generates a personalized recovery plan, and tracks improvement through structured follow-ups."**

## Recommended Immediate Next Build

If we want the fastest leap from the current codebase, the next build should be:

1. remove Google Form dependency
2. add onboarding with role selection
3. create JSON-based question sets
4. build multidimensional report generation
5. add weekly plan generation

Once these are done, the rest of the product becomes much easier to expand.
