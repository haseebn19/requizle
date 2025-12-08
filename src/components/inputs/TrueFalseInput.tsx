import React from 'react';
import type {TrueFalseQuestion} from '../../types';
import {clsx} from 'clsx';
import {motion} from 'framer-motion';
import {Check, X} from 'lucide-react';

interface Props {
    question: TrueFalseQuestion;
    onAnswer: (answer: boolean) => void;
    disabled: boolean;
    submittedAnswer: boolean | null;
}

export const TrueFalseInput: React.FC<Props> = ({question, onAnswer, disabled, submittedAnswer}) => {
    const options = [
        {value: true, label: 'True', icon: Check, color: 'green'},
        {value: false, label: 'False', icon: X, color: 'red'}
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {options.map((option) => {
                const isSelected = submittedAnswer === option.value;
                const isCorrect = option.value === question.answer;

                let stateClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200";

                if (submittedAnswer !== null) {
                    if (isCorrect) {
                        stateClass = "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400 ring-1 ring-green-500";
                    } else if (isSelected) {
                        stateClass = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400 ring-1 ring-red-500";
                    } else {
                        stateClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 opacity-50";
                    }
                }

                const Icon = option.icon;
                const isDisabled = disabled || submittedAnswer !== null;

                return (
                    <motion.button
                        key={String(option.value)}
                        whileHover={!isDisabled ? {scale: 1.02} : {}}
                        whileTap={!isDisabled ? {scale: 0.98} : {}}
                        onClick={() => {
                            if (!isDisabled) {
                                onAnswer(option.value);
                            }
                        }}
                        disabled={isDisabled}
                        className={clsx(
                            "flex flex-col items-center justify-center p-8 rounded-xl border-2 font-bold text-lg transition-all duration-200 gap-3",
                            stateClass,
                            isDisabled && "cursor-not-allowed"
                        )}
                    >
                        <div className={clsx(
                            "p-3 rounded-full",
                            submittedAnswer !== null && isCorrect ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" :
                                submittedAnswer !== null && isSelected ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" :
                                    "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>
                            <Icon size={32} />
                        </div>
                        {option.label}
                    </motion.button>
                );
            })}
        </div>
    );
};
