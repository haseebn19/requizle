import React, {useState} from 'react';
import {useQuizStore} from '../store/useQuizStore';
import {calculateMastery, getActiveQuestions} from '../utils/quizLogic';
import {Upload, Trash2, AlertCircle, Download, Plus} from 'lucide-react';
import {ThemeToggle} from './ThemeToggle';
import {clsx} from 'clsx';
import type {Subject, Question, QuestionType, Topic} from '../types';

export const RightSidebar: React.FC = () => {
    const {
        profiles,
        activeProfileId,
        createProfile,
        switchProfile,
        deleteProfile,
        importProfile,
        resetAllData,
        importSubjects,
        resetSubjectProgress
    } = useQuizStore();
    const [activeTab, setActiveTab] = useState<'mastery' | 'import' | 'settings'>('mastery');
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

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
                throw new Error(`Invalid question ${questionIndex + 1} in topic "${topicName}": Missing or invalid "type" (must be one of: ${validQuestionTypes.join(', ')})`);
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
                        throw new Error(`Invalid true_false question "${question.id}": Missing or invalid "answer" (must be boolean)`);
                    }
                    break;
                }

                case 'keywords': {
                    if (typeof question.answer !== 'string' && !Array.isArray(question.answer)) {
                        throw new Error(`Invalid keywords question "${question.id}": Missing or invalid "answer" (must be string or array of strings)`);
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
                        throw new Error(`Invalid word_bank question "${question.id}": "answers" array length (${question.answers.length}) doesn't match number of blanks in sentence (${blankCount})`);
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

    const handleImport = () => {
        try {
            const parsed: unknown = JSON.parse(jsonInput);
            const validatedSubjects = validateSubjects(parsed);
            importSubjects(validatedSubjects);
            setJsonInput('');
            setImportError(null);
            alert('Import successful!');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            setImportError(`Import failed: ${errorMessage}`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed: unknown = JSON.parse(content);
                const validatedSubjects = validateSubjects(parsed);
                importSubjects(validatedSubjects);
                setJsonInput('');
                setImportError(null);
                alert('Import successful!');
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                setImportError(`File import failed: ${errorMessage}`);
            }
        };
        reader.readAsText(file);
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <p>Import JSON to add custom subjects. See spec for format.</p>
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
                                        "p-3 rounded-lg border transition-all",
                                        activeProfileId === profile.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "font-medium text-sm",
                                                activeProfileId === profile.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"
                                            )}>
                                                {profile.name}
                                            </span>
                                            {activeProfileId === profile.id && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
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
                                                    const message = isLastProfile
                                                        ? "This is the last profile. Deleting it will reset the app to a default state. Are you sure?"
                                                        : `Are you sure you want to delete profile "${profile.name}"?`;

                                                    if (confirm(message)) {
                                                        deleteProfile(profile.id);
                                                    }
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete Profile"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
                                Import Profile
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const content = event.target?.result as string;
                                                const parsed = JSON.parse(content);
                                                if (parsed.id && parsed.name && Array.isArray(parsed.subjects)) {
                                                    importProfile(parsed);
                                                    alert(`Profile "${parsed.name}" imported successfully!`);
                                                } else {
                                                    throw new Error("Invalid profile format");
                                                }
                                            } catch (err) {
                                                alert("Failed to import profile: " + (err instanceof Error ? err.message : 'Unknown error'));
                                            }
                                        };
                                        reader.readAsText(file);
                                        e.target.value = ''; // Reset input
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
                                if (confirm('WARNING: This will wipe ALL application data and reset to a fresh state. This cannot be undone. Are you sure?')) {
                                    resetAllData();
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <AlertCircle size={16} />
                            Wipe All Data (Factory Reset)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
