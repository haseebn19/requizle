/**
 * Tests for Latex component
 * Tests Anki-style math delimiters parsing and rendering
 */
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Latex} from './Latex';

// Mock react-katex to avoid actual KaTeX rendering in tests
vi.mock('react-katex', () => ({
    InlineMath: ({math}: {math: string}) => <span data-testid="inline-math">{`[INLINE:${math}]`}</span>,
    BlockMath: ({math}: {math: string}) => <div data-testid="block-math">{`[BLOCK:${math}]`}</div>
}));

describe('Latex', () => {
    describe('plain text', () => {
        it('should render plain text without math', () => {
            render(<Latex>Hello world</Latex>);

            expect(screen.getByText('Hello world')).toBeInTheDocument();
        });

        it('should render empty content safely', () => {
            const {container} = render(<Latex>{''}</Latex>);

            expect(container.firstChild).toBeNull();
        });

        it('should preserve dollar signs in plain text', () => {
            render(<Latex>The price is $50 and $100</Latex>);

            expect(screen.getByText('The price is $50 and $100')).toBeInTheDocument();
        });

        it('should apply className to wrapper', () => {
            const {container} = render(<Latex className="custom-class">Hello</Latex>);

            expect(container.firstChild).toHaveClass('custom-class');
        });
    });

    describe('inline math \\(...\\)', () => {
        it('should render inline math', () => {
            render(<Latex>{'The formula is \\(x^2\\)'}</Latex>);

            expect(screen.getByTestId('inline-math')).toHaveTextContent('[INLINE:x^2]');
        });

        it('should render multiple inline math expressions', () => {
            render(<Latex>{'\\(a\\) and \\(b\\) are variables'}</Latex>);

            const inlineElements = screen.getAllByTestId('inline-math');
            expect(inlineElements).toHaveLength(2);
            expect(inlineElements[0]).toHaveTextContent('[INLINE:a]');
            expect(inlineElements[1]).toHaveTextContent('[INLINE:b]');
        });

        it('should handle complex inline math', () => {
            render(<Latex>{'Calculate \\(\\frac{a}{b} + \\sqrt{c}\\)'}</Latex>);

            expect(screen.getByTestId('inline-math')).toHaveTextContent('[INLINE:\\frac{a}{b} + \\sqrt{c}]');
        });

        it('should preserve text around inline math', () => {
            render(<Latex>{'Before \\(x\\) after'}</Latex>);

            expect(screen.getByText('Before')).toBeInTheDocument();
            expect(screen.getByText('after')).toBeInTheDocument();
            expect(screen.getByTestId('inline-math')).toBeInTheDocument();
        });
    });

    describe('block math \\[...\\]', () => {
        it('should render block math', () => {
            render(<Latex>{'Check this: \\[E = mc^2\\]'}</Latex>);

            expect(screen.getByTestId('block-math')).toHaveTextContent('[BLOCK:E = mc^2]');
        });

        it('should render multiple block math expressions', () => {
            render(<Latex>{'\\[a^2\\] and \\[b^2\\]'}</Latex>);

            const blockElements = screen.getAllByTestId('block-math');
            expect(blockElements).toHaveLength(2);
        });

        it('should handle multiline block math', () => {
            render(<Latex>{'\\[a + b\\]'}</Latex>);

            expect(screen.getByTestId('block-math')).toHaveTextContent('[BLOCK:a + b]');
        });
    });

    describe('mixed content', () => {
        it('should handle inline and block math together', () => {
            render(<Latex>{'Text with \\(inline\\) and block: \\[block\\] more text'}</Latex>);

            expect(screen.getByTestId('inline-math')).toHaveTextContent('[INLINE:inline]');
            expect(screen.getByTestId('block-math')).toHaveTextContent('[BLOCK:block]');
            expect(screen.getByText('Text with')).toBeInTheDocument();
            expect(screen.getByText('more text')).toBeInTheDocument();
        });

        it('should handle complex mixed content', () => {
            const content = 'The quadratic formula \\(x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\) can be derived from: \\[ax^2 + bx + c = 0\\]';
            render(<Latex>{content}</Latex>);

            expect(screen.getByTestId('inline-math')).toBeInTheDocument();
            expect(screen.getByTestId('block-math')).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('should handle unclosed delimiters as plain text', () => {
            render(<Latex>{'Unclosed \\(math here'}</Latex>);

            // Should render as plain text since delimiter is not closed
            expect(screen.queryByTestId('inline-math')).toBeNull();
            expect(screen.getByText(/Unclosed/)).toBeInTheDocument();
        });

        it('should handle escaped backslashes', () => {
            render(<Latex>{'Normal text with \\\\ backslash'}</Latex>);

            // Should not interpret as math
            expect(screen.queryByTestId('inline-math')).toBeNull();
        });

        it('should handle empty math expressions', () => {
            render(<Latex>{'Empty: \\(\\) inline'}</Latex>);

            expect(screen.getByTestId('inline-math')).toHaveTextContent('[INLINE:]');
        });

        it('should handle adjacent math expressions', () => {
            render(<Latex>{'\\(a\\)\\(b\\)'}</Latex>);

            const inlineElements = screen.getAllByTestId('inline-math');
            expect(inlineElements).toHaveLength(2);
        });
    });
});
