import React from 'react';
import type {MultipleChoiceQuestion} from '../../types';
import {clsx} from 'clsx';
import {motion} from 'framer-motion';

interface Props {
    question: MultipleChoiceQuestion;
    onAnswer: (answerIndex: number) => void;
    disabled: boolean;
    submittedAnswer: number | null;
}

export const MultipleChoiceInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    return (
        <div className="grid grid-cols-1 gap-3">
            {question.choices.map((choice, index) => {
                const isSelected = submittedAnswer === index;
                const isCorrect = index === question.answerIndex;

                let stateClass = "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700";

                if (submittedAnswer !== null) {
                    if (isCorrect) {
                        stateClass = "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500";
                    } else if (isSelected) {
                        stateClass = "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500";
                    } else {
                        stateClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                    }
                }

                return (
                    <motion.button
                        key={index}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.1}}
                        onClick={() => !disabled && onAnswer(index)}
                        disabled={disabled}
                        className={clsx(
                            "w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200",
                            stateClass
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                                submittedAnswer !== null && isCorrect ? "border-green-500 bg-green-100 text-green-700" :
                                    submittedAnswer !== null && isSelected ? "border-red-500 bg-red-100 text-red-700" :
                                        "border-slate-300 text-slate-500"
                            )}>
                                {String.fromCharCode(65 + index)}
                            </div>
                            <span>{choice}</span>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};
