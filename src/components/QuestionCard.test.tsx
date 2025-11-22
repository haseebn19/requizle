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
    MultipleChoiceInput: ({onAnswer}: any) => (
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
        (useQuizStore as any).mockReturnValue({
            submitAnswer: mockSubmitAnswer,
            skipQuestion: mockSkipQuestion
        });
        (useQuizStore as any).getState = () => ({
            nextQuestion: mockNextQuestion
        });
    });

    it('should render question prompt', () => {
        const question: any = {
            id: '1',
            type: 'multiple_choice',
            prompt: 'What is the capital of France?',
            choices: ['Paris', 'London'],
            answerIndex: 0
        };

        render(<QuestionCard question={question} />);
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    });

    it('should handle answer submission', () => {
        const question: any = {
            id: '1',
            type: 'multiple_choice',
            prompt: 'Q1',
            choices: ['A', 'B'],
            answerIndex: 0
        };

        mockSubmitAnswer.mockReturnValue({correct: true});

        render(<QuestionCard question={question} />);

        fireEvent.click(screen.getByText('Select Option A'));

        expect(mockSubmitAnswer).toHaveBeenCalledWith(0);
        expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('should handle skipping', () => {
        const question: any = {
            id: '1',
            type: 'multiple_choice',
            prompt: 'Q1',
            choices: ['A', 'B'],
            answerIndex: 0
        };

        render(<QuestionCard question={question} />);

        fireEvent.click(screen.getByText('Skip'));

        expect(mockSkipQuestion).toHaveBeenCalled();
    });
});
