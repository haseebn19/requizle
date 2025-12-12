import React from 'react';
import 'katex/dist/katex.min.css';
import {InlineMath, BlockMath} from 'react-katex';

interface LatexProps {
    children: string;
    className?: string;
}

/**
 * Renders text with LaTeX support using Anki-style delimiters.
 * - Inline math: \(...\)
 * - Block math: \[...\]
 */
export const Latex: React.FC<LatexProps> = ({children, className}) => {
    if (!children) return null;

    // Split by block math first (\[...\]), then handle inline math (\(...\))
    const parts: React.ReactNode[] = [];
    const text = children;
    let key = 0;

    // Process block math first: \[...\]
    const blockRegex = /\\\[([\s\S]*?)\\\]/g;
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            const textBefore = text.slice(lastIndex, match.index);
            parts.push(...parseInlineMath(textBefore, key));
            key += 100; // Leave room for inline math keys
        }

        // Add block math
        parts.push(
            <div key={`block-${key++}`} className="my-4">
                <BlockMath math={match[1].trim()} errorColor="#cc0000" />
            </div>
        );

        lastIndex = match.index + match[0].length;
    }

    // Process remaining text for inline math
    if (lastIndex < text.length) {
        parts.push(...parseInlineMath(text.slice(lastIndex), key));
    }

    return <span className={className}>{parts}</span>;
};

function parseInlineMath(text: string, startKey: number): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Match \(...\) - inline math with Anki-style delimiters
    const inlineRegex = /\\\(([\s\S]*?)\\\)/g;
    let lastIndex = 0;
    let match;
    let key = startKey;

    while ((match = inlineRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }

        // Add inline math - KaTeX will show error in red if invalid
        parts.push(<InlineMath key={key++} math={match[1]} errorColor="#cc0000" />);

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts;
}
