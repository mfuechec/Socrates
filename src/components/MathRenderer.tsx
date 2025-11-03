/**
 * Math renderer component
 * Parses and renders LaTeX equations using KaTeX
 * Supports inline: $...$ or \(...\)
 * Supports block: $$...$$ or \[...\]
 */

import { Fragment } from 'react';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex types may be incomplete
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  content: string;
}

export default function MathRenderer({ content }: MathRendererProps) {
  // Split content by LaTeX delimiters
  const parts = parseLatex(content);

  return (
    <div className="math-content">
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          // Plain text - preserve whitespace and newlines
          return (
            <Fragment key={idx}>
              {part.content.split('\n').map((line, lineIdx, arr) => (
                <Fragment key={lineIdx}>
                  {line}
                  {lineIdx < arr.length - 1 && <br />}
                </Fragment>
              ))}
            </Fragment>
          );
        } else if (part.type === 'inline') {
          // Inline math: $...$
          try {
            return <InlineMath key={idx} math={part.content} />;
          } catch (error) {
            console.error('KaTeX inline math error:', error);
            return (
              <span key={idx} className="katex-error" title="Math rendering failed">
                ${part.content}$
              </span>
            );
          }
        } else if (part.type === 'block') {
          // Block math: $$...$$
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
