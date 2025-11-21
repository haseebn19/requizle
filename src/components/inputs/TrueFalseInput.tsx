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

                const Icon = option.icon;

                return (
                    <motion.button
                        key={String(option.value)}
                        whileHover={!disabled ? {scale: 1.02} : {}}
                        whileTap={!disabled ? {scale: 0.98} : {}}
                        onClick={() => !disabled && onAnswer(option.value)}
                        disabled={disabled}
                        className={clsx(
                            "flex flex-col items-center justify-center p-8 rounded-xl border-2 font-bold text-lg transition-all duration-200 gap-3",
                            stateClass
                        )}
                    >
                        <div className={clsx(
                            "p-3 rounded-full",
                            submittedAnswer !== null && isCorrect ? "bg-green-100 text-green-600" :
                                submittedAnswer !== null && isSelected ? "bg-red-100 text-red-600" :
                                    "bg-slate-100 text-slate-500"
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
