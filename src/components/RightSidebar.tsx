import React, {useState} from 'react';
import {useQuizStore} from '../store/useQuizStore';
import {calculateMastery, getActiveQuestions} from '../utils/quizLogic';
import {Upload, Trash2, AlertCircle} from 'lucide-react';
import {clsx} from 'clsx';
import type {Subject} from '../types';

export const RightSidebar: React.FC = () => {
    const {subjects, progress, session, importSubjects, resetSubjectProgress} = useQuizStore();
    const [activeTab, setActiveTab] = useState<'mastery' | 'import'>('mastery');
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

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

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const subjectsToImport = Array.isArray(parsed) ? parsed : [parsed];

            // Basic validation
            if (!subjectsToImport.every((s: any) => s.id && s.topics)) {
                throw new Error("Invalid format: Missing id or topics");
            }

            importSubjects(subjectsToImport as Subject[]);
            setJsonInput('');
            setImportError(null);
            alert('Import successful!');
        } catch (e: any) {
            setImportError(e.message);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);
                const subjectsToImport = Array.isArray(parsed) ? parsed : [parsed];
                importSubjects(subjectsToImport as Subject[]);
                alert('Import successful!');
            } catch (e: any) {
                setImportError("File import failed: " + e.message);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                    onClick={() => setActiveTab('mastery')}
                    className={clsx(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'mastery' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Mastery
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={clsx(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'import' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Import
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
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Subject</div>
                                    <div className="text-2xl font-bold text-slate-800">{subjectMastery}%</div>
                                    <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{width: `${subjectMastery}%`}} />
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Selection</div>
                                    <div className="text-2xl font-bold text-slate-800">{activeMastery}%</div>
                                    <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{width: `${activeMastery}%`}} />
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-slate-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Active Questions:</span>
                                    <span className="font-medium">{activeQuestionsCount}</span>
                                </div>
                            </div>

                            {/* Tools */}
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Tools</h3>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to reset progress for this subject?')) {
                                            resetSubjectProgress(currentSubject.id);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Trash2 size={16} />
                                    Reset Subject Progress
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'import' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-700">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                        <p>Import JSON to add custom subjects. See spec for format.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Upload File</label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-slate-500">Or paste JSON</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='[{"id": "math", ...}]'
                            className="w-full h-40 p-3 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
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
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg break-words">
                            {importError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
