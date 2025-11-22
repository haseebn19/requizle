import {describe, it, expect, beforeEach, vi} from 'vitest';
import {useQuizStore} from './useQuizStore';
import {act} from 'react';

// Mock persistence to avoid localStorage issues in tests
vi.mock('zustand/middleware', () => ({
    persist: (config: any) => (set: any, get: any, api: any) => config(set, get, api),
    createJSONStorage: () => ({})
}));

describe('useQuizStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useQuizStore.getState();
        // We can't easily reset the store with zustand, but we can clear profiles or create a new one
        // For now, let's just assume we start fresh or use a new profile
        act(() => {
            useQuizStore.setState({
                profiles: {
                    'default': {
                        id: 'default',
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
                activeProfileId: 'default'
            });
        });
    });

    it('should initialize with default profile', () => {
        const state = useQuizStore.getState();
        expect(state.profiles['default']).toBeDefined();
        expect(state.activeProfileId).toBe('default');
    });

    it('should create a new profile', () => {
        const {createProfile} = useQuizStore.getState();
        act(() => {
            createProfile('New Profile');
        });
        const state = useQuizStore.getState();
        const newProfileId = state.activeProfileId;
        expect(newProfileId).not.toBe('default');
        expect(state.profiles[newProfileId].name).toBe('New Profile');
    });

    it('should switch profile', () => {
        const {createProfile, switchProfile} = useQuizStore.getState();
        act(() => {
            createProfile('Profile 2');
        });
        const profile2Id = useQuizStore.getState().activeProfileId;

        act(() => {
            switchProfile('default');
        });
        expect(useQuizStore.getState().activeProfileId).toBe('default');

        act(() => {
            switchProfile(profile2Id);
        });
        expect(useQuizStore.getState().activeProfileId).toBe(profile2Id);
    });

    it('should delete profile', () => {
        const {createProfile, deleteProfile} = useQuizStore.getState();
        act(() => {
            createProfile('To Delete');
        });
        const toDeleteId = useQuizStore.getState().activeProfileId;

        act(() => {
            deleteProfile(toDeleteId);
        });

        const state = useQuizStore.getState();
        expect(state.profiles[toDeleteId]).toBeUndefined();
        expect(state.activeProfileId).not.toBe(toDeleteId);
    });
});
