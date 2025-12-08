import React, {useState} from 'react';
import type {KeywordsQuestion} from '../../types';
import {Send} from 'lucide-react';

interface Props {
    question: KeywordsQuestion;
    onAnswer: (answer: string) => void;
    disabled: boolean;
    submittedAnswer: string | null;
}

export const KeywordsInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onAnswer(input.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
                <input
                    type="text"
                    value={submittedAnswer || input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={disabled}
                    placeholder="Type your answer here..."
                    className="w-full p-4 pr-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-lg disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 dark:disabled:text-slate-500"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={disabled || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
            {submittedAnswer && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correct Answer</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">{question.answer}</p>
                </div>
            )}
        </form>
    );
};

// Legacy export for backwards compatibility
export {KeywordsInput as ShortAnswerInput};
