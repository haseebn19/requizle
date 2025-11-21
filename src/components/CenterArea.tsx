import React from 'react';
import {useQuizStore} from '../store/useQuizStore';
import {QuestionCard} from './QuestionCard';
import {Shuffle, ListOrdered, RotateCcw, CheckCircle2} from 'lucide-react';


export const CenterArea: React.FC = () => {
    const {subjects, session, setMode, restartQueue} = useQuizStore();

    const currentSubject = subjects.find(s => s.id === session.subjectId);

    // Find current question object
    let currentQuestion = null;
    let currentTopic = null;

    if (currentSubject && session.currentQuestionId) {
        for (const topic of currentSubject.topics) {
            const q = topic.questions.find(q => q.id === session.currentQuestionId);
            if (q) {
                currentQuestion = q;
                currentTopic = topic;
                break;
            }
        }
    }

    if (!currentSubject) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <ListOrdered size={40} className="opacity-20" />
                </div>
                <h2 className="text-xl font-semibold text-slate-600 mb-2">Ready to study?</h2>
                <p>Select a subject from the sidebar to begin.</p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">All Caught Up!</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    You've mastered all the selected questions. Great job!
                    You can include mastered questions to keep practicing or select different topics.
                </p>
                <button onClick={restartQueue} className="btn-primary flex items-center gap-2">
                    <RotateCcw size={18} />
                    Start Over
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Top Bar */}
            <div className="flex-shrink-0 p-4 md:p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-slate-100 z-20">
                <div className="flex items-center gap-3">
                    {currentTopic && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                            {currentTopic.name}
                        </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                        Queue: {session.queue.length + 1}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMode(session.mode === 'random' ? 'topic_order' : 'random')}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title={session.mode === 'random' ? "Switch to Topic Order" : "Switch to Random Shuffle"}
                    >
                        {session.mode === 'random' ? <Shuffle size={20} /> : <ListOrdered size={20} />}
                    </button>
                    <button
                        onClick={restartQueue}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Restart Queue"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
                <QuestionCard question={currentQuestion} />
            </div>
        </div>
    );
};


