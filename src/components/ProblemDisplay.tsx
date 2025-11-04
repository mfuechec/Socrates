/**
 * Problem Display with HTML-based annotations
 * More reliable than Fabric.js canvas approach
 */

import { Fragment, useMemo } from 'react';
import type { Annotation } from '@/types/whiteboard';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex types may be incomplete
import { InlineMath, BlockMath } from 'react-katex';

interface ProblemDisplayProps {
  problemText: string;
  currentState?: string;
  annotations?: Annotation[];
  darkMode: boolean;
}

interface ParsedPart {
  type: 'text' | 'inline' | 'block';
  content: string;
  annotation?: Annotation;
}

export default function ProblemDisplay({
  problemText,
  currentState,
  annotations = [],
  darkMode,
}: ProblemDisplayProps) {
  // Display current state if available, otherwise show original problem
  const displayText = currentState || problemText;

  // Parse text with LaTeX and apply annotations
  const parts = useMemo(() => {
    // First parse LaTeX
    const latexParts = parseLatex(displayText);

    // If no annotations, return as-is
    const textAnnotations = annotations.filter(
      (ann) => ann.target.mode === 'text' && ann.target.text
    );

    if (textAnnotations.length === 0) {
      return latexParts;
    }

    // Apply annotations to text parts only
    const result: ParsedPart[] = [];

    latexParts.forEach((part) => {
      if (part.type !== 'text') {
        // Keep LaTeX parts unchanged
        result.push(part);
        return;
      }

      // For text parts, check if any annotation applies
      let currentPos = 0;
      const text = part.content;
      let foundAnnotation = false;

      textAnnotations.forEach((annotation) => {
        const targetText = annotation.target.text;
        if (!targetText) return;

        const index = text.indexOf(targetText, currentPos);
        if (index === -1) return;

        foundAnnotation = true;

        // Add text before annotation
        if (index > currentPos) {
          result.push({
            type: 'text',
            content: text.substring(currentPos, index),
          });
        }

        // Add annotated text
        result.push({
          type: 'text',
          content: targetText,
          annotation,
        });

        currentPos = index + targetText.length;
      });

      // Add remaining text
      if (currentPos < text.length) {
        result.push({
          type: 'text',
          content: text.substring(currentPos),
        });
      } else if (!foundAnnotation) {
        // No annotation found in this text part
        result.push(part);
      }
    });

    return result;
  }, [displayText, annotations]);

  // Get CSS classes for annotation type
  const getAnnotationClasses = (annotation: Annotation): string => {
    const baseClasses = 'transition-all duration-200 px-1 rounded inline';
    const color = annotation.style?.color || 'yellow';

    switch (annotation.type) {
      case 'highlight':
        return `${baseClasses} ${
          color === 'yellow'
            ? 'bg-yellow-200 dark:bg-yellow-900/40'
            : color === 'blue'
            ? 'bg-blue-200 dark:bg-blue-900/40'
            : color === 'red'
            ? 'bg-red-200 dark:bg-red-900/40'
            : 'bg-green-200 dark:bg-green-900/40'
        }`;
      case 'circle':
        return `${baseClasses} ${
          color === 'green'
            ? 'ring-2 ring-green-500 dark:ring-green-400'
            : color === 'blue'
            ? 'ring-2 ring-blue-500 dark:ring-blue-400'
            : color === 'red'
            ? 'ring-2 ring-red-500 dark:ring-red-400'
            : 'ring-2 ring-yellow-500 dark:ring-yellow-400'
        }`;
      case 'underline':
        return `${baseClasses} ${
          color === 'green'
            ? 'border-b-2 border-green-500 dark:border-green-400'
            : color === 'blue'
            ? 'border-b-2 border-blue-500 dark:border-blue-400'
            : color === 'red'
            ? 'border-b-2 border-red-500 dark:border-red-400'
            : 'border-b-2 border-yellow-500 dark:border-yellow-400'
        }`;
      default:
        return baseClasses;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg font-mono text-lg ${
        darkMode
          ? 'bg-gray-800 text-gray-100'
          : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="whitespace-pre-wrap break-words inline-content">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            const textContent = part.content.split('\n').map((line, lineIdx, arr) => (
              <Fragment key={lineIdx}>
                {line}
                {lineIdx < arr.length - 1 && <br />}
              </Fragment>
            ));

            if (part.annotation) {
              return (
                <span key={idx} className={getAnnotationClasses(part.annotation)}>
                  {textContent}
                </span>
              );
            }
            return <Fragment key={idx}>{textContent}</Fragment>;
          } else if (part.type === 'inline') {
            try {
              const math = <InlineMath key={idx} math={part.content} />;
              if (part.annotation) {
                return (
                  <span key={idx} className={getAnnotationClasses(part.annotation)}>
                    {math}
                  </span>
                );
              }
              return math;
            } catch (error) {
              console.error('KaTeX inline math error:', error);
              return (
                <span key={idx} className="katex-error" title="Math rendering failed">
                  ${part.content}$
                </span>
              );
            }
          } else if (part.type === 'block') {
            try {
              return (
                <div key={idx} className="my-3">
                  <BlockMath math={part.content} />
                </div>
              );
            } catch (error) {
              console.error('KaTeX block math error:', error);
              return (
                <div key={idx} className="katex-error my-3" title="Math rendering failed">
                  $${part.content}$$
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    </div>
  );
}

// Parse content into text and LaTeX segments
function parseLatex(content: string): Array<{ type: 'text' | 'inline' | 'block'; content: string }> {
  const parts: Array<{ type: 'text' | 'inline' | 'block'; content: string }> = [];
  let currentPos = 0;

  // Regex to match:
  // Block: $$...$$ or \[...\]
  // Inline: $...$ or \(...\)
  // Block must be checked first to avoid matching as inline
  const blockRegex = /(\$\$(.*?)\$\$|\\\[(.*?)\\\])/gs;
  const inlineRegex = /(\$(.*?)\$|\\\((.*?)\\\))/g;

  // First, find all block math occurrences
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    // Extract content from either $$...$$ (group 2) or \[...\] (group 3)
    const mathContent = match[2] || match[3];
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: mathContent,
    });
  }

  // Then find all inline math (excluding positions inside block math)
  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  inlineRegex.lastIndex = 0; // Reset regex
  while ((match = inlineRegex.exec(content)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    // Check if this inline match is inside a block match
    const isInsideBlock = blockMatches.some(
      (block) => start >= block.start && end <= block.end
    );

    if (!isInsideBlock) {
      // Extract content from either $...$ (group 2) or \(...\) (group 3)
      const mathContent = match[2] || match[3];
      inlineMatches.push({
        start,
        end,
        content: mathContent,
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [
    ...blockMatches.map((m) => ({ ...m, type: 'block' as const })),
    ...inlineMatches.map((m) => ({ ...m, type: 'inline' as const })),
  ].sort((a, b) => a.start - b.start);

  // Build parts array
  allMatches.forEach((match) => {
    // Add text before this match
    if (currentPos < match.start) {
      const text = content.substring(currentPos, match.start);
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }

    // Add the math match
    parts.push({ type: match.type, content: match.content });
    currentPos = match.end;
  });

  // Add remaining text after last match
  if (currentPos < content.length) {
    const text = content.substring(currentPos);
    if (text) {
      parts.push({ type: 'text', content: text });
    }
  }

  // If no matches, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}
