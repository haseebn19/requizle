import React from 'react';
import {useQuizStore} from '../store/useQuizStore';
import {calculateMastery} from '../utils/quizLogic';
import {CheckCircle2, Circle, BookOpen} from 'lucide-react';
import {clsx} from 'clsx';

export const LeftSidebar: React.FC = () => {
    const {subjects, progress, session, startSession, toggleTopic, setIncludeMastered} = useQuizStore();

    const currentSubject = subjects.find(s => s.id === session.subjectId);

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="p-2 bg-indigo-600 rounded-lg text-white">
                        <BookOpen size={24} />
                    </span>
                    PulseRecall
                </h1>
                <p className="text-slate-500 text-sm mt-1">Master your subjects</p>
            </div>

            {/* Subject List */}
            <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subjects</h2>
                <div className="space-y-2">
                    {subjects.map(subject => {
                        const isActive = session.subjectId === subject.id;
                        const allQuestions = subject.topics.flatMap(t => t.questions);

                        const flatProgress = Object.values(progress[subject.id] || {}).reduce((acc, val) => ({...acc, ...val}), {});
                        const masteryPct = calculateMastery(allQuestions, flatProgress);

                        return (
                            <button
                                key={subject.id}
                                onClick={() => startSession(subject.id)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
                                        : "hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={clsx("font-medium", isActive ? "text-indigo-900" : "text-slate-700")}>
                                        {subject.name}
                                    </span>
                                    <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full",
                                        masteryPct === 100 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {masteryPct}%
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex gap-3">
                                    <span>{subject.topics.length} topics</span>
                                    <span>{allQuestions.length} questions</span>
                                </div>
                            </button>
                        );
                    })}
                    {subjects.length === 0 && (
                        <p className="text-sm text-slate-400 italic">No subjects loaded.</p>
                    )}
                </div>
            </div>

            {/* Topic List (if subject selected) */}
            {currentSubject && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Topics in {currentSubject.name}
                        </h2>
                        <span className="text-xs text-slate-400">
                            {session.selectedTopicIds.length === 0 ? "All Selected" : `${session.selectedTopicIds.length} Selected`}
                        </span>
                    </div>

                    <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {currentSubject.topics.map(topic => {
                            const isSelected = session.selectedTopicIds.length === 0 || session.selectedTopicIds.includes(topic.id);
                            const topicProgress = (progress[currentSubject.id] || {})[topic.id] || {};
                            const masteryPct = calculateMastery(topic.questions, topicProgress);

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => toggleTopic(topic.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                                        isSelected ? "bg-white shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={clsx("flex-shrink-0", isSelected ? "text-indigo-600" : "text-slate-300")}>
                                        {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={clsx("font-medium truncate", isSelected ? "text-slate-700" : "text-slate-500")}>
                                            {topic.name}
                                        </div>
                                        <div className="w-full bg-slate-100 h-1 mt-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-green-500 h-full rounded-full transition-all duration-500"
                                                style={{width: `${masteryPct}%`}}
                                            />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Include Mastered Toggle */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={session.includeMastered}
                                    onChange={(e) => setIncludeMastered(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                                Include Mastered
                                <span className="block text-xs text-slate-400 font-normal">Practice mode</span>
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};
