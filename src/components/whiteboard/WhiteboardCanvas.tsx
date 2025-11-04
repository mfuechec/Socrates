/**
 * WhiteboardCanvas Component
 * Renders annotations on math problems using Fabric.js v6
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Text, Ellipse, Line, Group } from 'fabric';
import type { Annotation } from '@/types/whiteboard';

interface WhiteboardCanvasProps {
  problemText: string;
  annotations: Annotation[];
  darkMode?: boolean;
}

export default function WhiteboardCanvas({
  problemText,
  annotations,
  darkMode = false,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderErrors, setRenderErrors] = useState<string[]>([]);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      selection: false,
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      width: 600,
      height: 100,
    });

    fabricCanvasRef.current = canvas;

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [darkMode]);

  // Render problem text and annotations
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Clear canvas completely - remove all objects
    canvas.clear();
    canvas.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
    canvas.renderAll();

    const errors: string[] = [];

    // Render problem text
    const textColor = darkMode ? '#f3f4f6' : '#111827';
    const problemTextObj = new Text(problemText, {
      left: 20,
      top: 30,
      fontSize: 24,
      fontFamily: 'monospace',
      fill: textColor,
      selectable: false,
      evented: false,
    });

    canvas.add(problemTextObj);

    // Render annotations
    annotations.forEach((ann, idx) => {
      try {
        renderAnnotation(canvas, ann, problemTextObj, darkMode);
      } catch (error) {
        console.error(`Failed to render annotation ${idx}:`, error);
        errors.push(`Annotation ${idx} failed to render`);
      }
    });

    setRenderErrors(errors);
    canvas.requestRenderAll();
  }, [problemText, annotations, darkMode]);

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = fabricCanvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container) return;

      const width = Math.min(container.offsetWidth, 600);
      canvas.setDimensions({ width, height: 100 });
      canvas.requestRenderAll();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="my-4">
      <canvas ref={canvasRef} />

      {/* Show errors in development */}
      {process.env.NODE_ENV === 'development' && renderErrors.length > 0 && (
        <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-500">
          ⚠ {renderErrors.length} annotation(s) failed to render
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Annotation Rendering Functions
// ============================================================================

/**
 * Main dispatcher for rendering annotations
 */
function renderAnnotation(
  canvas: Canvas,
  annotation: Annotation,
  problemTextObj: Text,
  darkMode: boolean
): void {
  switch (annotation.type) {
    case 'highlight':
      renderHighlight(canvas, annotation, problemTextObj, darkMode);
      break;
    case 'circle':
      renderCircle(canvas, annotation, problemTextObj, darkMode);
      break;
    case 'label':
      renderLabel(canvas, annotation, problemTextObj, darkMode);
      break;
    case 'underline':
      renderUnderline(canvas, annotation, problemTextObj, darkMode);
      break;
    case 'arrow':
      console.warn('Arrow annotations not yet implemented');
      break;
    default:
      console.warn(`Unknown annotation type: ${(annotation as any).type}`);
  }
}

/**
 * Render highlight annotation
 */
function renderHighlight(
  canvas: Canvas,
  annotation: Annotation,
  problemTextObj: Text,
  darkMode: boolean
): void {
  if (annotation.target.mode !== 'text') {
    console.warn('Highlight only supports text targets');
    return;
  }

  const positions = findTextPositions(
    problemTextObj,
    annotation.target.text
  );

  if (positions.length === 0) {
    console.warn(`Text "${annotation.target.text}" not found in problem`);
    return;
  }

  const color = getAnnotationColor(
    annotation.style?.color || 'yellow',
    darkMode
  );
  const opacity = annotation.style?.opacity ?? 0.3;

  positions.forEach((pos) => {
    const highlight = new Rect({
      left: pos.left,
      top: pos.top,
      width: pos.width,
      height: pos.height,
      fill: color,
      opacity,
      selectable: false,
      evented: false,
    });

    canvas.add(highlight);
    canvas.sendObjectToBack(highlight);
  });
}

/**
 * Render circle annotation
 */
function renderCircle(
  canvas: Canvas,
  annotation: Annotation,
  problemTextObj: Text,
  darkMode: boolean
): void {
  if (annotation.target.mode !== 'text') {
    console.warn('Circle only supports text targets in Phase 1');
    return;
  }

  const positions = findTextPositions(
    problemTextObj,
    annotation.target.text
  );

  if (positions.length === 0) {
    console.warn(`Text "${annotation.target.text}" not found in problem`);
    return;
  }

  const requestedColor = annotation.style?.color || 'red';
  const color = getAnnotationColor(requestedColor, darkMode);
  const strokeWidth = annotation.style?.strokeWidth ?? 2;

  positions.forEach((pos) => {
    const padding = 5;
    const circle = new Ellipse({
      left: pos.left + pos.width / 2,
      top: pos.top + pos.height / 2,
      rx: pos.width / 2 + padding,
      ry: pos.height / 2 + padding,
      fill: 'transparent',
      stroke: color,
      strokeWidth,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(circle);
  });
}

/**
 * Render label annotation
 */
function renderLabel(
  canvas: Canvas,
  annotation: any,
  problemTextObj: Text,
  darkMode: boolean
): void {
  if (annotation.target.mode !== 'text') {
    console.warn('Label only supports text targets in Phase 1');
    return;
  }

  if (!annotation.content) {
    console.warn('Label annotation missing content');
    return;
  }

  const positions = findTextPositions(
    problemTextObj,
    annotation.target.text
  );

  if (positions.length === 0) {
    console.warn(`Text "${annotation.target.text}" not found in problem`);
    return;
  }

  const pos = positions[0];

  const textColor = getAnnotationColor(
    annotation.style?.color || 'black',
    darkMode
  );
  const fontSize = annotation.style?.fontSize ?? 12;
  const bgColor =
    annotation.style?.backgroundColor ||
    (darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)');

  const labelText = new Text(annotation.content, {
    fontSize,
    fill: textColor,
    fontFamily: 'Arial, sans-serif',
  });

  const bgRect = new Rect({
    width: (labelText.width || 0) + 10,
    height: (labelText.height || 0) + 6,
    fill: bgColor,
    stroke: textColor,
    strokeWidth: 1,
    rx: 4,
    ry: 4,
  });

  const group = new Group([bgRect, labelText], {
    left: pos.left + pos.width / 2,
    top: pos.top - 30,
    originX: 'center',
    selectable: false,
    evented: false,
  });

  canvas.add(group);
}

/**
 * Render underline annotation
 */
function renderUnderline(
  canvas: Canvas,
  annotation: Annotation,
  problemTextObj: Text,
  darkMode: boolean
): void {
  if (annotation.target.mode !== 'text') {
    console.warn('Underline only supports text targets');
    return;
  }

  const positions = findTextPositions(
    problemTextObj,
    annotation.target.text
  );

  if (positions.length === 0) {
    console.warn(`Text "${annotation.target.text}" not found in problem`);
    return;
  }

  const color = getAnnotationColor(
    annotation.style?.color || 'red',
    darkMode
  );
  const strokeWidth = annotation.style?.strokeWidth ?? 2;

  positions.forEach((pos) => {
    const line = new Line(
      [pos.left, pos.top + pos.height + 2, pos.left + pos.width, pos.top + pos.height + 2],
      {
        stroke: color,
        strokeWidth,
        selectable: false,
        evented: false,
      }
    );

    canvas.add(line);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

interface TextPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Find all positions of target text within problem text
 * Uses simple exact string matching (no normalization)
 */
function findTextPositions(
  textObj: Text,
  searchText: string
): TextPosition[] {
  const problemText = textObj.text || '';
  const positions: TextPosition[] = [];

  let startIndex = 0;

  // Find all exact matches
  while (true) {
    const index = problemText.indexOf(searchText, startIndex);

    if (index === -1) {
      break; // No more matches
    }

    // Calculate position by measuring text before the match
    const beforeText = problemText.slice(0, index);

    const beforeObj = new Text(beforeText, {
      fontSize: textObj.fontSize,
      fontFamily: textObj.fontFamily,
    });

    const matchObj = new Text(searchText, {
      fontSize: textObj.fontSize,
      fontFamily: textObj.fontFamily,
    });

    positions.push({
      left: (textObj.left || 0) + (beforeObj.width || 0),
      top: textObj.top || 0,
      width: matchObj.width || 0,
      height: matchObj.height || 0,
    });

    // Move past this match to find next one
    startIndex = index + searchText.length;
  }

  return positions;
}

/**
 * Get annotation color with dark mode support
 */
function getAnnotationColor(color: string, darkMode: boolean): string {
  if (darkMode) {
    const darkModeColors: Record<string, string> = {
      yellow: 'rgba(253, 224, 71, 0.5)',
      red: 'rgb(239, 68, 68)',      // Brighter, more saturated red
      blue: 'rgb(59, 130, 246)',     // Brighter, more saturated blue
      green: 'rgb(34, 197, 94)',     // Brighter green
      purple: 'rgb(168, 85, 247)',   // Brighter purple
      black: 'rgb(243, 244, 246)',
    };

    return darkModeColors[color] || color;
  }

  return color;
}
