import type {Question, QuestionProgress, Subject, StudyMode} from '../types';

export const calculateMastery = (
    questions: Question[],
    progressMap: Record<string, QuestionProgress>
): number => {
    if (questions.length === 0) return 0;
    const masteredCount = questions.filter(q => progressMap[q.id]?.mastered).length;
    return Math.round((masteredCount / questions.length) * 100);
};

export const getActiveQuestions = (
    subject: Subject,
    selectedTopicIds: string[]
): Question[] => {
    if (!subject) return [];

    // If no topics selected, all are active
    const effectiveTopicIds = selectedTopicIds.length > 0
        ? selectedTopicIds
        : subject.topics.map(t => t.id);

    return subject.topics
        .filter(t => effectiveTopicIds.includes(t.id))
        .flatMap(t => t.questions);
};

export const generateQueue = (
    questions: Question[],
    progressMap: Record<string, QuestionProgress>,
    mode: StudyMode,
    includeMastered: boolean
): string[] => {
    let candidates = questions;

    if (!includeMastered) {
        candidates = candidates.filter(q => !progressMap[q.id]?.mastered);
    }

    if (candidates.length === 0) return [];

    // Create a shallow copy to sort/shuffle
    const queue = [...candidates];

    if (mode === 'random') {
        // Fisher-Yates shuffle
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
    } else {
        // Topic order is preserved by default if we just flatMap topics in order
        // But we need to ensure 'questions' passed in is already in topic order
        // The getActiveQuestions function preserves topic order
    }

    return queue.map(q => q.id);
};

export const checkAnswer = (question: Question, userAnswer: unknown): boolean => {
    switch (question.type) {
        case 'multiple_choice':
            return userAnswer === question.answerIndex;

        case 'multiple_answer': {
            // userAnswer is number[] (indices)
            if (!Array.isArray(userAnswer)) return false;
            // Check if lengths match and all selected indices are correct
            // Sort both to ensure order doesn't matter
            const sortedUser = [...userAnswer].sort((a, b) => a - b);
            const sortedCorrect = [...question.answerIndices].sort((a, b) => a - b);
            return sortedUser.length === sortedCorrect.length &&
                sortedUser.every((val, index) => val === sortedCorrect[index]);
        }

        case 'true_false':
            return userAnswer === question.answer;

        case 'short_answer': {
            const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
            const input = String(userAnswer).trim();

            if (question.caseSensitive) {
                return answers.some(a => a.trim() === input);
            } else {
                return answers.some(a => a.trim().toLowerCase() === input.toLowerCase());
            }
        }

        case 'matching': {
            // userAnswer is Record<left, right>
            if (!userAnswer || typeof userAnswer !== 'object') return false;
            return question.pairs.every(pair => userAnswer[pair.left] === pair.right);
        }

        case 'word_bank': {
            // userAnswer is string[] (filled slots in order)
            if (!Array.isArray(userAnswer)) return false;
            return userAnswer.every((word, index) => word === question.answers[index]);
        }

        default:
            return false;
    }
};
