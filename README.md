# PulseRecall

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A modern, single-page web application designed to help users study efficiently through spaced repetition and active recall. PulseRecall features a distraction-free interface, comprehensive mastery tracking, and support for multiple question types.

## ✨ Features

- **🎯 Focused Study Experience**: Clean, distraction-free UI with smooth animations
- **📊 Mastery Tracking**: Track progress and mastery percentage for each subject and topic
- **🔄 Spaced Repetition**: Option to include or exclude mastered questions from the study queue
- **📝 Multiple Question Types**:
  - Multiple Choice
  - Multiple Answer
  - True/False
  - Short Answer
  - Matching (with randomized right-side options)
  - Word Bank
- **💾 Data Persistence**: Progress automatically saved to local storage
- **📥 Custom Content Import**: Import your own subjects and questions via JSON
- **🌓 Dark Mode**: Built-in theme toggle for comfortable studying
- **👤 Profile Management**: Create and manage multiple study profiles
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎨 Collapsible Sidebars**: Toggle sidebars for a focused study experience

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS v3
- **State Management**: Zustand (with persistence)
- **Animations**: Framer Motion + Canvas Confetti
- **Icons**: Lucide React
- **Testing**: Vitest

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haseebn19/QuizTool.git
   cd QuizTool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in the terminal).

### Building for Production

Build the application for deployment:
```bash
npm run build
```

The output will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Testing

Run the test suite:
```bash
npm test
```

### Linting

Check code quality:
```bash
npm run lint
```

## 📖 Usage

### Starting a Study Session

1. Select a subject from the left sidebar
2. Choose topics to study (or select all)
3. Optionally toggle "Include Mastered" to review completed questions
4. Start answering questions!

### Importing Custom Content

You can import your own subjects and questions using the "Import" tab in the right sidebar.

#### JSON Format

You can import a single subject object or an array of subjects:

```json
[
  {
    "id": "math-101",
    "name": "Mathematics 101",
    "topics": [
      {
        "id": "algebra",
        "name": "Algebra Basics",
        "questions": [
          {
            "id": "q1",
            "type": "multiple_choice",
            "topicId": "algebra",
            "prompt": "Solve for x: 2x + 4 = 10",
            "choices": ["2", "3", "4", "5"],
            "answerIndex": 1,
            "explanation": "Subtract 4 from both sides to get 2x = 6, then divide by 2."
          },
          {
            "id": "q2",
            "type": "multiple_answer",
            "topicId": "algebra",
            "prompt": "Which of these are prime numbers?",
            "choices": ["2", "4", "5", "9"],
            "answerIndices": [0, 2],
            "explanation": "2 and 5 are prime. 4 and 9 are composite."
          },
          {
            "id": "q3",
            "type": "true_false",
            "topicId": "algebra",
            "prompt": "A negative times a negative is a positive.",
            "answer": true,
            "explanation": "This is a fundamental rule of arithmetic."
          },
          {
            "id": "q4",
            "type": "short_answer",
            "topicId": "algebra",
            "prompt": "What is the coefficient in 5x?",
            "answer": "5",
            "caseSensitive": false
          },
          {
            "id": "q5",
            "type": "matching",
            "topicId": "algebra",
            "prompt": "Match the terms",
            "pairs": [
              { "left": "x + x", "right": "2x" },
              { "left": "x * x", "right": "x^2" }
            ]
          },
          {
            "id": "q6",
            "type": "word_bank",
            "topicId": "algebra",
            "prompt": "Fill in the blanks",
            "sentence": "The _ is the top number of a fraction.",
            "wordBank": ["numerator", "denominator", "quotient"],
            "answers": ["numerator"]
          }
        ]
      }
    ]
  }
]
```

### Question Types

#### Multiple Choice
- Single correct answer from multiple options
- Requires `choices` array and `answerIndex`

#### Multiple Answer
- Multiple correct answers from options
- Requires `choices` array and `answerIndices` array

#### True/False
- Simple boolean answer
- Requires `answer` (boolean)

#### Short Answer
- Text input answer
- Supports case-sensitive and case-insensitive matching
- Requires `answer` (string or array of strings)
- Optional `caseSensitive` boolean

#### Matching
- Match items from left column to right column
- Right side is automatically randomized
- Requires `pairs` array with `left` and `right` properties

#### Word Bank
- Fill in blanks in a sentence
- Requires `sentence` (with `_` for blanks), `wordBank` array, and `answers` array

## 🏗️ Project Structure

```
QuizTool/
├── src/
│   ├── components/          # React components
│   │   ├── inputs/          # Question input components
│   │   └── ...
│   ├── context/             # React context providers
│   ├── store/               # Zustand state management
│   ├── utils/               # Utility functions
│   ├── types.ts             # TypeScript type definitions
│   └── ...
├── public/                  # Static assets
├── dist/                    # Production build output
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://haseebn19.github.io/QuizTool](https://haseebn19.github.io/QuizTool)
- **Repository**: [https://github.com/haseebn19/QuizTool](https://github.com/haseebn19/QuizTool)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
