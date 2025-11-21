import React, {useState, useEffect} from 'react';
import type {Question} from '../types';
import {useQuizStore} from '../store/useQuizStore';
import {MultipleAnswerInput} from './inputs/MultipleAnswerInput';
import {MultipleChoiceInput} from './inputs/MultipleChoiceInput';
import {TrueFalseInput} from './inputs/TrueFalseInput';
import {ShortAnswerInput} from './inputs/ShortAnswerInput';
import {MatchingInput} from './inputs/MatchingInput';
import {WordBankInput} from './inputs/WordBankInput';
import {motion, AnimatePresence} from 'framer-motion';
import confetti from 'canvas-confetti';
import {ArrowRight, SkipForward, AlertCircle, CheckCircle2} from 'lucide-react';

interface Props {
    question: Question;
}

export const QuestionCard: React.FC<Props> = ({question}) => {
    const {submitAnswer, skipQuestion} = useQuizStore();
    const [submittedAnswer, setSubmittedAnswer] = useState<any>(null);
    const [result, setResult] = useState<{correct: boolean; explanation?: string} | null>(null);

    // Reset state when question changes
    useEffect(() => {
        setSubmittedAnswer(null);
        setResult(null);
    }, [question.id]);

    const handleAnswer = (answer: any) => {
        setSubmittedAnswer(answer);
        const res = submitAnswer(answer);
        setResult(res);

        if (res.correct) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: {y: 0.6},
                colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981']
            });
        }
    };

    const handleSkip = () => {
        skipQuestion();
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
                <motion.div
                    key={question.id}
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    transition={{duration: 0.3}}
                    className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                >
                    {/* Header / Prompt */}
                    <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {question.type.replace('_', ' ').toUpperCase()}
                            </span>
                            {!submittedAnswer && (
                                <button
                                    onClick={handleSkip}
                                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 transition-colors"
                                >
                                    Skip <SkipForward size={14} />
                                </button>
                            )}
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                            {question.prompt}
                        </h2>
                    </div>

                    {/* Input Area */}
                    <div className="p-6 md:p-8 bg-white">
                        {question.type === 'multiple_choice' && (
                            <MultipleChoiceInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                        {question.type === 'multiple_answer' && (
                            <MultipleAnswerInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                        {question.type === 'true_false' && (
                            <TrueFalseInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                        {question.type === 'short_answer' && (
                            <ShortAnswerInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                        {question.type === 'matching' && (
                            <MatchingInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                        {question.type === 'word_bank' && (
                            <WordBankInput
                                question={question}
                                onAnswer={handleAnswer}
                                disabled={!!submittedAnswer}
                                submittedAnswer={submittedAnswer}
                            />
                        )}
                    </div>

                    {/* Feedback Area */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{height: 0, opacity: 0}}
                                animate={{height: 'auto', opacity: 1}}
                                className={`border-t ${result.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-full ${result.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {result.correct ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
                                                {result.correct ? 'Correct!' : 'Not quite right'}
                                            </h3>
                                            {result.explanation && (
                                                <p className="mt-2 text-slate-600 leading-relaxed">
                                                    {result.explanation}
                                                </p>
                                            )}
                                            {!result.correct && (
                                                <div className="mt-3 p-3 bg-white rounded-lg border border-red-100 text-sm">
                                                    <span className="font-semibold text-red-800 block mb-1">Correct Answer:</span>
                                                    <span className="text-slate-700 font-medium">
                                                        {question.type === 'multiple_choice' && question.choices[question.answerIndex]}
                                                        {question.type === 'multiple_answer' && question.answerIndices.map(i => question.choices[i]).join(', ')}
                                                        {question.type === 'true_false' && (question.answer ? 'True' : 'False')}
                                                        {question.type === 'short_answer' && (Array.isArray(question.answer) ? question.answer.join(' or ') : question.answer)}
                                                        {question.type === 'matching' && (
                                                            <ul className="list-disc pl-4 mt-1 space-y-1">
                                                                {question.pairs.map((pair, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-semibold">{pair.left}</span> → {pair.right}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {question.type === 'word_bank' && (
                                                            question.sentence.split(/(_)/g).map((part, i) => {
                                                                if (part === '_') {
                                                                    // Find which answer corresponds to this blank
                                                                    // The sentence is split by _, so every odd index is a blank
                                                                    // e.g. "A _ B _" -> ["A ", "_", " B ", "_", ""]
                                                                    // blanks are at indices 1, 3.
                                                                    // The answer array corresponds to these blanks in order.
                                                                    // blankIndex = (i - 1) / 2
                                                                    const blankIndex = (i - 1) / 2;
                                                                    return <span key={i} className="px-1.5 py-0.5 mx-0.5 bg-green-100 text-green-800 rounded font-bold">{question.answers[blankIndex]}</span>;
                                                                }
                                                                return <span key={i}>{part}</span>;
                                                            })
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => useQuizStore.getState().nextQuestion()}
                                            className={`btn ${result.correct ? 'btn-primary bg-green-600 hover:bg-green-700 shadow-green-200' : 'btn-primary bg-red-600 hover:bg-red-700 shadow-red-200'} flex items-center gap-2`}
                                            autoFocus
                                        >
                                            Continue <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
