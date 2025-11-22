import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import type {Subject, ProgressMap, SessionState, StudyMode, QuestionProgress, Profile} from '../types';
import {generateQueue, getActiveQuestions, checkAnswer} from '../utils/quizLogic';
import {v4 as uuidv4} from 'uuid';

interface QuizState {
    profiles: Record<string, Profile>;
    activeProfileId: string;

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

    // Profile Actions
    createProfile: (name: string) => void;
    switchProfile: (id: string) => void;
    deleteProfile: (id: string) => void;
    importProfile: (profile: Profile) => void;
    resetAllData: () => void;
}

// Helper to get current profile
const getCurrentProfile = (state: QuizState) => state.profiles[state.activeProfileId];

// Helper to get current subject from state
const getCurrentSubject = (state: QuizState) => {
    const profile = getCurrentProfile(state);
    if (!profile) return undefined;
    return profile.subjects.find(s => s.id === profile.session.subjectId);
};

// Helper to flatten progress map for a subject
function flattenProgress(subjectProgress: Record<string, Record<string, QuestionProgress>> | undefined): Record<string, QuestionProgress> {
    if (!subjectProgress) return {};
    const flat: Record<string, QuestionProgress> = {};
    Object.values(subjectProgress).forEach(topicProgress => {
        Object.assign(flat, topicProgress);
    });
    return flat;
}

const DEFAULT_PROFILE_ID = 'default';

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            profiles: {
                [DEFAULT_PROFILE_ID]: {
                    id: DEFAULT_PROFILE_ID,
                    name: 'Default',
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
                    createdAt: Date.now()
                }
            },
            activeProfileId: DEFAULT_PROFILE_ID,

            setSubjects: (subjects) => set((state) => {
                const profile = getCurrentProfile(state);
                return {
                    profiles: {
                        ...state.profiles,
                        [state.activeProfileId]: {
                            ...profile,
                            subjects
                        }
                    }
                };
            }),

            importSubjects: (newSubjects) => set((state) => {
                const profile = getCurrentProfile(state);
                return {
                    profiles: {
                        ...state.profiles,
                        [state.activeProfileId]: {
                            ...profile,
                            subjects: [...profile.subjects, ...newSubjects]
                        }
                    }
                };
            }),

            startSession: (subjectId) => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const subject = profile.subjects.find(s => s.id === subjectId);
                    if (!subject) return state;

                    const newSession: SessionState = {
                        ...profile.session,
                        subjectId,
                        selectedTopicIds: [], // Reset selection to "all"
                        queue: [],
                        currentQuestionId: null
                    };

                    // Generate initial queue
                    const questions = getActiveQuestions(subject, []);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(profile.progress[subjectId]),
                        newSession.mode,
                        newSession.includeMastered
                    );

                    newSession.queue = queue.slice(1);
                    newSession.currentQuestionId = queue[0] || null;

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: newSession
                            }
                        }
                    };
                });
            },

            toggleTopic: (topicId) => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const currentSelected = profile.session.selectedTopicIds;
                    const newSelected = currentSelected.includes(topicId)
                        ? currentSelected.filter(id => id !== topicId)
                        : [...currentSelected, topicId];

                    // Rebuild queue
                    const subject = getCurrentSubject(state);
                    if (!subject) return state;

                    const questions = getActiveQuestions(subject, newSelected);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(profile.progress[subject.id]),
                        profile.session.mode,
                        profile.session.includeMastered
                    );

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: {
                                    ...profile.session,
                                    selectedTopicIds: newSelected,
                                    queue: queue.slice(1),
                                    currentQuestionId: queue[0] || null
                                }
                            }
                        }
                    };
                });
            },

            setMode: (mode) => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const subject = getCurrentSubject(state);

                    if (!subject) {
                        return {
                            profiles: {
                                ...state.profiles,
                                [state.activeProfileId]: {
                                    ...profile,
                                    session: {...profile.session, mode}
                                }
                            }
                        };
                    }

                    const questions = getActiveQuestions(subject, profile.session.selectedTopicIds);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(profile.progress[subject.id]),
                        mode,
                        profile.session.includeMastered
                    );

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: {
                                    ...profile.session,
                                    mode,
                                    queue: queue.slice(1),
                                    currentQuestionId: queue[0] || null
                                }
                            }
                        }
                    };
                });
            },

            setIncludeMastered: (include) => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: {...profile.session, includeMastered: include}
                            }
                        }
                    };
                });
            },

            restartQueue: () => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const subject = getCurrentSubject(state);
                    if (!subject) return state;

                    const questions = getActiveQuestions(subject, profile.session.selectedTopicIds);
                    const queue = generateQueue(
                        questions,
                        flattenProgress(profile.progress[subject.id]),
                        profile.session.mode,
                        profile.session.includeMastered
                    );

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: {
                                    ...profile.session,
                                    queue: queue.slice(1),
                                    currentQuestionId: queue[0] || null
                                }
                            }
                        }
                    };
                });
            },

            submitAnswer: (answer) => {
                const state = get();
                const profile = getCurrentProfile(state);
                const subject = getCurrentSubject(state);
                const {currentQuestionId} = profile.session;

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
                    const currentProfile = state.profiles[state.activeProfileId];
                    const subjectProgress = currentProfile.progress[subject.id] || {};
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
                        ...currentProfile.progress,
                        [subject.id]: {
                            ...subjectProgress,
                            [topicId!]: {
                                ...topicProgress,
                                [currentQuestionId]: newQProgress
                            }
                        }
                    };

                    // Queue management
                    let newQueue = [...currentProfile.session.queue];

                    if (!isCorrect) {
                        // Reinsert 4-6 positions later
                        const offset = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
                        const insertIndex = Math.min(offset, newQueue.length);
                        newQueue.splice(insertIndex, 0, currentQuestionId);
                    }

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...currentProfile,
                                progress: newProgress,
                                session: {
                                    ...currentProfile.session,
                                    queue: newQueue
                                }
                            }
                        }
                    };
                });

                return {correct: isCorrect, explanation: question.explanation};
            },

            nextQuestion: () => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const newQueue = [...profile.session.queue];
                    const nextQuestionId = newQueue.shift() || null;

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                session: {
                                    ...profile.session,
                                    queue: newQueue,
                                    currentQuestionId: nextQuestionId
                                }
                            }
                        }
                    };
                });
            },

            skipQuestion: () => {
                const state = get();
                const profile = getCurrentProfile(state);
                const subject = getCurrentSubject(state);
                const {currentQuestionId} = profile.session;
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
                    const currentProfile = state.profiles[state.activeProfileId];
                    const subjectProgress = currentProfile.progress[subject.id] || {};
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
                        ...currentProfile.progress,
                        [subject.id]: {
                            ...subjectProgress,
                            [topicId!]: {
                                ...topicProgress,
                                [currentQuestionId]: newQProgress
                            }
                        }
                    };

                    let newQueue = [...currentProfile.session.queue];
                    const offset = Math.floor(Math.random() * 3) + 4;
                    const insertIndex = Math.min(offset, newQueue.length);
                    newQueue.splice(insertIndex, 0, currentQuestionId);

                    const nextQuestionId = newQueue.shift() || null;

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...currentProfile,
                                progress: newProgress,
                                session: {
                                    ...currentProfile.session,
                                    queue: newQueue,
                                    currentQuestionId: nextQuestionId
                                }
                            }
                        }
                    };
                });
            },

            resetSubjectProgress: (subjectId) => {
                set((state) => {
                    const profile = getCurrentProfile(state);
                    const newProgress = {...profile.progress};
                    delete newProgress[subjectId];

                    let newSession = profile.session;
                    if (profile.session.subjectId === subjectId) {
                        const subject = profile.subjects.find(s => s.id === subjectId);
                        if (subject) {
                            const questions = getActiveQuestions(subject, profile.session.selectedTopicIds);
                            const queue = generateQueue(questions, {}, profile.session.mode, profile.session.includeMastered);
                            newSession = {
                                ...profile.session,
                                queue: queue.slice(1),
                                currentQuestionId: queue[0] || null
                            };
                        }
                    }

                    return {
                        profiles: {
                            ...state.profiles,
                            [state.activeProfileId]: {
                                ...profile,
                                progress: newProgress,
                                session: newSession
                            }
                        }
                    };
                });
            },

            // Profile Actions
            createProfile: (name) => {
                const newId = uuidv4();
                const newProfile: Profile = {
                    id: newId,
                    name,
                    subjects: [], // Should we copy default subjects? Maybe not.
                    progress: {},
                    session: {
                        subjectId: null,
                        selectedTopicIds: [],
                        mode: 'random',
                        includeMastered: false,
                        queue: [],
                        currentQuestionId: null,
                    },
                    createdAt: Date.now()
                };

                set(state => ({
                    profiles: {...state.profiles, [newId]: newProfile},
                    activeProfileId: newId
                }));
            },

            switchProfile: (id) => {
                set(state => {
                    if (!state.profiles[id]) return state;
                    return {activeProfileId: id};
                });
            },

            deleteProfile: (id) => {
                set(state => {
                    const profileIds = Object.keys(state.profiles);

                    // If this is the last profile, reset it to Default
                    if (profileIds.length === 1 && profileIds[0] === id) {
                        const resetDefault: Profile = {
                            id: DEFAULT_PROFILE_ID,
                            name: 'Default',
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
                            createdAt: Date.now()
                        };
                        return {
                            profiles: {
                                [DEFAULT_PROFILE_ID]: resetDefault
                            },
                            activeProfileId: DEFAULT_PROFILE_ID
                        };
                    }

                    const newProfiles = {...state.profiles};
                    delete newProfiles[id];

                    // If deleting active profile, switch to another one
                    let newActiveId = state.activeProfileId;
                    if (state.activeProfileId === id) {
                        // Switch to the most recently created profile
                        const remaining = Object.values(newProfiles).sort((a, b) => b.createdAt - a.createdAt);
                        newActiveId = remaining[0].id;
                    }

                    return {
                        profiles: newProfiles,
                        activeProfileId: newActiveId
                    };
                });
            },

            importProfile: (profile) => {
                set(state => ({
                    profiles: {
                        ...state.profiles,
                        [profile.id]: profile
                    },
                    activeProfileId: profile.id
                }));
            },

            resetAllData: () => {
                localStorage.removeItem('quiz-storage');
                window.location.reload();
            }
        }),
        {
            name: 'quiz-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0 || version === undefined) {
                    // Migrate from version 0 (flat state) to version 1 (profiles)
                    const defaultProfile: Profile = {
                        id: DEFAULT_PROFILE_ID,
                        name: 'Default',
                        subjects: persistedState.subjects || [],
                        progress: persistedState.progress || {},
                        session: persistedState.session || {
                            subjectId: null,
                            selectedTopicIds: [],
                            mode: 'random',
                            includeMastered: false,
                            queue: [],
                            currentQuestionId: null,
                        },
                        createdAt: Date.now()
                    };

                    return {
                        profiles: {[DEFAULT_PROFILE_ID]: defaultProfile},
                        activeProfileId: DEFAULT_PROFILE_ID
                    } as any;
                }
                return persistedState as QuizState;
            }
        }
    )
);
