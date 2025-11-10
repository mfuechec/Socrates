# Learning Strategies Implementation

This document describes how Socrates addresses cognitive learning strategies from the Math Academy Way, and outlines paths for implementing additional strategies.

## Current Implementation Status

### ✅ Fully Implemented

#### 1. **Active Learning**
**Goal:** Students construct knowledge through engagement rather than passive reception.

**How Implemented:**
- Socratic dialogue system never gives direct answers
- Every response is a guiding question requiring student thought
- Students must articulate their reasoning at each step
- AI analyzes student responses for understanding vs memorization

**Code Location:**
- System prompt in `pages/api/chat.ts` (lines 15-60)
- Enforces question-based responses only
- Forbidden from providing direct solutions

**Effectiveness:** ✅ Core to entire app design

---

#### 2. **Mastery Learning**
**Goal:** Students must demonstrate mastery before progressing to harder concepts.

**How Implemented:**
- AI assesses mastery level on problem completion (mastered/competent/struggling)
- Mastery level determines which practice buttons appear:
  - Mastered → "Harder Problem" button unlocked
  - Competent → Both "Similar" and "Harder" available
  - Struggling → Only "Similar Problem" recommended
- Database tracks mastery per topic for long-term progression

**Code Location:**
- `src/lib/learning-algorithm.ts` - `calculateMasteryLevel()`
- `src/components/ChatInterface.tsx` (lines 442-463) - Conditional button display
- AI prompt includes mastery assessment instructions

**Effectiveness:** ✅ Students cannot skip ahead until ready

---

#### 3. **Spaced Repetition**
**Goal:** Review material at increasing intervals to combat forgetting curve.

**How Implemented:**
- SM-2 algorithm calculates optimal review schedules
- Topics tracked with:
  - Strength score (0-1 retention)
  - Next review date
  - Ease factor (adjusts based on performance)
  - Review count
- Failed reviews reset interval to 1 day
- Successful reviews exponentially increase interval (6 days → 15 → 37 → 92 days)

**Code Location:**
- `src/lib/spaced-repetition.ts` - Complete SM-2 implementation
- `pages/api/save-attempt.ts` - Updates schedules after each problem
- Database `topic_progress` table stores review metadata

**Effectiveness:** ✅ Research-backed optimal retention

---

#### 4. **Testing Effect**
**Goal:** Retrieval practice (testing) is more effective than re-studying.

**How Implemented:**
- Every problem is a test - no solutions provided upfront
- Students must retrieve knowledge to solve
- No passive review mode - only active problem solving
- Struggle tracked and used to adapt difficulty

**Code Location:**
- Core app architecture (no passive study mode exists)
- `src/lib/solution-path-manager.ts` - Tracks struggle and adjusts support

**Effectiveness:** ✅ 100% retrieval practice, zero passive study

---

#### 5. **Minimizing Cognitive Load**
**Goal:** Reduce extraneous cognitive load to maximize learning.

**How Implemented:**
- **Solution path scaffolding:** AI breaks complex problems into manageable steps
  - Generated in `pages/api/analyze-problem.ts`
  - Visual progress indicator shows step completion
- **Progressive disclosure:** Only current step shown, not overwhelming full solution
- **Adaptive hints:** More support when student struggles, less when mastering
- **Clean UI:** Minimal distractions, focus on problem and dialogue
- **LaTeX rendering:** Mathematical notation displayed cleanly (KaTeX)

**Code Location:**
- `src/types/solution-path.ts` - Step-by-step approach structures
- `src/components/SolutionPathProgress.tsx` - Visual step tracker
- `src/lib/solution-path-manager.ts` - Adaptive struggle detection

**Effectiveness:** ✅ Students work on one concept at a time

---

### ⚠️ Partially Implemented

#### 6. **Deliberate Practice**
**Goal:** Focused practice on specific weaknesses with immediate feedback.

**Currently Working:**
- ✅ Immediate corrective feedback (Socratic questioning)
- ✅ Weakness tracking (topic strength scores in database)
- ✅ Adaptive difficulty (Similar/Harder problem buttons)
- ✅ Mastery-based progression

**Not Yet Working:**
- ❌ No "Targeted Practice" button to focus on weak topics
- ❌ No UI showing which topics need work
- ❌ No automated weak topic selection

**Implementation Path:**
1. Create `PracticeButtons.tsx` component with:
   - "Review Due" - Problems due for spaced repetition
   - "Mixed Practice" - Interleaved topics
   - "Targeted Practice" - Focus on weakest topics
2. Add API endpoint `/api/get-next-problem` that:
   - Queries user's topic progress
   - Identifies weak topics (strength < 0.6)
   - Generates problems targeting gaps
3. Display in ChatInterface header

**Estimated Effort:** 2-3 hours

---

#### 7. **Interleaving**
**Goal:** Mix different topics/types in practice sessions (vs blocked practice).

**Currently Working:**
- ✅ Database tracks multiple topics independently
- ✅ `prioritizeTopicsForPractice()` algorithm exists (spaced-repetition.ts:195)
- ✅ Can detect and categorize 15 different math topics

**Not Yet Working:**
- ❌ No "Mixed Practice" button that generates interleaved problem sets
- ❌ Students manually choose topics (blocking)
- ❌ No session planning based on topic diversity

**Implementation Path:**
1. Create `/api/generate-mixed` endpoint:
   - Selects 5-10 topics using `prioritizeTopicsForPractice()`
   - Balances due reviews + weak topics + variety
   - Returns queue of problems
2. Add "Mixed Practice" button that:
   - Starts session with pre-selected topic mix
   - Automatically advances through queue
   - Tracks session completion
3. Store session in `practice_sessions` table

**Estimated Effort:** 3-4 hours

---

### ❌ Not Yet Implemented

#### 8. **Developing Automaticity**
**Goal:** Practice until skills become automatic (fluent, effortless).

**What's Missing:**
- No timed drills for computational fluency
- No tracking of response speed/automaticity
- No fluency benchmarks (e.g., "solve linear equations in <30 seconds")

**Implementation Path:**

**Option A: Speed Drills Mode**
- Add "Fluency Practice" mode
- Present rapid-fire computational problems (e.g., "3x + 7 = 16")
- Track time per problem
- Measure improvement in speed over time
- Only unlock after demonstrating conceptual understanding

**Option B: Adaptive Pacing**
- Track average time per turn for each topic
- If speed is slow but accuracy high → suggest fluency practice
- If speed fast → move to harder concepts

**Database Changes:**
- Add `response_time_ms` column to `problem_attempts`
- Track `average_speed` in `topic_progress`
- Add `fluency_level` metric (slow/moderate/fluent)

**Estimated Effort:** 4-6 hours

---

#### 9. **Layering**
**Goal:** Build complex skills by layering simple foundations.

**What's Missing:**
- No explicit prerequisite/dependency tree
- Topics treated independently
- Can attempt any problem regardless of foundation

**Implementation Path:**

**Option A: Topic Dependency Graph**
```typescript
// Define prerequisite relationships
const TOPIC_DEPENDENCIES = {
  'quadratic-equations': ['linear-equations', 'exponents'],
  'systems-of-equations': ['linear-equations'],
  'calculus': ['functions', 'graphing', 'polynomials'],
  // ...
};
```

**Option B: Progressive Unlocking**
- Start with foundational topics only (linear equations, basic arithmetic)
- Unlock advanced topics after demonstrating mastery of prerequisites
- Visual skill tree showing locked/unlocked topics
- Cannot attempt calculus until algebra foundations solid

**Implementation:**
1. Add `prerequisites` field to topic metadata
2. Check `topic_progress` before allowing problem selection
3. Add `isUnlocked()` function that validates prerequisites
4. Display locked topics grayed out with "Complete [X] first" message

**Estimated Effort:** 5-8 hours

---

#### 10. **Non-Interference**
**Goal:** Space conceptually similar topics to avoid confusion/interference.

**What's Missing:**
- No interference detection between similar topics
- Can practice linear equations immediately followed by quadratic equations
- No cooldown period between confusable concepts

**Implementation Path:**

**Step 1: Define Interference Groups**
```typescript
const INTERFERENCE_GROUPS = [
  ['linear-equations', 'quadratic-equations', 'systems-of-equations'],
  ['sin', 'cos', 'tan'], // Trigonometric functions
  ['derivative', 'integral'], // Calculus concepts
  ['permutations', 'combinations'],
];
```

**Step 2: Modify Problem Selection Algorithm**
- Check user's last 3 attempts
- Identify which interference group was practiced
- Avoid selecting from same group for next 2-3 problems
- Force switch to different topic family

**Step 3: Update `prioritizeTopicsForPractice()`**
```typescript
function prioritizeTopicsForPractice(
  allProgress: TopicProgress[],
  recentAttempts: ProblemAttempt[], // NEW: check recent history
  count: number
): MathTopic[] {
  // Filter out topics from same interference group as last 2 attempts
  const recentGroups = getInterferenceGroups(recentAttempts.slice(0, 2));
  const eligible = allProgress.filter(p =>
    !recentGroups.includes(getGroupForTopic(p.topic))
  );

  // Continue with existing prioritization logic...
}
```

**Estimated Effort:** 3-4 hours

---

#### 11. **Gamification**
**Goal:** Increase motivation through game-like elements (streaks, achievements, progress bars).

**What's Missing:**
- No visual progress indicators
- No achievement system
- No streak tracking
- No leaderboards or social features
- No rewards/unlocks

**Implementation Path (Prioritized):**

**Phase 1: Core Metrics (2-3 hours)**
- **Streak Counter:** Days of consecutive practice
  - Add `last_active_date` to user profile
  - Display flame icon with streak count in header
  - "Don't break your 7-day streak!" message
- **Progress Bars:** Topic mastery visualization
  - Circular progress indicators showing strength (0-100%)
  - Color-coded: Red (struggling) → Yellow (competent) → Green (mastered)

**Phase 2: Achievements (4-6 hours)**
- **Badge System:**
  - "First Problem" - Complete first problem
  - "Master of Linear Equations" - 10 mastered linear equation problems
  - "Streak Week" - 7-day streak
  - "Century Club" - 100 total problems solved
  - "Speed Demon" - Solve problem in <5 turns
- Store in `user_achievements` table
- Display badge showcase on profile page

**Phase 3: Leaderboards (6-8 hours)**
- **Weekly Problem Count:** Top solvers this week
- **Longest Streaks:** Hall of fame
- **Topic Masters:** Highest strength per topic
- Privacy controls (opt-in/anonymous)

**Phase 4: Advanced (8-12 hours)**
- **Level System:** XP per problem, level up unlocks harder topics
- **Daily Challenges:** Special problems with bonus rewards
- **Missions:** "Complete 5 quadratic equations today"
- **Virtual Currency:** Spend on hints, cosmetics, features

**Database Schema:**
```sql
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id),
  achievement_id TEXT,
  unlocked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY,
  streak_days INTEGER DEFAULT 0,
  total_problems INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_active_date DATE
);
```

**Estimated Effort (Full):** 20-30 hours

---

## Summary: Implementation Roadmap

### Priority 1: High Impact, Low Effort (Complete First)
1. **Targeted Practice Button** (2-3 hrs) - Deliberate practice on weak topics
2. **Mixed Practice Sessions** (3-4 hrs) - Interleaving implementation
3. **Non-Interference Logic** (3-4 hrs) - Prevent similar topic confusion

**Total:** 8-11 hours → **Completes core learning system**

---

### Priority 2: Engagement & Retention (Complete Second)
1. **Streak Counter** (2-3 hrs) - Daily engagement incentive
2. **Progress Visualization** (2-3 hrs) - Show topic mastery
3. **Basic Achievements** (4-6 hrs) - Badge system

**Total:** 8-12 hours → **Significantly boosts motivation**

---

### Priority 3: Advanced Features (Long-term)
1. **Topic Dependency Tree** (5-8 hrs) - Layering implementation
2. **Fluency Drills** (4-6 hrs) - Automaticity training
3. **Full Gamification** (12-20 hrs) - Leaderboards, levels, missions

**Total:** 21-34 hours → **Feature-complete learning platform**

---

## Research Foundation

All implemented strategies are based on cognitive science research:

- **Spaced Repetition:** SM-2 algorithm (Wozniak, 1990)
- **Testing Effect:** Roediger & Karpicke (2006) - retrieval practice
- **Interleaving:** Rohrer & Taylor (2007) - mixed practice benefits
- **Mastery Learning:** Bloom (1968) - prerequisite knowledge importance
- **Cognitive Load:** Sweller (1988) - germane vs extraneous load
- **Socratic Method:** Active learning meta-analysis (Freeman et al., 2014)

---

## How to Prioritize Next Steps

**If goal is:**
- **Maximum learning effectiveness** → Priority 1 (Targeted Practice, Mixed Sessions, Non-Interference)
- **User retention/engagement** → Priority 2 (Streaks, Achievements, Progress Bars)
- **Comprehensive platform** → Complete all three priorities

**Recommendation:** Start with Priority 1 to complete the core pedagogical engine, then add Priority 2 for user engagement.
