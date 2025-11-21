import React, {useState, useEffect} from 'react';
import type {MultipleAnswerQuestion} from '../../types';
import {clsx} from 'clsx';
import {motion} from 'framer-motion';
import {CheckSquare, Square} from 'lucide-react';

interface Props {
    question: MultipleAnswerQuestion;
    onAnswer: (answer: number[]) => void;
    disabled: boolean;
    submittedAnswer: number[] | null;
}

export const MultipleAnswerInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    useEffect(() => {
        if (submittedAnswer) {
            setSelectedIndices(submittedAnswer);
        }
    }, [submittedAnswer]);

    const toggleSelection = (index: number) => {
        if (disabled) return;

        setSelectedIndices(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const handleSubmit = () => {
        onAnswer(selectedIndices);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {question.choices.map((choice, index) => {
                    const isSelected = selectedIndices.includes(index);
                    const isCorrect = submittedAnswer && question.answerIndices.includes(index);
                    const isMissed = submittedAnswer && !isSelected && question.answerIndices.includes(index);
                    const isWrong = submittedAnswer && isSelected && !question.answerIndices.includes(index);

                    let borderColor = "border-slate-200";
                    let bgColor = "bg-white";
                    let textColor = "text-slate-700";

                    if (submittedAnswer) {
                        if (isCorrect) {
                            borderColor = "border-green-500";
                            bgColor = "bg-green-50";
                            textColor = "text-green-800";
                        } else if (isMissed) {
                            borderColor = "border-green-300 border-dashed";
                            bgColor = "bg-green-50/50";
                            textColor = "text-green-600";
                        } else if (isWrong) {
                            borderColor = "border-red-500";
                            bgColor = "bg-red-50";
                            textColor = "text-red-800";
                        } else {
                            borderColor = "border-slate-200";
                            bgColor = "bg-slate-50 opacity-60";
                            textColor = "text-slate-400";
                        }
                    } else if (isSelected) {
                        borderColor = "border-indigo-600";
                        bgColor = "bg-indigo-50";
                        textColor = "text-indigo-900";
                    }

                    return (
                        <motion.button
                            key={index}
                            whileHover={!disabled ? {scale: 1.01} : {}}
                            whileTap={!disabled ? {scale: 0.99} : {}}
                            onClick={() => toggleSelection(index)}
                            disabled={disabled}
                            className={clsx(
                                "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 group",
                                borderColor,
                                bgColor,
                                textColor,
                                !disabled && !isSelected && "hover:border-indigo-200 hover:bg-slate-50"
                            )}
                        >
                            <div className={clsx(
                                "flex-shrink-0 transition-colors",
                                isSelected ? "text-indigo-600" : "text-slate-300 group-hover:text-indigo-300",
                                submittedAnswer && isCorrect && "text-green-600",
                                submittedAnswer && isWrong && "text-red-600"
                            )}>
                                {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                            </div>
                            <span className="text-lg font-medium">{choice}</span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={disabled || selectedIndices.length === 0}
                    className="btn btn-primary"
                >
                    Submit Answer
                </button>
            </div>
        </div>
    );
};
