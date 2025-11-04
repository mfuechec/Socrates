/**
 * Annotation validation layer
 * Validates AI responses before rendering
 */

import type {
  TutorResponse,
  Annotation,
  ValidationResult,
  ValidationError,
  AnnotationType,
} from '@/types/whiteboard';

// ============================================================================
// Constants
// ============================================================================

const MAX_ANNOTATIONS = 5;
const VALID_ANNOTATION_TYPES: AnnotationType[] = [
  'highlight',
  'circle',
  'arrow',
  'label',
  'underline',
];

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates a tutor response with annotations
 * This is the main entry point for validation
 */
export function validateTutorResponse(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Check required message field
  if (!data.message || typeof data.message !== 'string') {
    errors.push({
      field: 'message',
      error: 'Missing or invalid message field',
    });
  }

  // 2. Validate message isn't empty
  if (data.message && data.message.trim().length === 0) {
    errors.push({
      field: 'message',
      error: 'Message cannot be empty',
    });
  }

  // 3. Validate annotations array (optional)
  if (data.annotations !== undefined && data.annotations !== null) {
    if (!Array.isArray(data.annotations)) {
      errors.push({
        field: 'annotations',
        error: 'Annotations must be an array',
      });
    } else {
      // Check annotation count
      if (data.annotations.length > MAX_ANNOTATIONS) {
        errors.push({
          field: 'annotations',
          error: `Too many annotations (${data.annotations.length}). Maximum is ${MAX_ANNOTATIONS}`,
        });
      }

      // Validate each annotation
      data.annotations.forEach((ann: any, idx: number) => {
        const annErrors = validateAnnotation(ann, idx);
        errors.push(...annErrors);
      });
    }
  }

  // Build result
  const valid = errors.length === 0;

  if (valid) {
    return {
      valid: true,
      errors: [],
      sanitizedResponse: data as TutorResponse,
    };
  } else {
    return {
      valid: false,
      errors,
      sanitizedResponse: undefined,
    };
  }
}

// ============================================================================
// Annotation Validation
// ============================================================================

/**
 * Validates a single annotation
 */
function validateAnnotation(ann: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `annotations[${index}]`;

  // 1. Check required type field
  if (!ann.type) {
    errors.push({
      field: `${prefix}.type`,
      error: 'Missing type field',
    });
  } else if (!VALID_ANNOTATION_TYPES.includes(ann.type)) {
    errors.push({
      field: `${prefix}.type`,
      error: `Invalid annotation type: ${ann.type}. Must be one of: ${VALID_ANNOTATION_TYPES.join(', ')}`,
    });
  }

  // 2. Check required target field
  if (!ann.target) {
    errors.push({
      field: `${prefix}.target`,
      error: 'Missing target field',
    });
  } else {
    const targetErrors = validateTarget(ann.target, `${prefix}.target`, ann.type);
    errors.push(...targetErrors);
  }

  // 3. Validate label-specific fields
  if (ann.type === 'label') {
    if (!ann.content || typeof ann.content !== 'string') {
      errors.push({
        field: `${prefix}.content`,
        error: 'Label annotations must have a content field',
      });
    }
  }

  // 4. Validate style (optional)
  if (ann.style) {
    const styleErrors = validateStyle(ann.style, `${prefix}.style`);
    errors.push(...styleErrors);
  }

  return errors;
}

// ============================================================================
// Target Validation
// ============================================================================

/**
 * Validates an annotation target
 */
function validateTarget(
  target: any,
  fieldPrefix: string,
  annotationType: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for mode field
  if (!target.mode) {
    errors.push({
      field: `${fieldPrefix}.mode`,
      error: 'Missing mode field (must be "text", "coordinate", or "arrow")',
    });
    return errors;
  }

  // Validate based on mode
  switch (target.mode) {
    case 'text':
      if (!target.text || typeof target.text !== 'string') {
        errors.push({
          field: `${fieldPrefix}.text`,
          error: 'Text target must have a text field',
        });
      }
      if (target.text && target.text.trim().length === 0) {
        errors.push({
          field: `${fieldPrefix}.text`,
          error: 'Text target cannot be empty',
        });
      }
      break;

    case 'coordinate':
      if (typeof target.x !== 'number' || typeof target.y !== 'number') {
        errors.push({
          field: `${fieldPrefix}`,
          error: 'Coordinate target must have x and y fields',
        });
      }
      if (target.x < 0 || target.x > 100 || target.y < 0 || target.y > 100) {
        errors.push({
          field: `${fieldPrefix}`,
          error: 'Coordinates must be between 0 and 100 (percentage)',
        });
      }
      break;

    case 'arrow':
      if (annotationType !== 'arrow') {
        errors.push({
          field: `${fieldPrefix}`,
          error: 'Arrow target mode can only be used with arrow annotations',
        });
      }
      if (!target.from || !target.to) {
        errors.push({
          field: `${fieldPrefix}`,
          error: 'Arrow target must have from and to fields',
        });
      } else {
        // Recursively validate from/to targets
        const fromErrors = validateTarget(target.from, `${fieldPrefix}.from`, annotationType);
        const toErrors = validateTarget(target.to, `${fieldPrefix}.to`, annotationType);
        errors.push(...fromErrors, ...toErrors);
      }
      break;

    default:
      errors.push({
        field: `${fieldPrefix}.mode`,
        error: `Invalid mode: ${target.mode}`,
      });
  }

  return errors;
}

// ============================================================================
// Style Validation
// ============================================================================

/**
 * Validates annotation style
 */
function validateStyle(style: any, fieldPrefix: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate color (optional)
  if (style.color !== undefined && typeof style.color !== 'string') {
    errors.push({
      field: `${fieldPrefix}.color`,
      error: 'Color must be a string',
    });
  }

  // Validate opacity (optional)
  if (style.opacity !== undefined) {
    if (typeof style.opacity !== 'number') {
      errors.push({
        field: `${fieldPrefix}.opacity`,
        error: 'Opacity must be a number',
      });
    } else if (style.opacity < 0 || style.opacity > 1) {
      errors.push({
        field: `${fieldPrefix}.opacity`,
        error: 'Opacity must be between 0 and 1',
      });
    }
  }

  // Validate strokeWidth (optional)
  if (style.strokeWidth !== undefined) {
    if (typeof style.strokeWidth !== 'number') {
      errors.push({
        field: `${fieldPrefix}.strokeWidth`,
        error: 'Stroke width must be a number',
      });
    } else if (style.strokeWidth < 0) {
      errors.push({
        field: `${fieldPrefix}.strokeWidth`,
        error: 'Stroke width cannot be negative',
      });
    }
  }

  // Validate fontSize (optional)
  if (style.fontSize !== undefined) {
    if (typeof style.fontSize !== 'number') {
      errors.push({
        field: `${fieldPrefix}.fontSize`,
        error: 'Font size must be a number',
      });
    } else if (style.fontSize < 8 || style.fontSize > 72) {
      errors.push({
        field: `${fieldPrefix}.fontSize`,
        error: 'Font size must be between 8 and 72',
      });
    }
  }

  return errors;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Attempts to parse JSON with fallback
 */
export function parseWithFallback(rawResponse: string): TutorResponse {
  try {
    const parsed = JSON.parse(rawResponse);
    return parsed;
  } catch (error) {
    console.warn('JSON parse failed, attempting extraction:', error);

    // Try to extract message field with regex
    const messageMatch = rawResponse.match(/"message"\s*:\s*"([^"]+)"/);
    if (messageMatch) {
      console.warn('Extracted message from malformed JSON');
      return {
        message: messageMatch[1],
        annotations: [],
      };
    }

    // Last resort: treat entire response as plain text
    console.warn('Falling back to plain text mode');
    return {
      message: rawResponse,
      annotations: [],
    };
  }
}

/**
 * Sanitizes a tutor response by removing invalid annotations
 */
export function sanitizeResponse(response: TutorResponse): TutorResponse {
  if (!response.annotations || response.annotations.length === 0) {
    return response;
  }

  // Filter out annotations that fail validation
  const validAnnotations: Annotation[] = [];

  response.annotations.forEach((ann, idx) => {
    const errors = validateAnnotation(ann, idx);
    if (errors.length === 0) {
      validAnnotations.push(ann);
    } else {
      console.warn(`Annotation ${idx} failed validation:`, errors);
    }
  });

  // Limit to MAX_ANNOTATIONS
  const limitedAnnotations = validAnnotations.slice(0, MAX_ANNOTATIONS);

  if (limitedAnnotations.length < validAnnotations.length) {
    console.warn(
      `Limited annotations from ${validAnnotations.length} to ${MAX_ANNOTATIONS}`
    );
  }

  return {
    ...response,
    annotations: limitedAnnotations,
  };
}

/**
 * Checks if response has valid annotations
 */
export function hasValidAnnotations(response: TutorResponse): boolean {
  return !!response.annotations && response.annotations.length > 0;
}

/**
 * Logs validation errors in a readable format
 */
export function logValidationErrors(errors: ValidationError[]): void {
  if (errors.length === 0) return;

  console.group('❌ Annotation Validation Errors');
  errors.forEach((err) => {
    console.error(`  ${err.field}: ${err.error}`);
  });
  console.groupEnd();
}
