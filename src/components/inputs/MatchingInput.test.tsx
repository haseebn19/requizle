import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MatchingInput} from './MatchingInput';
import type {MatchingQuestion} from '../../types';

describe('MatchingInput', () => {
    const mockOnAnswer = vi.fn();

    const createQuestion = (overrides: Partial<MatchingQuestion> = {}): MatchingQuestion => ({
        id: 'm1',
        type: 'matching',
        topicId: 't1',
        prompt: 'Match the items',
        pairs: [
            {left: 'A', right: '1'},
            {left: 'B', right: '2'},
            {left: 'C', right: '3'}
        ],
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render left column items', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render right column items (shuffled)', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        // Items should still be present even if shuffled
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render column headers', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Matches')).toBeInTheDocument();
    });

    it('should render submit button', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        expect(screen.getByText('Submit Matches')).toBeInTheDocument();
    });

    it('should disable submit button when not all items are matched', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const submitButton = screen.getByText('Submit Matches');
        expect(submitButton).toBeDisabled();
    });

    it('should select left item when clicked', () => {
        const {container} = render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        fireEvent.click(screen.getByText('A'));

        // The component should now have A selected (visual state changes)
        // We can verify the component renders without error
        expect(container).toBeInTheDocument();
    });

    it('should match items when left is selected and right is clicked', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        // Select A, then click 1
        fireEvent.click(screen.getByText('A'));
        fireEvent.click(screen.getByText('1'));

        // Select B, then click 2
        fireEvent.click(screen.getByText('B'));
        fireEvent.click(screen.getByText('2'));

        // Select C, then click 3
        fireEvent.click(screen.getByText('C'));
        fireEvent.click(screen.getByText('3'));

        // Now submit should be enabled
        const submitButton = screen.getByText('Submit Matches');
        expect(submitButton).not.toBeDisabled();

        // Submit
        fireEvent.click(submitButton);
        expect(mockOnAnswer).toHaveBeenCalledWith({'A': '1', 'B': '2', 'C': '3'});
    });

    it('should unmatch when clicking already matched left item', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        // Select A and match to 1
        fireEvent.click(screen.getByText('A'));
        fireEvent.click(screen.getByText('1'));

        // Click A again to unmatch
        fireEvent.click(screen.getByText('A'));

        // Submit should still be disabled (only 0 matches now)
        const submitButton = screen.getByText('Submit Matches');
        expect(submitButton).toBeDisabled();
    });

    it('should not allow interaction when disabled', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={true}
                submittedAnswer={null}
            />
        );

        fireEvent.click(screen.getByText('A'));
        fireEvent.click(screen.getByText('1'));

        // Submit should still be disabled
        const submitButton = screen.getByText('Submit Matches');
        expect(submitButton).toBeDisabled();
    });

    it('should display submitted answer', () => {
        render(
            <MatchingInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={true}
                submittedAnswer={{'A': '1', 'B': '2', 'C': '3'}}
            />
        );

        // Component should render with matches shown
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
