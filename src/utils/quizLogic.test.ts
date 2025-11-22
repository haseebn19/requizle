import {describe, it, expect} from 'vitest';
import {generateQueue, checkAnswer, getActiveQuestions} from './quizLogic';
import type {Question, Subject, QuestionProgress} from '../types';

describe('quizLogic', () => {
    describe('checkAnswer', () => {
        it('should return true for correct multiple choice answer', () => {
            const question: any = {
                id: '1',
                type: 'multiple_choice',
                text: 'Q1',
                options: ['A', 'B', 'C'],
                answerIndex: 0,
                explanation: 'Exp'
            };
            expect(checkAnswer(question, 0)).toBe(true);
            expect(checkAnswer(question, 1)).toBe(false);
        });

        it('should return true for correct true/false answer', () => {
            const question: any = {
                id: '2',
                type: 'true_false',
                text: 'Q2',
                answer: true,
                explanation: 'Exp'
            };
            expect(checkAnswer(question, true)).toBe(true);
            expect(checkAnswer(question, false)).toBe(false);
        });
    });

    describe('getActiveQuestions', () => {
        const subject: Subject = {
            id: 's1',
            name: 'Subject 1',
            topics: [
                {
                    id: 't1',
                    name: 'Topic 1',
                    questions: [
                        {id: 'q1', type: 'true_false', prompt: 'Q1', answer: true, explanation: ''} as any,
                        {id: 'q2', type: 'true_false', prompt: 'Q2', answer: true, explanation: ''} as any
                    ]
                },
                {
                    id: 't2',
                    name: 'Topic 2',
                    questions: [
                        {id: 'q3', type: 'true_false', prompt: 'Q3', answer: true, explanation: ''} as any
                    ]
                }
            ]
        };

        it('should return all questions if no topics selected', () => {
            const questions = getActiveQuestions(subject, []);
            expect(questions).toHaveLength(3);
        });

        it('should return questions only for selected topics', () => {
            const questions = getActiveQuestions(subject, ['t1']);
            expect(questions).toHaveLength(2);
            expect(questions.map(q => q.id)).toContain('q1');
            expect(questions.map(q => q.id)).toContain('q2');
        });
    });

    describe('generateQueue', () => {
        const questions: Question[] = [
            {id: 'q1', type: 'true_false', prompt: 'Q1', answer: true, explanation: ''} as any,
            {id: 'q2', type: 'true_false', prompt: 'Q2', answer: true, explanation: ''} as any,
            {id: 'q3', type: 'true_false', prompt: 'Q3', answer: true, explanation: ''} as any
        ];

        const progress: Record<string, QuestionProgress> = {
            'q1': {id: 'q1', attempts: 1, correctStreak: 3, mastered: true},
            'q2': {id: 'q2', attempts: 1, correctStreak: 0, mastered: false}
        };

        it('should generate a queue of question IDs', () => {
            const queue = generateQueue(questions, {}, 'random', false);
            expect(queue).toHaveLength(3);
            expect(queue).toContain('q1');
            expect(queue).toContain('q2');
            expect(queue).toContain('q3');
        });

        it('should exclude mastered questions if includeMastered is false', () => {
            const queue = generateQueue(questions, progress, 'random', false);
            expect(queue).not.toContain('q1');
            expect(queue).toContain('q2');
            expect(queue).toContain('q3');
        });

        it('should include mastered questions if includeMastered is true', () => {
            const queue = generateQueue(questions, progress, 'random', true);
            expect(queue).toContain('q1');
        });
    });
});
