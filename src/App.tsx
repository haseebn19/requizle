import {useEffect} from 'react';
import {Layout} from './components/Layout';
import {LeftSidebar} from './components/LeftSidebar';
import {RightSidebar} from './components/RightSidebar';
import {CenterArea} from './components/CenterArea';
import {useQuizStore} from './store/useQuizStore';

// Sample data for initial load if empty
const SAMPLE_SUBJECTS = [
  {
    id: 'science',
    name: 'Science',
    topics: [
      {
        id: 'physics-basics',
        name: 'Physics Basics',
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            topicId: 'physics-basics',
            prompt: 'What is the unit of force?',
            choices: ['Newton', 'Joule', 'Pascal', 'Watt'],
            answerIndex: 0,
            explanation: 'Force is measured in Newtons (N).'
          },
          {
            id: 'q2',
            type: 'true_false',
            topicId: 'physics-basics',
            prompt: 'Gravity is a force.',
            answer: true,
            explanation: 'Yes, gravity is a fundamental force of attraction.'
          }
        ]
      },
      {
        id: 'chemistry-basics',
        name: 'Chemistry Basics',
        questions: [
          {
            id: 'q3',
            type: 'short_answer',
            topicId: 'chemistry-basics',
            prompt: 'What is the chemical symbol for Gold?',
            answer: 'Au',
            caseSensitive: false,
            explanation: 'Au comes from the Latin word Aurum.'
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
    <Layout
      leftSidebar={<LeftSidebar />}
      center={<CenterArea />}
      rightSidebar={<RightSidebar />}
    />
  );
}

export default App;
