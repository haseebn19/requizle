import React, {useState, useRef} from 'react';
import {createPortal} from 'react-dom';
import {useQuizStore} from '../store/useQuizStore';
import {calculateMastery, getActiveQuestions} from '../utils/quizLogic';
import {storeMedia, createMediaRef, clearAllMedia} from '../utils/mediaStorage';
import {Upload, Trash2, AlertCircle, Download, Plus, ExternalLink, Pencil, Check, X, ImageIcon} from 'lucide-react';
import {ThemeToggle} from './ThemeToggle';
import {clsx} from 'clsx';
import type {Subject, Question, QuestionType, Topic} from '../types';

// Helper to check if a media reference is a remote URL, data URI, or IndexedDB reference
const isRemoteOrStoredMedia = (media: string): boolean => {
    return media.startsWith('http://') ||
        media.startsWith('https://') ||
        media.startsWith('data:') ||
        media.startsWith('idb:');
};

// Helper to extract filename from path (handles both / and \ separators)
const getFilename = (path: string): string => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
};

export const RightSidebar: React.FC = () => {
    const {
        profiles,
        activeProfileId,
        createProfile,
        renameProfile,
        switchProfile,
        deleteProfile,
        importProfile,
        resetAllData,
        importSubjects,
        resetSubjectProgress,
        settings,
        setConfirmSubjectDelete,
        setConfirmProfileDelete
    } = useQuizStore();
    const [activeTab, setActiveTab] = useState<'mastery' | 'import' | 'settings'>('mastery');
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deleteProfileConfirm, setDeleteProfileConfirm] = useState<{id: string; name: string} | null>(null);
    const [deleteProfileInput, setDeleteProfileInput] = useState('');
    const [factoryResetConfirm, setFactoryResetConfirm] = useState(false);
    const [factoryResetInput, setFactoryResetInput] = useState('');

    // Image upload state
    const [pendingImport, setPendingImport] = useState<{
        data: unknown;
        requiredImages: string[];
        uploadedImages: Map<string, string>;
        uploadError: string | null;
        skippedFiles: string[];
    } | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const currentProfile = profiles[activeProfileId];
    const {subjects, progress, session} = currentProfile;
    const currentSubject = subjects.find(s => s.id === session.subjectId);

    // Calculate stats
    let activeQuestionsCount = 0;
    let activeMastery = 0;
    let subjectMastery = 0;

    if (currentSubject) {
        const activeQuestions = getActiveQuestions(currentSubject, session.selectedTopicIds);
        activeQuestionsCount = activeQuestions.length;

        const flatProgress = Object.values(progress[currentSubject.id] || {}).reduce((acc, val) => ({...acc, ...val}), {});
        activeMastery = calculateMastery(activeQuestions, flatProgress);

        const allQuestions = currentSubject.topics.flatMap(t => t.questions);
        subjectMastery = calculateMastery(allQuestions, flatProgress);
    }

    // Comprehensive validation function
    const validateSubjects = (data: unknown): Subject[] => {
        if (!Array.isArray(data) && (typeof data !== 'object' || data === null)) {
            throw new Error('Invalid format: Expected an object or array of subjects');
        }

        const subjectsToValidate = Array.isArray(data) ? data : [data];

        const validQuestionTypes: QuestionType[] = [
            'multiple_choice',
            'multiple_answer',
            'keywords',
            'true_false',
            'matching',
            'word_bank'
        ];

        const validateQuestion = (q: unknown, questionIndex: number, topicName: string): Question => {
            if (typeof q !== 'object' || q === null) {
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Must be an object`);
            }

            const question = q as Record<string, unknown>;

            // Validate base fields
            if (typeof question.id !== 'string' || !question.id) {
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Missing or invalid "id"`);
            }
            if (typeof question.type !== 'string' || !validQuestionTypes.includes(question.type as QuestionType)) {
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Missing or invalid "type"(must be one of: ${validQuestionTypes.join(', ')})`);
            }
            if (typeof question.prompt !== 'string' || !question.prompt) {
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Missing or invalid "prompt"`);
            }
            if (typeof question.topicId !== 'string' || !question.topicId) {
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Missing or invalid "topicId"`);
            }

            const type = question.type as QuestionType;

            // Validate type-specific fields
            switch (type) {
                case 'multiple_choice': {
                    if (!Array.isArray(question.choices) || question.choices.length === 0) {
                        throw new Error(`Invalid multiple_choice question "${question.id}": Missing or invalid "choices" array`);
                    }
                    if (typeof question.answerIndex !== 'number' || question.answerIndex < 0 || question.answerIndex >= question.choices.length) {
                        throw new Error(`Invalid multiple_choice question "${question.id}": Missing or invalid "answerIndex"`);
                    }
                    break;
                }

                case 'multiple_answer': {
                    if (!Array.isArray(question.choices) || question.choices.length === 0) {
                        throw new Error(`Invalid multiple_answer question "${question.id}": Missing or invalid "choices" array`);
                    }
                    if (!Array.isArray(question.answerIndices) || question.answerIndices.length === 0) {
                        throw new Error(`Invalid multiple_answer question "${question.id}": Missing or invalid "answerIndices" array`);
                    }
                    if (!question.answerIndices.every((idx: unknown) => typeof idx === 'number' && idx >= 0 && idx < (question.choices as unknown[]).length)) {
                        throw new Error(`Invalid multiple_answer question "${question.id}": "answerIndices" contains invalid values`);
                    }
                    break;
                }

                case 'true_false': {
                    if (typeof question.answer !== 'boolean') {
                        throw new Error(`Invalid true_false question "${question.id}": Missing or invalid "answer"(must be boolean)`);
                    }
                    break;
                }

                case 'keywords': {
                    if (typeof question.answer !== 'string' && !Array.isArray(question.answer)) {
                        throw new Error(`Invalid keywords question "${question.id}": Missing or invalid "answer"(must be string or array of strings)`);
                    }
                    if (Array.isArray(question.answer) && question.answer.length === 0) {
                        throw new Error(`Invalid keywords question "${question.id}": "answer" array cannot be empty`);
                    }
                    break;
                }

                case 'matching': {
                    if (!Array.isArray(question.pairs) || question.pairs.length === 0) {
                        throw new Error(`Invalid matching question "${question.id}": Missing or invalid "pairs" array`);
                    }
                    if (!question.pairs.every((pair: unknown) =>
                        typeof pair === 'object' &&
                        pair !== null &&
                        typeof (pair as Record<string, unknown>).left === 'string' &&
                        typeof (pair as Record<string, unknown>).right === 'string'
                    )) {
                        throw new Error(`Invalid matching question "${question.id}": "pairs" must be an array of objects with "left" and "right" strings`);
                    }
                    break;
                }

                case 'word_bank': {
                    if (typeof question.sentence !== 'string' || !question.sentence) {
                        throw new Error(`Invalid word_bank question "${question.id}": Missing or invalid "sentence"`);
                    }
                    if (!Array.isArray(question.wordBank) || question.wordBank.length === 0) {
                        throw new Error(`Invalid word_bank question "${question.id}": Missing or invalid "wordBank" array`);
                    }
                    if (!Array.isArray(question.answers) || question.answers.length === 0) {
                        throw new Error(`Invalid word_bank question "${question.id}": Missing or invalid "answers" array`);
                    }
                    const blankCount = (question.sentence as string).split('_').length - 1;
                    if (question.answers.length !== blankCount) {
                        throw new Error(`Invalid word_bank question "${question.id}": "answers" array length(${question.answers.length}) doesn't match number of blanks in sentence (${blankCount})`);
                    }
                    break;
                }
            }

            return question as unknown as Question;
        };

        const validateTopic = (t: unknown, topicIndex: number, subjectName: string): Topic => {
            if (typeof t !== 'object' || t === null) {
                throw new Error(`Invalid topic ${topicIndex + 1} in subject "${subjectName}": Must be an object`);
            }

            const topic = t as Record<string, unknown>;

            if (typeof topic.id !== 'string' || !topic.id) {
                throw new Error(`Invalid topic ${topicIndex + 1} in subject "${subjectName}": Missing or invalid "id"`);
            }
            if (typeof topic.name !== 'string' || !topic.name) {
                throw new Error(`Invalid topic ${topicIndex + 1} in subject "${subjectName}": Missing or invalid "name"`);
            }
            if (!Array.isArray(topic.questions)) {
                throw new Error(`Invalid topic "${topic.name}": Missing or invalid "questions" array`);
            }

            const questions = topic.questions.map((q, idx) => validateQuestion(q, idx, topic.name as string));

            return {
                id: topic.id as string,
                name: topic.name as string,
                questions
            };
        };

        const validateSubject = (s: unknown, subjectIndex: number): Subject => {
            if (typeof s !== 'object' || s === null) {
                throw new Error(`Invalid subject ${subjectIndex + 1}: Must be an object`);
            }

            const subject = s as Record<string, unknown>;

            if (typeof subject.id !== 'string' || !subject.id) {
                throw new Error(`Invalid subject ${subjectIndex + 1}: Missing or invalid "id"`);
            }
            if (typeof subject.name !== 'string' || !subject.name) {
                throw new Error(`Invalid subject ${subjectIndex + 1}: Missing or invalid "name"`);
            }
            if (!Array.isArray(subject.topics)) {
                throw new Error(`Invalid subject "${subject.name}": Missing or invalid "topics" array`);
            }

            const topics = subject.topics.map((t, idx) => validateTopic(t, idx, subject.name as string));

            return {
                id: subject.id as string,
                name: subject.name as string,
                topics
            };
        };

        return subjectsToValidate.map((s, idx) => validateSubject(s, idx));
    };

    // Extract all media references from subjects data
    const extractMediaReferences = (data: unknown): string[] => {
        const mediaRefs: string[] = [];

        const processQuestion = (q: Record<string, unknown>) => {
            if (typeof q.media === 'string' && q.media) {
                mediaRefs.push(q.media);
            }
        };

        const processSubjects = (subjects: unknown[]) => {
            for (const subject of subjects) {
                if (typeof subject === 'object' && subject !== null) {
                    const s = subject as Record<string, unknown>;
                    if (Array.isArray(s.topics)) {
                        for (const topic of s.topics) {
                            if (typeof topic === 'object' && topic !== null) {
                                const t = topic as Record<string, unknown>;
                                if (Array.isArray(t.questions)) {
                                    for (const q of t.questions) {
                                        if (typeof q === 'object' && q !== null) {
                                            processQuestion(q as Record<string, unknown>);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        if (Array.isArray(data)) {
            processSubjects(data);
        } else if (typeof data === 'object' && data !== null) {
            const obj = data as Record<string, unknown>;
            if (Array.isArray(obj.subjects)) {
                // It's a profile
                processSubjects(obj.subjects);
            } else if (obj.topics) {
                // It's a single subject
                processSubjects([obj]);
            }
        }

        return mediaRefs;
    };

    // Get local media files that need to be uploaded (not URLs or data URIs)
    const getLocalMedia = (media: string[]): string[] => {
        return media.filter(m => !isRemoteOrStoredMedia(m));
    };

    // Replace local media paths with uploaded data URIs in the parsed data
    const replaceMediaInData = (data: unknown, mediaMap: Map<string, string>): unknown => {
        if (Array.isArray(data)) {
            return data.map(item => replaceMediaInData(item, mediaMap));
        }
        if (typeof data === 'object' && data !== null) {
            const result: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
                if (key === 'media' && typeof value === 'string') {
                    const filename = getFilename(value);
                    result[key] = mediaMap.get(filename) || value;
                } else {
                    result[key] = replaceMediaInData(value, mediaMap);
                }
            }
            return result;
        }
        return data;
    };

    // Perform the actual import after images are handled
    const performImport = (parsed: unknown): {type: 'profile' | 'subjects'; message: string} => {
        // Check if it's a profile (has profile-specific fields)
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'id' in parsed &&
            'name' in parsed &&
            'subjects' in parsed &&
            'progress' in parsed &&
            'session' in parsed
        ) {
            const profile = parsed as {id: string; name: string; subjects: unknown[]; progress: unknown; session: unknown};
            if (typeof profile.id === 'string' && typeof profile.name === 'string' && Array.isArray(profile.subjects)) {
                const existingProfile = profiles[profile.id];
                importProfile(profile as Parameters<typeof importProfile>[0]);
                const action = existingProfile ? 'merged with existing' : 'imported';
                return {type: 'profile', message: `Profile "${profile.name}" ${action} successfully!`};
            }
        }

        // Otherwise, try to import as subjects
        const validatedSubjects = validateSubjects(parsed);
        const existingSubjectIds = currentProfile.subjects.map(s => s.id);
        const mergedCount = validatedSubjects.filter(s => existingSubjectIds.includes(s.id)).length;
        const newCount = validatedSubjects.length - mergedCount;

        importSubjects(validatedSubjects);

        let message = '';
        if (mergedCount > 0 && newCount > 0) {
            message = `Merged ${mergedCount} existing subject(s) and added ${newCount} new subject(s)`;
        } else if (mergedCount > 0) {
            message = `Merged ${mergedCount} subject(s) with existing data`;
        } else {
            message = `Added ${newCount} new subject(s)`;
        }

        return {type: 'subjects', message};
    };

    // Check for local media and either import directly or prompt for upload
    const detectAndImport = (parsed: unknown): {type: 'profile' | 'subjects' | 'pending'; message: string} => {
        const allMedia = extractMediaReferences(parsed);
        const localMedia = getLocalMedia(allMedia);

        if (localMedia.length > 0) {
            // Need to upload local media first
            const uniqueFilenames = [...new Set(localMedia.map(getFilename))];
            setPendingImport({
                data: parsed,
                requiredImages: uniqueFilenames,
                uploadedImages: new Map(),
                uploadError: null,
                skippedFiles: []
            });
            return {
                type: 'pending',
                message: `Found ${uniqueFilenames.length} local media file(s) that need to be uploaded.`
            };
        }

        // No local media, import directly
        return performImport(parsed);
    };

    // Handle image file selection for pending import
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!pendingImport || !e.target.files) return;

        const files = Array.from(e.target.files);
        const newUploadedImages = new Map(pendingImport.uploadedImages);

        // Filter to only accept files that match required filenames
        const validFiles = files.filter(file => pendingImport.requiredImages.includes(file.name));
        const skipped = files.filter(file => !pendingImport.requiredImages.includes(file.name)).map(f => f.name);

        if (validFiles.length === 0) {
            // No valid files selected
            setPendingImport({
                ...pendingImport,
                uploadError: skipped.length > 0
                    ? `Skipped: ${skipped.join(', ')} (not in required list)`
                    : 'No files selected',
                skippedFiles: skipped
            });
            e.target.value = '';
            return;
        }

        let processedCount = 0;
        const totalToProcess = validFiles.length;

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUri = event.target?.result as string;
                newUploadedImages.set(file.name, dataUri);
                processedCount++;

                if (processedCount === totalToProcess) {
                    setPendingImport({
                        ...pendingImport,
                        uploadedImages: newUploadedImages,
                        uploadError: skipped.length > 0
                            ? `Skipped ${skipped.length} file(s) not in required list`
                            : null,
                        skippedFiles: skipped
                    });
                }
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    // Complete the import with uploaded images
    const completePendingImport = async () => {
        if (!pendingImport) return;

        const {data, requiredImages, uploadedImages} = pendingImport;

        // Check all required images are uploaded
        const missingImages = requiredImages.filter(img => !uploadedImages.has(img));
        if (missingImages.length > 0) {
            setPendingImport({
                ...pendingImport,
                uploadError: `Missing files: ${missingImages.join(', ')}`
            });
            return;
        }

        try {
            // Store each media file in IndexedDB and create a mapping from filename to idb: reference
            const mediaRefMap = new Map<string, string>();

            for (const [filename, dataUri] of uploadedImages.entries()) {
                const mediaId = await storeMedia(dataUri, filename);
                mediaRefMap.set(filename, createMediaRef(mediaId));
            }

            // Replace media paths with IndexedDB references
            const processedData = replaceMediaInData(data, mediaRefMap);

            const result = performImport(processedData);
            setPendingImport(null);
            setJsonInput('');
            setImportError(null);
            alert(result.message);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setPendingImport({
                ...pendingImport,
                uploadError: `Import failed: ${errorMessage}`
            });
        }
    };

    // Cancel pending import
    const cancelPendingImport = () => {
        setPendingImport(null);
        setImportError(null);
    };

    const handleImport = () => {
        try {
            const parsed: unknown = JSON.parse(jsonInput);
            const result = detectAndImport(parsed);

            if (result.type === 'pending') {
                // Don't clear input or show success - waiting for images
                setImportError(null);
                return;
            }

            setJsonInput('');
            setImportError(null);
            alert(result.message);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setImportError(`Import failed: ${errorMessage}`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, resetInput = true) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed: unknown = JSON.parse(content);
                const result = detectAndImport(parsed);

                if (result.type === 'pending') {
                    // Don't clear or show success - waiting for images
                    setImportError(null);
                    return;
                }

                setJsonInput('');
                setImportError(null);
                alert(result.message);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                setImportError(`File import failed: ${errorMessage}`);
            }
        };
        reader.readAsText(file);
        if (resetInput) {
            e.target.value = '';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <button
                    onClick={() => setActiveTab('mastery')}
                    className={clsx(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'mastery' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    Mastery
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={clsx(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'import' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    Import
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={clsx(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'settings' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    Settings
                </button>
            </div>

            {activeTab === 'mastery' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {!currentSubject ? (
                        <div className="text-center text-slate-400 py-10">
                            Select a subject to view mastery
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Subject</div>
                                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{subjectMastery}%</div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{width: `${subjectMastery}%`}} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">Selection</div>
                                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeMastery}%</div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{width: `${activeMastery}%`}} />
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <div className="flex justify-between">
                                    <span>Active Questions:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-200">{activeQuestionsCount}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'import' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <p>Import a JSON file to add custom subjects and questions.</p>
                        </div>
                        <a
                            href="https://github.com/haseebn19/ReQuizle#importing-custom-content"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            <ExternalLink size={14} />
                            View JSON format documentation
                        </a>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload File</label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or paste JSON</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='[{"id": "math", ...}]'
                            className="w-full h-40 p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleImport}
                            disabled={!jsonInput.trim()}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            <Upload size={16} />
                            Apply JSON
                        </button>
                    </div>

                    {importError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg break-words">
                            {importError}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Profiles */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profiles</h3>

                        <div className="space-y-2">
                            {Object.values(profiles).sort((a, b) => b.createdAt - a.createdAt).map(profile => (
                                <div
                                    key={profile.id}
                                    className={clsx(
                                        "p-3 rounded-lg border transition-all group",
                                        activeProfileId === profile.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {editingProfileId === profile.id ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && editingName.trim()) {
                                                                renameProfile(profile.id, editingName.trim());
                                                                setEditingProfileId(null);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingProfileId(null);
                                                            }
                                                        }}
                                                        className="flex-1 px-2 py-0.5 text-sm font-medium border border-indigo-300 dark:border-indigo-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (editingName.trim()) {
                                                                renameProfile(profile.id, editingName.trim());
                                                                setEditingProfileId(null);
                                                            }
                                                        }}
                                                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                                        title="Save"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingProfileId(null)}
                                                        className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                                        title="Cancel"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className={clsx(
                                                        "font-medium text-sm truncate",
                                                        activeProfileId === profile.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"
                                                    )}>
                                                        {profile.name}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProfileId(profile.id);
                                                            setEditingName(profile.name);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Rename Profile"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    {activeProfileId === profile.id && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold uppercase flex-shrink-0">
                                                            Active
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {editingProfileId !== profile.id && (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => {
                                                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
                                                        const downloadAnchorNode = document.createElement('a');
                                                        downloadAnchorNode.setAttribute("href", dataStr);
                                                        downloadAnchorNode.setAttribute("download", `quiz-profile-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`);
                                                        document.body.appendChild(downloadAnchorNode);
                                                        downloadAnchorNode.click();
                                                        downloadAnchorNode.remove();
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                                    title="Export Profile"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const isLastProfile = Object.keys(profiles).length === 1;

                                                        if (settings.confirmProfileDelete) {
                                                            // Confirmation enabled: use type-to-confirm modal
                                                            setDeleteProfileConfirm({id: profile.id, name: profile.name});
                                                            setDeleteProfileInput('');
                                                        } else if (isLastProfile) {
                                                            // Last profile with confirmation disabled: use browser confirm
                                                            if (confirm("This is the last profile. Deleting it will reset the app to default state. Are you sure?")) {
                                                                deleteProfile(profile.id);
                                                            }
                                                        } else {
                                                            // Normal profile with confirmation disabled: delete immediately
                                                            deleteProfile(profile.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete Profile"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>{profile.subjects.length} Subjects</span>
                                        {activeProfileId !== profile.id && (
                                            <button
                                                onClick={() => switchProfile(profile.id)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                            >
                                                Switch to this profile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                                onClick={() => {
                                    const name = prompt("Enter profile name:");
                                    if (name) createProfile(name);
                                }}
                                className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-xs font-medium"
                            >
                                <Plus size={14} />
                                New Profile
                            </button>
                            <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-xs font-medium cursor-pointer">
                                <Upload size={14} />
                                Import Data
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                        handleFileUpload(e, true);
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>

                    {/* Appearance */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appearance</h3>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</span>
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Behavior */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Behavior</h3>
                        <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">Confirm Subject Deletion</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Require typing name to delete</span>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={settings.confirmSubjectDelete}
                                    onChange={(e) => setConfirmSubjectDelete(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">Confirm Profile Deletion</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Require typing name to delete</span>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={settings.confirmProfileDelete}
                                    onChange={(e) => setConfirmProfileDelete(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                        </label>
                    </div>

                    {/* Data Management */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Management</h3>

                        {currentSubject && (
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to reset progress for this subject?')) {
                                        resetSubjectProgress(currentSubject.id);
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 size={16} />
                                Reset Subject Progress
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setFactoryResetConfirm(true);
                                setFactoryResetInput('');
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <AlertCircle size={16} />
                            Wipe All Data (Factory Reset)
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Profile Confirmation Modal */}
            {deleteProfileConfirm && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Profile</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            This will permanently delete <strong className="text-slate-900 dark:text-white">{deleteProfileConfirm.name}</strong> and all its subjects, progress, and settings.
                            {Object.keys(profiles).length === 1 && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                    This is your last profile. Deleting it will reset the app to default state.
                                </span>
                            )}
                        </p>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-600 dark:text-slate-400">
                                Type <strong className="text-red-600 dark:text-red-400">{deleteProfileConfirm.name}</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={deleteProfileInput}
                                onChange={(e) => setDeleteProfileInput(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                placeholder="Type profile name..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setDeleteProfileConfirm(null);
                                    setDeleteProfileInput('');
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteProfileInput === deleteProfileConfirm.name) {
                                        deleteProfile(deleteProfileConfirm.id);
                                        setDeleteProfileConfirm(null);
                                        setDeleteProfileInput('');
                                    }
                                }}
                                disabled={deleteProfileInput !== deleteProfileConfirm.name}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Factory Reset Confirmation Modal */}
            {factoryResetConfirm && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">⚠️ Factory Reset</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            This will <strong className="text-red-600 dark:text-red-400">permanently delete ALL data</strong> including:
                        </p>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
                            <li>All profiles</li>
                            <li>All subjects and questions</li>
                            <li>All progress and mastery data</li>
                            <li>All settings</li>
                        </ul>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            This action cannot be undone!
                        </p>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-600 dark:text-slate-400">
                                Type <strong className="text-red-600 dark:text-red-400">RESET</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={factoryResetInput}
                                onChange={(e) => setFactoryResetInput(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                placeholder="Type RESET..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setFactoryResetConfirm(false);
                                    setFactoryResetInput('');
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (factoryResetInput === 'RESET') {
                                        // Clear IndexedDB media storage
                                        await clearAllMedia();
                                        resetAllData();
                                        setFactoryResetConfirm(false);
                                        setFactoryResetInput('');
                                    }
                                }}
                                disabled={factoryResetInput !== 'RESET'}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                Wipe All Data
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Image Upload Modal for Pending Import */}
            {pendingImport && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Media</h3>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Your import contains local media references. Please upload the following files:
                        </p>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {pendingImport.requiredImages.map(filename => {
                                const isUploaded = pendingImport.uploadedImages.has(filename);
                                return (
                                    <div
                                        key={filename}
                                        className={clsx(
                                            "flex items-center justify-between p-2 rounded-lg text-sm",
                                            isUploaded
                                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <span className="truncate">{filename}</span>
                                        {isUploaded ? (
                                            <Check className="w-4 h-4 flex-shrink-0" />
                                        ) : (
                                            <X className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {pendingImport.uploadedImages.size} of {pendingImport.requiredImages.length} images uploaded
                        </div>

                        {/* Error/Warning display */}
                        {pendingImport.uploadError && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{pendingImport.uploadError}</span>
                            </div>
                        )}

                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={cancelPendingImport}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Select Files
                            </button>
                        </div>

                        {pendingImport.uploadedImages.size === pendingImport.requiredImages.length && (
                            <button
                                onClick={completePendingImport}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Complete Import
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
