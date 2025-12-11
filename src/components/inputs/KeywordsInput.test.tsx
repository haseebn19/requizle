import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {KeywordsInput} from './KeywordsInput';
import type {KeywordsQuestion} from '../../types';

describe('KeywordsInput', () => {
    const mockOnAnswer = vi.fn();

    const createQuestion = (overrides: Partial<KeywordsQuestion> = {}): KeywordsQuestion => ({
        id: 'kw1',
        type: 'keywords',
        topicId: 't1',
        prompt: 'What is the capital of France?',
        answer: 'Paris',
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render input field', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    });

    it('should call onAnswer when form is submitted', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const input = screen.getByPlaceholderText('Type your answer here...');
        fireEvent.change(input, {target: {value: 'Paris'}});
        fireEvent.submit(input.closest('form')!);

        expect(mockOnAnswer).toHaveBeenCalledWith('Paris');
    });

    it('should trim whitespace from answer', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const input = screen.getByPlaceholderText('Type your answer here...');
        fireEvent.change(input, {target: {value: '  Paris  '}});
        fireEvent.submit(input.closest('form')!);

        expect(mockOnAnswer).toHaveBeenCalledWith('Paris');
    });

    it('should not submit empty answer', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const input = screen.getByPlaceholderText('Type your answer here...');
        fireEvent.change(input, {target: {value: '   '}});
        fireEvent.submit(input.closest('form')!);

        expect(mockOnAnswer).not.toHaveBeenCalled();
    });

    it('should show submitted answer when disabled', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={true}
                submittedAnswer="London"
            />
        );

        const input = screen.getByPlaceholderText('Type your answer here...') as HTMLInputElement;
        expect(input.value).toBe('London');
        expect(input).toBeDisabled();
    });

    it('should disable submit button when input is empty', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('should enable submit button when input has value', () => {
        render(
            <KeywordsInput
                question={createQuestion()}
                onAnswer={mockOnAnswer}
                disabled={false}
                submittedAnswer={null}
            />
        );

        const input = screen.getByPlaceholderText('Type your answer here...');
        fireEvent.change(input, {target: {value: 'Paris'}});

        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
    });
});
