# PulseRecall

PulseRecall is a modern, single-page web application designed to help users study efficiently through spaced repetition and active recall. It features a distraction-free interface, mastery tracking, and support for various question types.

## Features

- **Focused Study**: Distraction-free UI with smooth animations.
- **Mastery Tracking**: Tracks your progress and mastery percentage for each subject and topic.
- **Spaced Repetition**: Option to include or exclude mastered questions from the study queue.
- **Multiple Question Types**:
  - Multiple Choice
  - Multiple Answer
  - True/False
  - Short Answer
  - Matching
  - Word Bank
- **Data Persistence**: Progress is automatically saved to local storage.
- **Custom Content**: Import your own subjects and questions via JSON.

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS v3
- **State Management**: Zustand (with persistence)
- **Animations**: Framer Motion + Canvas Confetti
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository (if applicable) or navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

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

## Customizing Content (JSON Import)

You can import your own subjects and questions using the "Import" tab in the right sidebar.

### JSON Format

You can import a single subject object or an array of subjects.

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
            "id": "q1b",
            "type": "multiple_answer",
            "topicId": "algebra",
            "prompt": "Which of these are prime numbers?",
            "choices": ["2", "4", "5", "9"],
            "answerIndices": [0, 2],
            "explanation": "2 and 5 are prime. 4 and 9 are composite."
          },
          {
            "id": "q2",
            "type": "true_false",
            "topicId": "algebra",
            "prompt": "A negative times a negative is a positive.",
            "answer": true
          },
          {
            "id": "q3",
            "type": "short_answer",
            "topicId": "algebra",
            "prompt": "What is the coefficient in 5x?",
            "answer": "5",
            "caseSensitive": false
          },
          {
            "id": "q4",
            "type": "matching",
            "topicId": "algebra",
            "prompt": "Match the terms",
            "pairs": [
              { "left": "x + x", "right": "2x" },
              { "left": "x * x", "right": "x^2" }
            ]
          },
          {
            "id": "q5",
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

## License

MIT
