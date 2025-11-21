import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {Subject, ProgressMap, SessionState, StudyMode, QuestionProgress} from '../types';
import {generateQueue, getActiveQuestions, checkAnswer} from '../utils/quizLogic';

interface QuizState {
    subjects: Subject[];
    progress: ProgressMap;
    session: SessionState;

    // Actions
    setSubjects: (subjects: Subject[]) => void;
    importSubjects: (newSubjects: Subject[]) => void;

    startSession: (subjectId: string) => void;
    toggleTopic: (topicId: string) => void;
    setMode: (mode: StudyMode) => void;
    setIncludeMastered: (include: boolean) => void;
    restartQueue: () => void;

    submitAnswer: (answer: any) => {correct: boolean; explanation?: string};
    skipQuestion: () => void;
    nextQuestion: () => void;

    resetSubjectProgress: (subjectId: string) => void;
}

// Helper to get current subject from state
const getCurrentSubject = (state: QuizState) =>
    state.subjects.find(s => s.id === state.session.subjectId);

// Helper to flatten progress map for a subject
function flattenProgress(subjectProgress: Record<string, Record<string, QuestionProgress>> | undefined): Record<string, QuestionProgress> {
    if (!subjectProgress) return {};
    const flat: Record<string, QuestionProgress> = {};
    Object.values(subjectProgress).forEach(topicProgress => {
        Object.assign(flat, topicProgress);
    });
    return flat;
}

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            subjects: [],
            progress: {},
            session: {
                subjectId: null,
                selectedTopicIds: [],
                mode: 'random',
                includeMastered: false,
                queue: [],
                currentQuestionId: null,
            },

            setSubjects: (subjects) => set({subjects}),

            importSubjects: (newSubjects) => set((state) => ({
                subjects: [...state.subjects, ...newSubjects]
            })),

            startSession: (subjectId) => {
                set((state) => {
                    const subject = state.subjects.find(s => s.id === subjectId);
                    if (!subject) return state;

                    const newState = {
                        ...state,
                        session: {
                            ...state.session,
                            subjectId,
                            selectedTopicIds: [], // Reset selection to "all"
                            queue: [],
                            currentQuestionId: null
                        }
                    };

                    // Generate initial queue
                    const questions = getActiveQuestions(subject, []);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(state.progress[subjectId]),
                        newState.session.mode,
                        newState.session.includeMastered
                    );

                    return {
                        ...newState,
                        session: {
                            ...newState.session,
                            queue: queue.slice(1),
                            currentQuestionId: queue[0] || null
                        }
                    };
                });
            },

            toggleTopic: (topicId) => {
                set((state) => {
                    const currentSelected = state.session.selectedTopicIds;
                    const newSelected = currentSelected.includes(topicId)
                        ? currentSelected.filter(id => id !== topicId)
                        : [...currentSelected, topicId];

                    // Rebuild queue
                    const subject = getCurrentSubject(state as QuizState);
                    if (!subject) return state;

                    const questions = getActiveQuestions(subject, newSelected);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(state.progress[subject.id]),
                        state.session.mode,
                        state.session.includeMastered
                    );

                    return {
                        ...state,
                        session: {
                            ...state.session,
                            selectedTopicIds: newSelected,
                            queue: queue.slice(1),
                            currentQuestionId: queue[0] || null
                        }
                    };
                });
            },

            setMode: (mode) => {
                set((state) => {
                    const subject = getCurrentSubject(state as QuizState);
                    if (!subject) return {session: {...state.session, mode}} as any;

                    const questions = getActiveQuestions(subject, state.session.selectedTopicIds);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(state.progress[subject.id]),
                        mode,
                        state.session.includeMastered
                    );

                    return {
                        ...state,
                        session: {
                            ...state.session,
                            mode,
                            queue: queue.slice(1),
                            currentQuestionId: queue[0] || null
                        }
                    };
                });
            },

            setIncludeMastered: (include) => {
                set((state) => {
                    return {
                        session: {...state.session, includeMastered: include}
                    };
                });
            },

            restartQueue: () => {
                set((state) => {
                    const subject = getCurrentSubject(state as QuizState);
                    if (!subject) return state;

                    const questions = getActiveQuestions(subject, state.session.selectedTopicIds);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(state.progress[subject.id]),
                        state.session.mode,
                        state.session.includeMastered
                    );

                    return {
                        session: {
                            ...state.session,
                            queue: queue.slice(1),
                            currentQuestionId: queue[0] || null
                        }
                    };
                });
            },

            submitAnswer: (answer) => {
                const state = get();
                const subject = getCurrentSubject(state);
                const {currentQuestionId} = state.session;

                if (!subject || !currentQuestionId) return {correct: false};

                // Find question
                let question = null;
                let topicId = null;
                for (const topic of subject.topics) {
                    const q = topic.questions.find(q => q.id === currentQuestionId);
                    if (q) {
                        question = q;
                        topicId = topic.id;
                        break;
                    }
                }

                if (!question || !topicId) return {correct: false};

                const isCorrect = checkAnswer(question, answer);

                // Update progress
                set((state) => {
                    const subjectProgress = state.progress[subject.id] || {};
                    const topicProgress = subjectProgress[topicId!] || {};
                    const currentQProgress = topicProgress[currentQuestionId] || {
                        id: currentQuestionId,
                        correctStreak: 0,
                        attempts: 0,
                        mastered: false
                    };

                    const newQProgress: QuestionProgress = {
                        ...currentQProgress,
                        attempts: currentQProgress.attempts + 1,
                        correctStreak: isCorrect ? currentQProgress.correctStreak + 1 : 0,
                        mastered: isCorrect
                    };

                    const newProgress = {
                        ...state.progress,
                        [subject.id]: {
                            ...subjectProgress,
                            [topicId!]: {
                                ...topicProgress,
                                [currentQuestionId]: newQProgress
                            }
                        }
                    };

                    // Queue management
                    let newQueue = [...state.session.queue];

                    if (!isCorrect) {
                        // Reinsert 4-6 positions later
                        const offset = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
                        const insertIndex = Math.min(offset, newQueue.length);
                        newQueue.splice(insertIndex, 0, currentQuestionId);
                    }

                    // Don't advance yet, wait for nextQuestion
                    return {
                        progress: newProgress,
                        session: {
                            ...state.session,
                            queue: newQueue,
                            // currentQuestionId stays same
                        }
                    };
                });

                return {correct: isCorrect, explanation: question.explanation};
            },

            nextQuestion: () => {
                set((state) => {
                    const newQueue = [...state.session.queue];
                    const nextQuestionId = newQueue.shift() || null;

                    return {
                        session: {
                            ...state.session,
                            queue: newQueue,
                            currentQuestionId: nextQuestionId
                        }
                    };
                });
            },

            skipQuestion: () => {
                const state = get();
                const subject = getCurrentSubject(state);
                const {currentQuestionId} = state.session;
                if (!subject || !currentQuestionId) return;

                let topicId = null;
                for (const topic of subject.topics) {
                    if (topic.questions.some(q => q.id === currentQuestionId)) {
                        topicId = topic.id;
                        break;
                    }
                }
                if (!topicId) return;

                set((state) => {
                    const subjectProgress = state.progress[subject.id] || {};
                    const topicProgress = subjectProgress[topicId!] || {};
                    const currentQProgress = topicProgress[currentQuestionId] || {
                        id: currentQuestionId,
                        correctStreak: 0,
                        attempts: 0,
                        mastered: false
                    };

                    const newQProgress = {
                        ...currentQProgress,
                        attempts: currentQProgress.attempts + 1,
                        correctStreak: 0,
                        mastered: false
                    };

                    const newProgress = {
                        ...state.progress,
                        [subject.id]: {
                            ...subjectProgress,
                            [topicId!]: {
                                ...topicProgress,
                                [currentQuestionId]: newQProgress
                            }
                        }
                    };

                    let newQueue = [...state.session.queue];
                    const offset = Math.floor(Math.random() * 3) + 4;
                    const insertIndex = Math.min(offset, newQueue.length);
                    newQueue.splice(insertIndex, 0, currentQuestionId);

                    const nextQuestionId = newQueue.shift() || null;

                    return {
                        progress: newProgress,
                        session: {
                            ...state.session,
                            queue: newQueue,
                            currentQuestionId: nextQuestionId
                        }
                    };
                });
            },

            resetSubjectProgress: (subjectId) => {
                set((state) => {
                    const newProgress = {...state.progress};
                    delete newProgress[subjectId];

                    let newSession = state.session;
                    if (state.session.subjectId === subjectId) {
                        const subject = state.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            const questions = getActiveQuestions(subject, state.session.selectedTopicIds);
                            const queue = generateQueue(questions, {}, state.session.mode, state.session.includeMastered);
                            newSession = {
                                ...state.session,
                                queue: queue.slice(1),
                                currentQuestionId: queue[0] || null
                            };
                        }
                    }

                    return {
                        progress: newProgress,
                        session: newSession
                    };
                });
            }
        }),
        {
            name: 'quiz-storage',
        }
    )
);
