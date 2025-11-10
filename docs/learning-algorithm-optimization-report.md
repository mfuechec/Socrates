# Learning Algorithm Optimization Report

**Project:** Socrates AI Math Tutor
**Date:** 2025-11-04
**Reviewer:** Winston (System Architect)
**Scope:** Review learning algorithms (mastery, spaced repetition, topic inference) for optimization opportunities

---

## Executive Summary

The learning algorithms are **well-implemented** with strong foundations in cognitive science research (SM-2, exponential weighting). However, there are **12 optimization opportunities** ranging from quick wins (hardcoded constant fixes) to significant enhancements (ML-based topic classification, adaptive thresholds).

**Overall Grade:** B+ (85/100)
- ✅ Research-backed algorithms (SM-2, exponential weighting)
- ✅ Solid code quality with clear documentation
- ⚠️ Hardcoded constants limit adaptability
- ⚠️ Topic inference fragile (keyword-based)
- ⚠️ No personalization (one-size-fits-all thresholds)

---

## Algorithm-by-Algorithm Analysis

### 1. Mastery Level Calculation

**File:** `src/lib/learning-algorithm.ts:19-27`

**Current Implementation:**
```typescript
export function calculateMasteryLevel(turnsTaken: number): MasteryLevel {
  if (turnsTaken <= 5) return 'mastered';
  else if (turnsTaken <= 10) return 'competent';
  else return 'struggling';
}
```

#### Issues Identified

**🔴 Critical: Hardcoded Thresholds**
- **Problem:** One-size-fits-all thresholds don't account for:
  - Problem difficulty (linear equation vs calculus)
  - Student experience level (beginner vs advanced)
  - Topic complexity (simple algebra vs systems of equations)

- **Example Failure Case:**
  - Student solves "2x + 5 = 13" in 6 turns → "competent" (expected ~4 turns)
  - Student solves "Factor x³ - 3x² + 3x - 1" in 6 turns → "competent" (excellent performance!)
  - Both get same label despite vastly different difficulty

- **Impact:** Medium (affects practice progression accuracy)

**🟡 Medium: No Context Awareness**
- Doesn't consider:
  - Solution path complexity (number of steps)
  - Student's struggle level during conversation
  - Time spent per turn (could indicate depth of thinking)

#### Optimization Recommendations

**Option 1: Difficulty-Adjusted Thresholds (Quick Win - 1-2 hours)**

```typescript
interface ProblemDifficulty {
  expectedTurns: number; // Baseline turns for mastery
  masteryMultiplier: number; // 1.0 = baseline, 1.5 = harder
}

const DIFFICULTY_PROFILES: Record<string, ProblemDifficulty> = {
  'Linear Equation': { expectedTurns: 4, masteryMultiplier: 1.0 },
  'Quadratic Equation': { expectedTurns: 6, masteryMultiplier: 1.3 },
  'System of Equations': { expectedTurns: 8, masteryMultiplier: 1.5 },
  'Calculus': { expectedTurns: 10, masteryMultiplier: 2.0 },
};

export function calculateMasteryLevel(
  turnsTaken: number,
  problemType: string // From SolutionPath
): MasteryLevel {
  const difficulty = DIFFICULTY_PROFILES[problemType] || { expectedTurns: 5, masteryMultiplier: 1.0 };
  const adjustedBaseline = difficulty.expectedTurns * difficulty.masteryMultiplier;

  if (turnsTaken <= adjustedBaseline) return 'mastered';
  else if (turnsTaken <= adjustedBaseline * 2) return 'competent';
  else return 'struggling';
}
```

**Benefits:**
- More accurate mastery assessment
- Uses existing SolutionPath.problemType metadata
- Simple to implement and test

**Drawbacks:**
- Still uses static thresholds (not adaptive)
- Requires manual tuning of difficulty profiles

---

**Option 2: Step-Based Calculation (Better - 2-3 hours)**

Use the SolutionPath step count as the baseline:

```typescript
export function calculateMasteryLevel(
  turnsTaken: number,
  solutionPath: SolutionPath,
  approachIndex: number
): MasteryLevel {
  const approach = solutionPath.approaches[approachIndex];
  const expectedTurns = approach.steps.length * 2; // ~2 turns per step baseline

  const efficiency = expectedTurns / turnsTaken;

  if (efficiency >= 0.8) return 'mastered';    // Within 20% of expected
  else if (efficiency >= 0.5) return 'competent'; // Within 50%
  else return 'struggling';
}
```

**Benefits:**
- Automatically adjusts for problem complexity
- No manual difficulty tuning needed
- Directly uses AI-generated solution path

**Drawbacks:**
- Requires passing SolutionPath to save-attempt API
- Baseline of "2 turns per step" needs validation

---

**Option 3: Struggle-Weighted Calculation (Best - 3-4 hours)**

Incorporate struggle level during conversation:

```typescript
interface MasteryContext {
  turnsTaken: number;
  totalStruggleLevel: number; // Sum of struggle levels across all turns
  hintsGiven: number;
  solutionPath: SolutionPath;
  approachIndex: number;
}

export function calculateMasteryLevel(context: MasteryContext): MasteryLevel {
  const approach = context.solutionPath.approaches[context.approachIndex];
  const expectedTurns = approach.steps.length * 2;

  // Calculate efficiency score (0-1)
  const efficiencyScore = Math.min(1, expectedTurns / context.turnsTaken);

  // Calculate struggle penalty (0-1, lower is worse)
  const maxStruggle = context.turnsTaken * 3; // Max struggle level is 3 per turn
  const strugglePenalty = 1 - (context.totalStruggleLevel / maxStruggle);

  // Calculate hint penalty
  const hintPenalty = context.hintsGiven > 0 ? 0.9 : 1.0; // 10% penalty if any hints

  // Combined mastery score
  const masteryScore = efficiencyScore * strugglePenalty * hintPenalty;

  if (masteryScore >= 0.75) return 'mastered';
  else if (masteryScore >= 0.5) return 'competent';
  else return 'struggling';
}
```

**Benefits:**
- Holistic assessment (not just turn count)
- Captures struggle even if student eventually succeeds
- More accurate representation of understanding

**Drawbacks:**
- More complex implementation
- Requires tracking struggle/hints throughout conversation
- Thresholds (0.75, 0.5) still need tuning

---

**Recommendation:** Implement **Option 2 (Step-Based)** first for quick improvement, then add **Option 3 (Struggle-Weighted)** in next iteration.

**Estimated Effort:**
- Option 1: 1-2 hours
- Option 2: 2-3 hours
- Option 3: 3-4 hours (+ frontend changes to track struggle)

---

### 2. Topic Inference Algorithm

**File:** `src/lib/learning-algorithm.ts:33-146`

**Current Implementation:** Keyword-based pattern matching with cascading if/else

#### Issues Identified

**🔴 Critical: Fragile Pattern Matching**

Problem examples that break current logic:

```typescript
// Example 1: Ambiguous classification
"Solve the quadratic inequality x² - 5x + 6 > 0"
// Contains: "quadratic" → classified as quadratic-equations
// Should be: inequalities (inequality > equation in priority)

// Example 2: Multiple topics
"Graph the function f(x) = x² - 4"
// Contains: "function", "f(x)", "x²"
// Could be: quadratic-equations OR functions OR graphing
// Returns: functions (first match wins)

// Example 3: False positive
"Calculate the perimeter of a triangle with sides x, x+2, and 2x"
// Contains: "triangle" → classified as geometry
// Should be: linear-equations (solving for x)

// Example 4: Generic algebra
"Simplify: (3x² + 2x - 5) + (x² - 4x + 7)"
// Default fallback: linear-equations
// Should be: polynomials
```

**🟡 Medium: No Multi-Topic Support**
- Problems often span multiple topics (e.g., word problems + linear equations)
- Current system returns single topic only
- Limits recommendation algorithm effectiveness

**🟡 Medium: Order Dependency**
- First matching condition wins
- Later checks never evaluated if earlier ones match
- Makes adding new topics risky (could break existing classifications)

#### Optimization Recommendations

**Option 1: Weighted Scoring System (Good - 3-4 hours)**

```typescript
interface TopicScore {
  topic: MathTopic;
  score: number;
  matchedKeywords: string[];
}

const TOPIC_PATTERNS: Record<MathTopic, { keywords: string[]; weight: number; priority: number }> = {
  'linear-equations': {
    keywords: ['solve', 'x =', '2x +', 'isolate'],
    weight: 1.0,
    priority: 3, // Lower priority (check after more specific topics)
  },
  'quadratic-equations': {
    keywords: ['x²', 'x^2', 'quadratic', 'parabola', 'vertex', 'completing the square'],
    weight: 1.5,
    priority: 2, // Higher priority
  },
  'inequalities': {
    keywords: ['<', '>', '≤', '≥', 'inequality', 'greater than', 'less than'],
    weight: 2.0,
    priority: 1, // Highest priority (most specific)
  },
  // ...
};

export function inferTopic(problemText: string): MathTopic {
  const text = problemText.toLowerCase();
  const scores: TopicScore[] = [];

  // Calculate scores for each topic
  for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
    const matchedKeywords = config.keywords.filter(kw => text.includes(kw.toLowerCase()));

    if (matchedKeywords.length > 0) {
      const score = matchedKeywords.length * config.weight * config.priority;
      scores.push({
        topic: topic as MathTopic,
        score,
        matchedKeywords,
      });
    }
  }

  // Return highest scoring topic
  if (scores.length === 0) return 'linear-equations'; // Default fallback

  scores.sort((a, b) => b.score - a.score);
  return scores[0].topic;
}
```

**Benefits:**
- Resolves ambiguity (highest score wins)
- Priority system overrides generic matches
- Extensible (add new topics without breaking existing)
- Transparent (can log why topic was chosen)

**Drawbacks:**
- Still keyword-based (not semantic understanding)
- Requires manual keyword curation
- Weights/priorities need tuning

---

**Option 2: Multi-Topic Classification (Better - 4-5 hours)**

```typescript
export interface TopicClassification {
  primaryTopic: MathTopic;
  secondaryTopics: MathTopic[];
  confidence: number; // 0-1
}

export function inferTopics(problemText: string): TopicClassification {
  const text = problemText.toLowerCase();
  const scores = calculateTopicScores(text); // From Option 1

  // Primary topic: highest score
  const primary = scores[0];

  // Secondary topics: within 70% of primary score
  const threshold = primary.score * 0.7;
  const secondary = scores
    .slice(1)
    .filter(s => s.score >= threshold)
    .map(s => s.topic);

  // Confidence based on score gap
  const confidence = scores.length > 1
    ? 1 - (scores[1].score / scores[0].score)
    : 1.0;

  return {
    primaryTopic: primary.topic,
    secondaryTopics: secondary,
    confidence,
  };
}
```

**Benefits:**
- Captures multi-topic problems
- Confidence score enables better recommendations
- Can prioritize review of low-confidence classifications

**Database Changes Required:**
```sql
ALTER TABLE problem_attempts ADD COLUMN secondary_topics TEXT[];
ALTER TABLE problem_attempts ADD COLUMN classification_confidence FLOAT;
```

---

**Option 3: LLM-Based Classification (Best - 6-8 hours)**

Use OpenAI to classify topics (most accurate):

```typescript
export async function inferTopicsWithAI(problemText: string): Promise<TopicClassification> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper model, faster
    temperature: 0.0, // Deterministic
    messages: [
      {
        role: 'system',
        content: `You are a math topic classifier. Given a math problem, identify the primary topic and any secondary topics involved.

PRIMARY TOPICS (choose one):
- linear-equations
- quadratic-equations
- systems-of-equations
- polynomials
- exponents
- radicals
- rational-expressions
- inequalities
- absolute-value
- functions
- graphing
- word-problems
- geometry
- trigonometry
- calculus

Return JSON:
{
  "primaryTopic": "...",
  "secondaryTopics": ["..."],
  "reasoning": "Brief explanation"
}`,
      },
      {
        role: 'user',
        content: `Classify this problem:\n\n${problemText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);

  return {
    primaryTopic: result.primaryTopic,
    secondaryTopics: result.secondaryTopics,
    confidence: 0.95, // High confidence for AI classification
  };
}
```

**Benefits:**
- Semantic understanding (not just keywords)
- Handles edge cases naturally
- Explains reasoning (useful for debugging)
- No manual keyword maintenance

**Drawbacks:**
- API call cost (~$0.001 per classification with gpt-4o-mini)
- Latency (~200-500ms)
- Requires error handling for API failures
- Need fallback to keyword-based if API down

**Cost Analysis:**
- 1000 problems/month × $0.001 = $1/month (negligible)
- Can cache results in database (only classify once per unique problem text)

---

**Recommendation:** Implement **Option 3 (LLM-Based)** with **Option 1 (Weighted Scoring)** as fallback.

**Implementation Strategy:**
1. Deploy Option 1 (weighted scoring) first
2. Add Option 3 (LLM) as optional enhancement
3. Use LLM for classification, fall back to weighted scoring if API fails
4. Cache LLM results in database to avoid repeat API calls

**Estimated Effort:**
- Option 1: 3-4 hours
- Option 2: 4-5 hours (includes DB migration)
- Option 3: 6-8 hours (includes caching + fallback logic)

---

### 3. Spaced Repetition (SM-2 Algorithm)

**File:** `src/lib/spaced-repetition.ts`

**Current Implementation:** Standard SM-2 with fixed parameters

#### Issues Identified

**🟡 Medium: Fixed Ease Factor**
- **Problem:** `easeFactor` is recalculated each time but never persisted
- **File:** `src/lib/spaced-repetition.ts:49`
- **Current:**
  ```typescript
  // Calculated but not stored!
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  ```
- **Impact:** Lost optimization data, intervals less personalized

**🟡 Medium: No Interval Persistence**
- **Problem:** `interval` calculated but not stored in DB
- **Current DB Schema (src/lib/supabase.ts:69):**
  ```typescript
  review_count: number;
  next_review: string;
  // Missing: interval, easeFactor
  ```
- **Impact:** Cannot analyze review schedule effectiveness

**🟢 Low: Initial Interval Hardcoded**
- Line 64-70: First review at 1 day, second at 6 days
- Works well for most students but not personalized

#### Optimization Recommendations

**Option 1: Persist SM-2 State (Quick Win - 1-2 hours)**

**Database Migration:**
```sql
-- Add missing SM-2 fields
ALTER TABLE topic_progress
  ADD COLUMN ease_factor FLOAT DEFAULT 2.5,
  ADD COLUMN interval_days INTEGER DEFAULT 1;

-- Update existing records
UPDATE topic_progress SET ease_factor = 2.5, interval_days = 1 WHERE ease_factor IS NULL;
```

**Code Update:**
```typescript
// In spaced-repetition.ts
export function updateTopicProgressAfterAttempt(
  topic: MathTopic,
  mastery: MasteryLevel,
  currentProgress: TopicProgress | null
): Partial<TopicProgress> {
  const quality = masteryToQuality(mastery);

  const currentInterval = currentProgress?.interval_days ?? 1;
  const currentEaseFactor = currentProgress?.ease_factor ?? INITIAL_EASE_FACTOR;
  const reviewCount = currentProgress?.review_count ?? 0;

  const schedule = calculateNextReview(
    currentInterval,
    currentEaseFactor,
    quality,
    reviewCount
  );

  const currentStrength = currentProgress?.strength ?? 0.5;
  const masteryScore = quality / 5;
  const newStrength = currentStrength * 0.7 + masteryScore * 0.3;

  return {
    topic,
    strength: Math.max(0, Math.min(1, newStrength)),
    review_count: schedule.reviewCount,
    ease_factor: schedule.easeFactor, // NOW PERSISTED
    interval_days: schedule.interval,  // NOW PERSISTED
    last_reviewed: new Date().toISOString(),
    next_review: schedule.nextReview.toISOString(),
  };
}
```

**Benefits:**
- Complete SM-2 state tracking
- Enables analytics (interval distribution, ease factor trends)
- Personalized schedules per user per topic

**Drawbacks:**
- DB migration required
- Slightly more storage (8 bytes per topic)

---

**Option 2: Adaptive Initial Intervals (Medium - 2-3 hours)**

Adjust initial intervals based on student performance:

```typescript
export function calculateAdaptiveInitialInterval(
  userHistory: ProblemAttempt[],
  topic: MathTopic
): number {
  // Check user's average mastery across all topics
  const recentAttempts = userHistory.slice(-20); // Last 20 problems

  if (recentAttempts.length < 5) {
    return 1; // Default for new users
  }

  const avgMastery = recentAttempts.reduce((sum, a) => {
    return sum + masteryToScore(a.mastery_level);
  }, 0) / recentAttempts.length;

  // High performers get longer initial intervals
  if (avgMastery >= 0.8) return 3; // Skip 1-day review, start at 3 days
  if (avgMastery >= 0.6) return 1; // Standard
  return 1; // Struggling students get standard schedule
}
```

**Benefits:**
- Reduces review burden for high performers
- Maintains support for struggling students
- Simple to implement

**Drawbacks:**
- May increase forgetting for overconfident students
- Needs A/B testing to validate

---

**Option 3: Lapse Detection & Recovery (Best - 3-4 hours)**

Current code has `isTopicLapsed()` (line 191) but doesn't use it effectively:

```typescript
// Enhanced lapse recovery
export function calculateLapseRecovery(
  progress: TopicProgress,
  daysSinceDue: number
): { resetInterval: number; notifyUser: boolean } {
  const interval = progress.interval_days ?? 1;

  if (daysSinceDue <= interval * 0.5) {
    // Minor overdue (within 50% of interval)
    return { resetInterval: interval * 0.8, notifyUser: false };
  } else if (daysSinceDue <= interval * 2) {
    // Moderate lapse (1-2x interval overdue)
    return { resetInterval: Math.max(1, interval * 0.5), notifyUser: true };
  } else {
    // Major lapse (>2x interval overdue)
    return { resetInterval: 1, notifyUser: true };
  }
}
```

**Integration:**
```typescript
// In prioritizeTopicsForPractice()
const lapsedTopics = allProgress.filter(p => isTopicLapsed(p));

lapsedTopics.forEach(topic => {
  const daysSinceDue = /* calculate */;
  const recovery = calculateLapseRecovery(topic, daysSinceDue);

  if (recovery.notifyUser) {
    // Show "You haven't practiced [topic] in X days!" notification
  }

  // Reset interval on next attempt
  topic.interval_days = recovery.resetInterval;
});
```

**Benefits:**
- Graceful degradation for inconsistent learners
- User notifications encourage re-engagement
- Prevents permanent topic decay

**Drawbacks:**
- Requires notification system
- More complex logic to maintain

---

**Recommendation:** Implement all three options in order:
1. **Option 1 (Persist State)** - Foundation improvement, 1-2 hours
2. **Option 2 (Adaptive Intervals)** - Performance optimization, 2-3 hours
3. **Option 3 (Lapse Recovery)** - User engagement, 3-4 hours

**Total Effort:** 6-9 hours

---

### 4. Topic Strength Calculation

**File:** `src/lib/learning-algorithm.ts:152-172`

**Current Implementation:** Exponential moving average with decay

#### Issues Identified

**🟢 Low Priority: Hard-Coded Decay Factor**
- Line 164: `const weight = Math.exp(-index * 0.2);`
- Decay factor 0.2 is arbitrary, not validated

**🟢 Low Priority: Default Strength Assumption**
- Line 153: `if (attempts.length === 0) return 0.5;`
- Assumes students start at 50% strength (middle)
- Could bias initial recommendations

#### Optimization Recommendations

**Option 1: Validated Decay Factor (Quick - 30 minutes)**

Research-backed decay factors:
- 0.1 = slow decay (last 10 attempts weighted equally)
- 0.2 = medium decay (current) (last 5 attempts weighted, older fade)
- 0.3 = fast decay (only last 3 attempts matter)

**Recommendation:** Keep 0.2 but make configurable:

```typescript
const STRENGTH_DECAY_FACTOR = 0.2; // Tune based on user data

export function calculateTopicStrength(
  attempts: ProblemAttempt[],
  decayFactor: number = STRENGTH_DECAY_FACTOR
): number {
  // ...
  const weight = Math.exp(-index * decayFactor);
  // ...
}
```

---

**Option 2: Topic-Specific Default Strength (Medium - 1-2 hours)**

Adjust default strength based on topic difficulty:

```typescript
const DEFAULT_TOPIC_STRENGTHS: Record<MathTopic, number> = {
  'linear-equations': 0.6,    // Most students have some algebra background
  'quadratic-equations': 0.5,  // Standard starting point
  'calculus': 0.3,            // Assume lower baseline for advanced topics
  // ...
};

export function getInitialStrength(topic: MathTopic): number {
  return DEFAULT_TOPIC_STRENGTHS[topic] ?? 0.5;
}
```

---

**Recommendation:** **Option 1 only** (make decay configurable). Option 2 is over-engineering without user data to validate assumptions.

**Estimated Effort:** 30 minutes

---

### 5. Mixed Practice Prioritization

**File:** `src/lib/spaced-repetition.ts:210-245`

**Current Implementation:** Due reviews + weak topics + random filler

#### Issues Identified

**🟡 Medium: No Interleaving Constraints**
- **Problem:** Adjacent problems can be from same topic
- **Example:** Selected topics: `['linear-equations', 'linear-equations', 'quadratic-equations']`
- **Research:** Blocked practice reduces discrimination and retention (Rohrer & Taylor, 2007)

**🟡 Medium: No Difficulty Progression**
- **Problem:** Hard and easy topics mixed randomly
- **Better:** Start with easier topics to build confidence, progress to harder

**🟢 Low: Random Filler Lacks Purpose**
- Line 234-241: "add random topics for variety"
- Could be smarter: topics adjacent to weak topics in prerequisite tree

#### Optimization Recommendations

**Option 1: Enforce Topic Spacing (Good - 2-3 hours)**

```typescript
export function enforceTopicSpacing(topics: MathTopic[]): MathTopic[] {
  const spaced: MathTopic[] = [];
  const used = new Set<MathTopic>();

  // First pass: add unique topics
  for (const topic of topics) {
    if (!used.has(topic)) {
      spaced.push(topic);
      used.add(topic);
    }
  }

  // Shuffle to avoid always same order
  return shuffleArray(spaced);
}

// In prioritizeTopicsForPractice()
export function prioritizeTopicsForPractice(
  allProgress: TopicProgress[],
  count: number
): MathTopic[] {
  // ... existing logic ...

  // Enforce spacing before returning
  return enforceTopicSpacing(selected);
}
```

**Benefits:**
- Prevents duplicate topics in session
- Simple to implement and understand
- Immediate improvement to interleaving

**Drawbacks:**
- Doesn't prevent similar topics (e.g., linear vs quadratic equations)
- May reduce session size if not enough unique topics

---

**Option 2: Interference Group Constraints (Better - 3-4 hours)**

From LEARNING_STRATEGIES.md (line 245-277):

```typescript
const INTERFERENCE_GROUPS = [
  ['linear-equations', 'quadratic-equations', 'systems-of-equations'],
  ['sin', 'cos', 'tan'], // Trigonometric functions
  ['derivative', 'integral'], // Calculus concepts
  ['permutations', 'combinations'],
];

function getInterferenceGroup(topic: MathTopic): number | null {
  for (let i = 0; i < INTERFERENCE_GROUPS.length; i++) {
    if (INTERFERENCE_GROUPS[i].includes(topic)) return i;
  }
  return null;
}

export function prioritizeTopicsForPractice(
  allProgress: TopicProgress[],
  recentAttempts: ProblemAttempt[], // NEW: pass recent history
  count: number
): MathTopic[] {
  // Get last 2 attempted topics
  const recentTopics = recentAttempts.slice(0, 2).map(a => a.topic);
  const recentGroups = recentTopics
    .map(t => getInterferenceGroup(t as MathTopic))
    .filter(g => g !== null);

  // Filter out topics from same interference group
  const eligibleProgress = allProgress.filter(p => {
    const group = getInterferenceGroup(p.topic as MathTopic);
    return group === null || !recentGroups.includes(group);
  });

  // Continue with existing prioritization logic on eligibleProgress
  // ...
}
```

**Benefits:**
- Research-backed (non-interference principle)
- Prevents confusion between similar concepts
- Improves long-term retention

**Drawbacks:**
- Requires manually defining interference groups
- May reduce available topics pool
- Needs recent attempt history passed from frontend

---

**Option 3: Difficulty Progression Ordering (Best - 4-5 hours)**

```typescript
const TOPIC_DIFFICULTY: Record<MathTopic, number> = {
  'linear-equations': 1,
  'inequalities': 2,
  'systems-of-equations': 3,
  'quadratic-equations': 4,
  'polynomials': 5,
  'functions': 6,
  'trigonometry': 7,
  'calculus': 8,
};

export function orderByDifficultyProgression(topics: MathTopic[]): MathTopic[] {
  // Sort by difficulty, but add randomness within difficulty tiers
  const withDifficulty = topics.map(t => ({
    topic: t,
    difficulty: TOPIC_DIFFICULTY[t] ?? 5,
    randomOffset: Math.random() * 0.5, // Random within ±0.5
  }));

  withDifficulty.sort((a, b) => (a.difficulty + a.randomOffset) - (b.difficulty + b.randomOffset));

  return withDifficulty.map(item => item.topic);
}
```

**Benefits:**
- Builds confidence with easier problems first
- Maintains some randomness (not totally predictable)
- Reduces frustration from hard problem streaks

**Drawbacks:**
- Requires difficulty ratings (manual or ML-based)
- May delay practice of hard topics

---

**Recommendation:** Implement **Option 1 (Enforce Spacing)** immediately, then **Option 2 (Interference Groups)** in next iteration.

**Estimated Effort:**
- Option 1: 2-3 hours
- Option 2: 3-4 hours (includes defining interference groups)
- Option 3: 4-5 hours (includes difficulty ratings)

---

## Quick Wins (Implement First)

### 1. Fix Hardcoded Constants (30 minutes)

```typescript
// Create src/lib/learning-constants.ts
export const LEARNING_CONSTANTS = {
  // Mastery thresholds
  MASTERY_TURN_THRESHOLD: 5,
  COMPETENT_TURN_THRESHOLD: 10,

  // Strength calculation
  STRENGTH_DECAY_FACTOR: 0.2,
  DEFAULT_STRENGTH: 0.5,

  // Weak/strong thresholds
  WEAK_TOPIC_THRESHOLD: 0.6,
  STRONG_TOPIC_THRESHOLD: 0.8,

  // SM-2 parameters
  MIN_EASE_FACTOR: 1.3,
  INITIAL_EASE_FACTOR: 2.5,
};

// Make configurable via env vars (optional)
export const MASTERY_TURN_THRESHOLD = parseInt(
  process.env.MASTERY_TURN_THRESHOLD || '5'
);
```

**Benefits:** Centralized, easy to tune, A/B testable

---

### 2. Add Database Indexes for Performance (15 minutes)

```sql
-- Already have user_id, topic, created_at indexes
-- Add composite indexes for common queries

CREATE INDEX IF NOT EXISTS idx_topic_progress_strength
  ON topic_progress(user_id, strength)
  WHERE strength < 0.6; -- Partial index for weak topics

CREATE INDEX IF NOT EXISTS idx_topic_progress_next_review_strength
  ON topic_progress(user_id, next_review, strength);
```

**Benefits:** Faster queries for weak topic identification, mixed practice generation

---

### 3. Add Logging for Algorithm Debugging (1 hour)

```typescript
// In calculateMasteryLevel()
console.log(`[Mastery] Problem: "${problem.substring(0, 30)}..." | Turns: ${turnsTaken} | Result: ${mastery}`);

// In inferTopic()
console.log(`[Topic] "${problem.substring(0, 30)}..." → ${topic}`);

// In updateTopicProgressAfterAttempt()
console.log(`[SM-2] Topic: ${topic} | Mastery: ${mastery} | Next review: ${schedule.nextReview} | Interval: ${schedule.interval} days`);
```

**Benefits:**
- Debug misclassifications
- Validate algorithm behavior
- Identify edge cases in production

---

### 4. Remove Unused Anthropic SDK (5 minutes)

```bash
npm uninstall @anthropic-ai/sdk
```

**Benefits:** Reduces bundle size by ~1MB, faster installs

---

## Prioritized Implementation Roadmap

### Phase 1: Foundation Fixes (3-5 hours)
**Priority:** HIGH
**Impact:** HIGH
**Effort:** LOW

1. ✅ Centralize constants (30 min)
2. ✅ Persist SM-2 state (ease factor, interval) (1-2 hrs)
3. ✅ Add composite DB indexes (15 min)
4. ✅ Add algorithm logging (1 hr)
5. ✅ Remove Anthropic SDK (5 min)

**Outcome:** More maintainable, better performance, easier debugging

---

### Phase 2: Core Algorithm Improvements (6-8 hours)
**Priority:** HIGH
**Impact:** MEDIUM-HIGH
**Effort:** MEDIUM

1. ✅ Step-based mastery calculation (2-3 hrs)
2. ✅ Weighted topic inference (3-4 hrs)
3. ✅ Enforce topic spacing in mixed practice (2-3 hrs)

**Outcome:** More accurate mastery assessment, better topic classification, improved interleaving

---

### Phase 3: Advanced Optimizations (10-15 hours)
**Priority:** MEDIUM
**Impact:** MEDIUM
**Effort:** MEDIUM-HIGH

1. ✅ LLM-based topic classification with fallback (6-8 hrs)
2. ✅ Struggle-weighted mastery calculation (3-4 hrs)
3. ✅ Interference group constraints (3-4 hrs)
4. ✅ Adaptive initial intervals (2-3 hrs)

**Outcome:** Best-in-class learning algorithm, research-backed optimizations

---

### Phase 4: Personalization & Analytics (15-20 hours)
**Priority:** LOW
**Impact:** HIGH (long-term)
**Effort:** HIGH

1. ✅ Multi-topic classification (4-5 hrs)
2. ✅ Difficulty progression ordering (4-5 hrs)
3. ✅ Lapse detection & recovery (3-4 hrs)
4. ✅ Topic-specific default strengths (1-2 hrs)
5. ✅ Analytics dashboard (learning curves, retention rates) (3-4 hrs)

**Outcome:** Fully personalized learning system, data-driven improvements

---

## Validation & Testing Strategy

### For Each Optimization:

**Unit Tests:**
```typescript
// Example for step-based mastery
describe('calculateMasteryLevel with steps', () => {
  it('should classify as mastered when turns match expected', () => {
    const result = calculateMasteryLevel(4, mockSolutionPath, 0);
    expect(result).toBe('mastered');
  });

  it('should adjust for problem complexity', () => {
    const easyProblem = { steps: [1, 2] }; // 2 steps
    const hardProblem = { steps: [1, 2, 3, 4, 5] }; // 5 steps

    expect(calculateMasteryLevel(4, easyProblem, 0)).toBe('competent');
    expect(calculateMasteryLevel(10, hardProblem, 0)).toBe('mastered');
  });
});
```

**A/B Testing:**
- Split users into control (current algorithm) vs experiment (new algorithm)
- Track metrics:
  - Long-term retention (strength scores after 30 days)
  - User engagement (problems solved per week)
  - Satisfaction (user feedback ratings)
- Run for 2-4 weeks before full rollout

**Manual Validation:**
- Test with 20+ diverse problems
- Verify classifications match human expert judgments
- Check edge cases (ambiguous problems, multi-topic problems)

---

## Risk Assessment

### Low Risk (Safe to Deploy)
- Centralize constants
- Add logging
- Database indexes
- Remove unused SDK

### Medium Risk (Test Thoroughly)
- Step-based mastery (new thresholds)
- Weighted topic inference (classification changes)
- Topic spacing (session composition changes)
- Persist SM-2 state (DB migration)

### High Risk (A/B Test Required)
- LLM-based classification (API dependency, cost)
- Struggle-weighted mastery (complex scoring)
- Adaptive initial intervals (affects all users)
- Lapse recovery (notification system integration)

---

## Cost-Benefit Analysis

### High ROI Optimizations
1. **Persist SM-2 State** - Minimal cost, significant benefit (better schedules)
2. **Step-Based Mastery** - 2 hrs effort, major accuracy improvement
3. **Topic Spacing** - 2 hrs effort, immediate retention improvement
4. **Centralize Constants** - 30 min, easier tuning forever

### Medium ROI Optimizations
1. **Weighted Topic Inference** - 3 hrs, solves classification ambiguity
2. **LLM Classification** - 6 hrs + $1/mo, best accuracy but high effort

### Low ROI Optimizations
1. **Difficulty Progression** - 4 hrs, marginal UX improvement
2. **Topic-Specific Defaults** - 1 hr, no validation data yet

---

## Conclusion

**Overall Recommendation:**

Implement **Phase 1** (Foundation) and **Phase 2** (Core Improvements) immediately:
- **Total Effort:** 9-13 hours
- **Total Impact:** Transforms learning algorithm from good to excellent
- **Low Risk:** Mostly safe improvements with clear benefits

Defer **Phase 3** and **Phase 4** until you have:
- User data to validate assumptions
- A/B testing infrastructure
- Budget for LLM API calls

**Next Steps:**
1. Create GitHub issues for each Phase 1 & 2 optimization
2. Implement in priority order (Quick Wins first)
3. Write unit tests for critical functions
4. Deploy to staging, validate with test problems
5. Monitor logs for unexpected behavior
6. Gather user feedback on mastery accuracy

---

**Questions for Discussion:**
1. What metrics should we track to validate improvements?
2. Do we have user data on current algorithm performance?
3. Should we implement A/B testing before rolling out changes?
4. What's the acceptable cost threshold for LLM-based classification?

**Contact:** Winston (Architect) for implementation questions
