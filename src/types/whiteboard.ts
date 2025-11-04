/**
 * Whiteboard Annotation Types
 * Based on whiteboard-api-design.md
 */

// ============================================================================
// Core Annotation Types
// ============================================================================

export type AnnotationType = 'highlight' | 'circle' | 'arrow' | 'label' | 'underline';

export interface Annotation {
  id?: string; // Auto-generated client-side
  type: AnnotationType;
  target: AnnotationTarget;
  style?: AnnotationStyle;
  metadata?: AnnotationMetadata;
}

// ============================================================================
// Annotation Targets
// ============================================================================

export type AnnotationTarget = TextTarget | CoordinateTarget | ArrowTarget;

/**
 * Text-based targeting (Phase 1 MVP)
 * Finds text within the problem statement
 */
export interface TextTarget {
  mode: 'text';
  text: string; // Exact text to find
  occurrence?: number; // Which occurrence if multiple (default: all)
  context?: string; // Surrounding text for disambiguation
}

/**
 * Coordinate-based targeting (Phase 3)
 * For image-based problems
 */
export interface CoordinateTarget {
  mode: 'coordinate';
  x: number; // 0-100 (percentage of canvas width)
  y: number; // 0-100 (percentage of canvas height)
  width?: number; // For rectangles/highlights
  height?: number;
}

/**
 * Arrow-specific target (connects two points)
 */
export interface ArrowTarget {
  mode: 'arrow';
  from: TextTarget | CoordinateTarget;
  to: TextTarget | CoordinateTarget;
}

// ============================================================================
// Annotation Styles
// ============================================================================

export interface AnnotationStyle {
  color?: string; // CSS color (default: varies by type)
  opacity?: number; // 0-1 (default: 0.3 for highlights, 1.0 for shapes)
  strokeWidth?: number; // For circles/arrows (default: 2)
  fontSize?: number; // For labels (default: 14)
  backgroundColor?: string; // For labels (default: white)
}

export const DEFAULT_STYLES: Record<AnnotationType, AnnotationStyle> = {
  highlight: {
    color: 'yellow',
    opacity: 0.3,
  },
  circle: {
    color: 'red',
    opacity: 1.0,
    strokeWidth: 2,
  },
  arrow: {
    color: 'blue',
    opacity: 1.0,
    strokeWidth: 2,
  },
  label: {
    color: 'black',
    opacity: 1.0,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  underline: {
    color: 'red',
    opacity: 1.0,
    strokeWidth: 2,
  },
};

// ============================================================================
// Annotation Metadata
// ============================================================================

export interface AnnotationMetadata {
  purpose?: string; // Why this annotation? (for debugging)
  hint?: string; // Tooltip text
  duration?: number; // How long to show (ms, default: permanent)
}

// ============================================================================
// Specific Annotation Type Interfaces
// ============================================================================

export interface HighlightAnnotation extends Annotation {
  type: 'highlight';
  target: TextTarget;
}

export interface CircleAnnotation extends Annotation {
  type: 'circle';
  target: TextTarget | CoordinateTarget;
}

export interface ArrowAnnotation extends Annotation {
  type: 'arrow';
  target: ArrowTarget;
}

export interface LabelAnnotation extends Annotation {
  type: 'label';
  target: TextTarget | CoordinateTarget;
  content: string; // Label text
}

export interface UnderlineAnnotation extends Annotation {
  type: 'underline';
  target: TextTarget;
}

// ============================================================================
// Tutor Response (Enhanced)
// ============================================================================

export type MasteryLevel = 'mastered' | 'competent' | 'struggling';

export interface TutorResponse {
  message: string; // Socratic dialogue
  annotations?: Annotation[]; // Visual annotations (optional)
  animationSequence?: AnimationStep[]; // Phase 2 feature
  isComplete?: boolean; // Has the student completed the problem?
  masteryLevel?: MasteryLevel; // AI's assessment of student understanding
}

// ============================================================================
// Animation Support (Phase 2)
// ============================================================================

export type AnimationType = 'fadeIn' | 'slideIn' | 'trace' | 'pulse';
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface AnimationStep {
  delay: number; // ms after previous step
  annotationId: string; // Which annotation to animate
  animation: {
    type: AnimationType;
    duration: number; // ms
    easing?: EasingType;
  };
}

// ============================================================================
// Validation & Error Handling
// ============================================================================

export type AnnotationErrorType =
  | 'TEXT_NOT_FOUND'
  | 'INVALID_COORDINATE'
  | 'INVALID_SCHEMA'
  | 'RENDERING_FAILED'
  | 'INVALID_JSON';

export interface ValidationError {
  field: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitizedResponse?: TutorResponse;
}

export interface AnnotationRenderResult {
  success: boolean;
  error?: AnnotationErrorType;
  message?: string;
}

// ============================================================================
// Text Position Finding
// ============================================================================

export interface TextPosition {
  index: number; // Character index in string
  x: number; // Pixel X coordinate
  y: number; // Pixel Y coordinate
  width: number; // Width of text
  height: number; // Height of text
}

// ============================================================================
// Canvas Configuration
// ============================================================================

export interface WhiteboardConfig {
  maxAnnotations: number; // Max annotations per message (default: 5)
  enableAnimations: boolean; // Phase 2 feature
  colorMode: 'light' | 'dark'; // Theme-aware colors
  responsive: boolean; // Auto-resize on window change
}

export const DEFAULT_WHITEBOARD_CONFIG: WhiteboardConfig = {
  maxAnnotations: 5,
  enableAnimations: false,
  colorMode: 'light',
  responsive: true,
};

// ============================================================================
// Type Guards
// ============================================================================

export function isTextTarget(target: AnnotationTarget): target is TextTarget {
  return 'mode' in target && target.mode === 'text';
}

export function isCoordinateTarget(target: AnnotationTarget): target is CoordinateTarget {
  return 'mode' in target && target.mode === 'coordinate';
}

export function isArrowTarget(target: AnnotationTarget): target is ArrowTarget {
  return 'mode' in target && target.mode === 'arrow';
}

export function isHighlightAnnotation(ann: Annotation): ann is HighlightAnnotation {
  return ann.type === 'highlight';
}

export function isCircleAnnotation(ann: Annotation): ann is CircleAnnotation {
  return ann.type === 'circle';
}

export function isArrowAnnotation(ann: Annotation): ann is ArrowAnnotation {
  return ann.type === 'arrow';
}

export function isLabelAnnotation(ann: Annotation): ann is LabelAnnotation {
  return ann.type === 'label' && 'content' in ann;
}

export function isUnderlineAnnotation(ann: Annotation): ann is UnderlineAnnotation {
  return ann.type === 'underline';
}
