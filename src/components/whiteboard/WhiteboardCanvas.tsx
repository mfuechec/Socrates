/**
 * WhiteboardCanvas Component
 * Hybrid approach: HTML/KaTeX for text, positioned overlays for annotations
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import type { Annotation } from '@/types/whiteboard';
import MathRenderer from '../MathRenderer';

interface WhiteboardCanvasProps {
  problemText: string;
  currentState?: string; // Current equation state (if student made progress)
  annotations: Annotation[];
  darkMode?: boolean;
}

interface AnnotationElement {
  id: string;
  annotation: Annotation;
  positions: { left: number; top: number; width: number; height: number }[];
}

export default function WhiteboardCanvas({
  problemText,
  currentState,
  annotations,
  darkMode = false,
}: WhiteboardCanvasProps) {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [annotationElements, setAnnotationElements] = useState<AnnotationElement[]>([]);

  // Display current state if available, otherwise show original problem
  const rawDisplayText = currentState || problemText;

  // Auto-wrap in $ delimiters if it contains LaTeX commands but no delimiters
  const displayText = autoWrapLatex(rawDisplayText);

  // Calculate annotation positions whenever text or annotations change
  useEffect(() => {
    if (!textContainerRef.current) return;

    const container = textContainerRef.current;
    const elements: AnnotationElement[] = [];

    annotations.forEach((ann, idx) => {
      if (ann.target.mode !== 'text' || !ann.target.text) {
        console.warn('Only text-mode annotations are supported');
        return;
      }

      // Find the target text in the container
      const positions = findTextPosition(container, ann.target.text);

      elements.push({
        id: `ann-${idx}`,
        annotation: ann,
        positions,
      });
    });

    setAnnotationElements(elements);
  }, [annotations, displayText]);

  return (
    <div className="relative my-4">
      {/* Original problem (if currentState exists) */}
      {currentState && (
        <div
          className={`text-sm font-mono mb-2 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          <MathRenderer content={autoWrapLatex(problemText)} />
        </div>
      )}

      {/* Main problem display with annotations */}
      <div className="relative">
        <div
          ref={textContainerRef}
          className={`font-mono text-2xl p-4 rounded-lg relative ${
            currentState
              ? darkMode
                ? 'text-blue-300 font-bold'
                : 'text-blue-600 font-bold'
              : darkMode
              ? 'text-gray-100'
              : 'text-gray-900'
          } ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
          style={{ wordWrap: 'break-word' }}
        >
          <MathRenderer content={displayText} />
        </div>

        {/* Annotation overlays - multiple per annotation if text spans lines */}
        {annotationElements.map((elem) =>
          elem.positions.map((position, posIdx) => (
            <AnnotationOverlay
              key={`${elem.id}-${posIdx}`}
              annotation={elem.annotation}
              position={position}
              darkMode={darkMode}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Find the position of target text within a container
 * Uses Range API for accurate positioning
 * Returns array of rectangles (one per line if text spans multiple lines)
 */
function findTextPosition(
  container: HTMLElement,
  targetText: string
): { left: number; top: number; width: number; height: number }[] {
  const text = container.textContent || '';
  const normalizedTarget = targetText.replace(/\s+/g, '');
  const normalizedText = text.replace(/\s+/g, '');

  // Diagnostic logging
  console.log('=== findTextPosition Debug ===');
  console.log('Target text:', targetText);
  console.log('Normalized target:', normalizedTarget);
  console.log('Container textContent:', text);
  console.log('Normalized container text:', normalizedText);
  console.log('Index found:', normalizedText.indexOf(normalizedTarget));

  const index = normalizedText.indexOf(normalizedTarget);
  if (index === -1) {
    console.warn(`Target text "${targetText}" not found`);
    console.warn('Container textContent was:', text);
    return [];
  }

  // Map normalized index back to original text
  const startIndex = mapNormalizedToOriginalIndex(text, index);
  const endIndex = mapNormalizedToOriginalIndex(text, index + normalizedTarget.length);

  try {
    // Create a range for the target text
    const range = document.createRange();
    const textNode = findTextNode(container, startIndex, endIndex);

    if (!textNode) {
      console.warn('Could not find text node');
      return [];
    }

    range.setStart(textNode.node, textNode.start);
    range.setEnd(textNode.node, textNode.end);

    // Get all bounding rectangles (one per line for multi-line text)
    const rects = range.getClientRects();
    const containerRect = container.getBoundingClientRect();

    console.log(`Found ${rects.length} rectangle(s) for "${targetText}"`);

    // Convert DOMRectList to array of position objects
    return Array.from(rects).map((rect) => ({
      left: rect.left - containerRect.left,
      top: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  } catch (error) {
    console.error('Error finding text position:', error);
    return [];
  }
}

/**
 * Map normalized index (spaces removed) back to original index (with spaces)
 */
function mapNormalizedToOriginalIndex(originalText: string, normalizedIndex: number): number {
  let origIdx = 0;
  let normIdx = 0;

  while (normIdx < normalizedIndex && origIdx < originalText.length) {
    if (originalText[origIdx] !== ' ' && originalText[origIdx] !== '\t' && originalText[origIdx] !== '\n') {
      normIdx++;
    }
    origIdx++;
  }

  return origIdx;
}

/**
 * Find the text node containing the target range
 */
function findTextNode(
  container: HTMLElement,
  startIndex: number,
  endIndex: number
): { node: Node; start: number; end: number } | null {
  let currentIndex = 0;

  function traverse(node: Node): { node: Node; start: number; end: number } | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeLength = node.textContent?.length || 0;
      const nodeStart = currentIndex;
      const nodeEnd = currentIndex + nodeLength;

      if (startIndex >= nodeStart && endIndex <= nodeEnd) {
        return {
          node,
          start: startIndex - nodeStart,
          end: endIndex - nodeStart,
        };
      }

      currentIndex += nodeLength;
    } else {
      for (const child of Array.from(node.childNodes)) {
        const result = traverse(child);
        if (result) return result;
      }
    }

    return null;
  }

  return traverse(container);
}

/**
 * Annotation overlay component
 */
function AnnotationOverlay({
  annotation,
  position,
  darkMode,
}: {
  annotation: Annotation;
  position: { left: number; top: number; width: number; height: number };
  darkMode: boolean;
}) {
  const getAnnotationStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
      pointerEvents: 'none',
      transition: 'all 0.2s ease',
    };

    const color = annotation.style?.color || 'yellow';

    switch (annotation.type) {
      case 'highlight':
        return {
          ...baseStyle,
          backgroundColor: getColor(color, darkMode),
          opacity: annotation.style?.opacity ?? 0.3,
          borderRadius: '2px',
        };

      case 'circle':
        return {
          ...baseStyle,
          border: `${annotation.style?.strokeWidth ?? 2}px solid ${getColor(color, darkMode)}`,
          borderRadius: '50%',
          left: position.left - 5,
          top: position.top - 5,
          width: position.width + 10,
          height: position.height + 10,
        };

      case 'underline':
        return {
          ...baseStyle,
          borderBottom: `${annotation.style?.strokeWidth ?? 2}px solid ${getColor(color, darkMode)}`,
          top: position.top + position.height,
          height: 0,
        };

      default:
        return baseStyle;
    }
  };

  return <div style={getAnnotationStyle()} />;
}

/**
 * Get annotation color with dark mode support
 */
function getColor(color: string, darkMode: boolean): string {
  if (darkMode) {
    const darkModeColors: Record<string, string> = {
      yellow: 'rgba(253, 224, 71, 0.5)',
      red: 'rgb(239, 68, 68)',
      blue: 'rgb(59, 130, 246)',
      green: 'rgb(34, 197, 94)',
      purple: 'rgb(168, 85, 247)',
      black: 'rgb(243, 244, 246)',
    };
    return darkModeColors[color] || color;
  }

  return color;
}

/**
 * Auto-wrap text in \(...\) delimiters if it contains LaTeX commands
 */
function autoWrapLatex(text: string): string {
  // Check if already wrapped in any math delimiters
  if (text.includes('\\(') || text.includes('$')) {
    return text;
  }

  // Check if contains common LaTeX commands
  const latexCommands = [
    '\\frac',
    '\\sqrt',
    '\\sum',
    '\\int',
    '\\prod',
    '\\alpha',
    '\\beta',
    '\\gamma',
    '\\theta',
    '\\pi',
    '\\Delta',
    '\\infty',
    '\\leq',
    '\\geq',
    '\\neq',
    '\\cdot',
    '\\times',
    '\\div',
    '\\pm',
  ];

  const hasLatex = latexCommands.some((cmd) => text.includes(cmd));

  if (hasLatex) {
    return `\\(${text}\\)`;
  }

  return text;
}
