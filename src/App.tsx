import {useEffect} from 'react';
import {Layout} from './components/Layout';
import {LeftSidebar} from './components/LeftSidebar';
import {RightSidebar} from './components/RightSidebar';
import {CenterArea} from './components/CenterArea';
import {useQuizStore} from './store/useQuizStore';
import {ThemeProvider} from './context/ThemeContext';

// Sample data for initial load if empty
const SAMPLE_SUBJECTS = [
  {
    id: 'feature-showcase',
    name: 'PulseRecall Features',
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
            type: 'short_answer',
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
          }
        ]
      }
    ]
  }
];

function App() {
  const {subjects, setSubjects} = useQuizStore();

  useEffect(() => {
    // Load sample data if no subjects exist (first run)
    if (subjects.length === 0) {
      setSubjects(SAMPLE_SUBJECTS as any);
    }
  }, []);

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
