import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {QuestionCard} from './QuestionCard';
import {useQuizStore} from '../store/useQuizStore';

// Mock the store
vi.mock('../store/useQuizStore', () => ({
    useQuizStore: vi.fn()
}));

// Mock sub-components to simplify testing
vi.mock('./inputs/MultipleChoiceInput', () => ({
    MultipleChoiceInput: ({onAnswer}: {onAnswer: (answer: number) => void}) => (
        <button onClick={() => onAnswer(0)}>Select Option A</button>
    )
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

describe('QuestionCard', () => {
    const mockSubmitAnswer = vi.fn();
    const mockSkipQuestion = vi.fn();
    const mockNextQuestion = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useQuizStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            submitAnswer: mockSubmitAnswer,
            skipQuestion: mockSkipQuestion
        });
        (useQuizStore as unknown as {getState: () => {nextQuestion: () => void}}).getState = () => ({
            nextQuestion: mockNextQuestion
        });
    });

    it('should render question prompt', () => {
        const question = {
            id: '1',
            topicId: 't1',
            type: 'multiple_choice' as const,
            prompt: 'What is the capital of France?',
            choices: ['Paris', 'London'],
            answerIndex: 0,
            explanation: ''
        };

        render(<QuestionCard question={question} />);
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    });

    it('should handle answer submission', () => {
        const question = {
            id: '1',
            topicId: 't1',
            type: 'multiple_choice' as const,
            prompt: 'Q1',
            choices: ['A', 'B'],
            answerIndex: 0,
            explanation: ''
        };

        mockSubmitAnswer.mockReturnValue({correct: true});

        render(<QuestionCard question={question} />);

        fireEvent.click(screen.getByText('Select Option A'));

        expect(mockSubmitAnswer).toHaveBeenCalledWith(0);
        expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('should handle skipping', () => {
        const question = {
            id: '1',
            topicId: 't1',
            type: 'multiple_choice' as const,
            prompt: 'Q1',
            choices: ['A', 'B'],
            answerIndex: 0,
            explanation: ''
        };

        render(<QuestionCard question={question} />);

        fireEvent.click(screen.getByText('Skip'));

        expect(mockSkipQuestion).toHaveBeenCalled();
    });
});
