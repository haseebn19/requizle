/*
 * ReQuizle - A spaced repetition study tool
 * Copyright (C) 2025 ReQuizle
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 */

import {useEffect} from 'react';
import {Layout} from './components/Layout';
import {LeftSidebar} from './components/LeftSidebar';
import {RightSidebar} from './components/RightSidebar';
import {CenterArea} from './components/CenterArea';
import {useQuizStore} from './store/useQuizStore';
import {ThemeProvider} from './context/ThemeContext';
import type {Subject} from './types';

// Sample data for initial load if empty
const SAMPLE_SUBJECTS: Subject[] = [
  {
    id: 'feature-showcase',
    name: 'ReQuizle Features',
    topics: [
      {
        id: 'all-types',
        name: 'All Question Types',
        questions: [
          {
            id: 'q-mc',
            type: 'multiple_choice',
            topicId: 'all-types',
            prompt: 'Which of these is a JavaScript framework?',
            choices: ['Laravel', 'Django', 'React', 'Spring'],
            answerIndex: 2,
            explanation: 'React is a popular JavaScript library/framework for building user interfaces.'
          },
          {
            id: 'q-ma',
            type: 'multiple_answer',
            topicId: 'all-types',
            prompt: 'Select all prime numbers.',
            choices: ['2', '4', '5', '9', '11'],
            answerIndices: [0, 2, 4],
            explanation: '2, 5, and 11 are prime. 4 and 9 are composite.'
          },
          {
            id: 'q-tf',
            type: 'true_false',
            topicId: 'all-types',
            prompt: 'TypeScript is a superset of JavaScript.',
            answer: true,
            explanation: 'Yes, TypeScript adds static typing to JavaScript.'
          },
          {
            id: 'q-sa',
            type: 'keywords',
            topicId: 'all-types',
            prompt: 'What is the capital of France?',
            answer: 'Paris',
            caseSensitive: false,
            explanation: 'Paris is the capital city of France.'
          },
          {
            id: 'q-matching',
            type: 'matching',
            topicId: 'all-types',
            prompt: 'Match the language to its file extension.',
            pairs: [
              {left: 'Python', right: '.py'},
              {left: 'JavaScript', right: '.js'},
              {left: 'TypeScript', right: '.ts'},
              {left: 'Java', right: '.java'}
            ]
          },
          {
            id: 'q-wb',
            type: 'word_bank',
            topicId: 'all-types',
            prompt: 'Complete the sentence about React.',
            sentence: 'React uses a _ DOM to optimize _ updates.',
            wordBank: ['virtual', 'real', 'rendering', 'network', 'database'],
            answers: ['virtual', 'rendering']
          },
          {
            id: 'q-latex',
            type: 'multiple_choice',
            topicId: 'all-types',
            prompt: 'What is the derivative of $f(x) = x^3$?',
            choices: ['$3x^2$', '$x^2$', '$3x$', '$x^3$'],
            answerIndex: 0,
            explanation: 'Using the power rule: $\\frac{d}{dx}x^n = nx^{n-1}$, so $\\frac{d}{dx}x^3 = 3x^2$'
          }
        ]
      }
    ]
  }
];

function App() {
  const {profiles, activeProfileId, setSubjects} = useQuizStore();
  const subjects = profiles[activeProfileId]?.subjects || [];

  useEffect(() => {
    // Load sample data if no subjects exist (first run)
    if (subjects.length === 0) {
      setSubjects(SAMPLE_SUBJECTS);
    }
  }, [subjects.length, setSubjects]);

  return (
    <ThemeProvider>
      <Layout
        leftSidebar={<LeftSidebar />}
        center={<CenterArea />}
        rightSidebar={<RightSidebar />}
      />
    </ThemeProvider>
  );
}

export default App;
