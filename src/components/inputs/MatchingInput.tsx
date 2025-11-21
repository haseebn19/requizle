import React, {useState, useEffect} from 'react';
import type {MatchingQuestion} from '../../types';
import {clsx} from 'clsx';
import {motion} from 'framer-motion';

interface Props {
    question: MatchingQuestion;
    onAnswer: (answer: Record<string, string>) => void;
    disabled: boolean;
    submittedAnswer: Record<string, string> | null;
}

export const MatchingInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

    useEffect(() => {
        if (submittedAnswer) {
            setMatches(submittedAnswer);
        }
    }, [submittedAnswer]);

    const handleLeftClick = (leftId: string) => {
        if (disabled) return;
        if (matches[leftId]) {
            // Unmatch
            const newMatches = {...matches};
            delete newMatches[leftId];
            setMatches(newMatches);
        } else {
            setSelectedLeft(leftId === selectedLeft ? null : leftId);
        }
    };

    const handleRightClick = (rightId: string) => {
        if (disabled || !selectedLeft) return;

        // Check if this right item is already matched
        const isAlreadyMatched = Object.values(matches).includes(rightId);
        if (isAlreadyMatched) return;

        setMatches(prev => ({
            ...prev,
            [selectedLeft]: rightId
        }));
        setSelectedLeft(null);
    };

    const isComplete = Object.keys(matches).length === question.pairs.length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items</h3>
                    {question.pairs.map((pair) => {
                        const isMatched = !!matches[pair.left];
                        const isSelected = selectedLeft === pair.left;

                        return (
                            <motion.button
                                key={pair.left}
                                onClick={() => handleLeftClick(pair.left)}
                                disabled={disabled}
                                className={clsx(
                                    "w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all",
                                    isMatched ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                                        isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105" :
                                            "bg-white border-slate-200 hover:border-indigo-300 text-slate-700"
                                )}
                            >
                                {pair.left}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Matches</h3>
                    {question.pairs.map((pair) => {
                        // Find which left item is matched to this right item
                        const matchedLeft = Object.keys(matches).find(key => matches[key] === pair.right);
                        const isMatched = !!matchedLeft;

                        return (
                            <motion.button
                                key={pair.right}
                                onClick={() => handleRightClick(pair.right)}
                                disabled={disabled || (!!matchedLeft && disabled)} // Allow clicking if not disabled (logic handled in function)
                                className={clsx(
                                    "w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all relative",
                                    isMatched ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                                        selectedLeft ? "bg-white border-slate-200 border-dashed hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer" :
                                            "bg-slate-50 border-slate-100 text-slate-400 cursor-default"
                                )}
                            >
                                {pair.right}
                                {matchedLeft && (
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                                        {question.pairs.findIndex(p => p.left === matchedLeft) + 1}
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onAnswer(matches)}
                    disabled={disabled || !isComplete}
                    className="btn btn-primary"
                >
                    Submit Matches
                </button>
            </div>
        </div>
    );
};
