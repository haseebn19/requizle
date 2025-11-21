import React, {useState, useEffect} from 'react';
import type {WordBankQuestion} from '../../types';
import {clsx} from 'clsx';
import {motion} from 'framer-motion';

interface Props {
    question: WordBankQuestion;
    onAnswer: (answer: string[]) => void;
    disabled: boolean;
    submittedAnswer: string[] | null;
}

export const WordBankInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    const [filledSlots, setFilledSlots] = useState<(string | null)[]>(
        new Array(question.sentence.split('_').length - 1).fill(null)
    );
    const [availableWords, setAvailableWords] = useState<string[]>(question.wordBank);

    useEffect(() => {
        if (submittedAnswer) {
            setFilledSlots(submittedAnswer);
            // Re-calculate available words
            const used = submittedAnswer.filter(Boolean) as string[];
            const remaining = [...question.wordBank];
            used.forEach(word => {
                const idx = remaining.indexOf(word);
                if (idx > -1) remaining.splice(idx, 1);
            });
            setAvailableWords(remaining);
        }
    }, [submittedAnswer]);

    const handleWordClick = (word: string) => {
        if (disabled) return;

        // Find first empty slot
        const emptyIndex = filledSlots.indexOf(null);
        if (emptyIndex === -1) return;

        const newSlots = [...filledSlots];
        newSlots[emptyIndex] = word;
        setFilledSlots(newSlots);

        setAvailableWords(prev => {
            const newWords = [...prev];
            const idx = newWords.indexOf(word);
            if (idx > -1) newWords.splice(idx, 1);
            return newWords;
        });
    };

    const handleSlotClick = (index: number) => {
        if (disabled) return;

        const word = filledSlots[index];
        if (!word) return;

        const newSlots = [...filledSlots];
        newSlots[index] = null;
        setFilledSlots(newSlots);

        setAvailableWords(prev => [...prev, word]);
    };

    const isComplete = filledSlots.every(s => s !== null);

    // Split sentence by underscores to render slots
    const parts = question.sentence.split('_');

    return (
        <div className="space-y-8">
            {/* Sentence Area */}
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 leading-loose text-lg text-slate-800">
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            <button
                                onClick={() => handleSlotClick(i)}
                                disabled={disabled || !filledSlots[i]}
                                className={clsx(
                                    "inline-flex items-center justify-center min-w-[100px] h-10 mx-1 px-3 rounded-lg border-b-2 transition-all align-middle",
                                    filledSlots[i]
                                        ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 group"
                                        : "bg-white border-slate-300"
                                )}
                            >
                                {filledSlots[i] || <span className="w-full h-0.5 bg-slate-200"></span>}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Word Bank */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Word Bank</h3>
                <div className="flex flex-wrap gap-2">
                    {availableWords.map((word, i) => (
                        <motion.button
                            key={`${word}-${i}`}
                            layoutId={`word-${word}-${i}`}
                            onClick={() => handleWordClick(word)}
                            disabled={disabled}
                            className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-700 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all"
                        >
                            {word}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onAnswer(filledSlots as string[])}
                    disabled={disabled || !isComplete}
                    className="btn btn-primary"
                >
                    Submit Answer
                </button>
            </div>
        </div>
    );
};
