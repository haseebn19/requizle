# ReQuizle

[![CI](https://github.com/haseebn19/requizle/actions/workflows/ci.yml/badge.svg)](https://github.com/haseebn19/requizle/actions/workflows/ci.yml)

<img src="public/icon.svg" alt="ReQuizle Logo" width="250">

ReQuizle is a modern web application designed to help users study efficiently through spaced repetition and active recall.

## Features

- **Focused Study Experience**: Clean, distraction-free UI with smooth animations.
- **Mastery Tracking**: Track progress and mastery percentage for each subject and topic.
- **Spaced Repetition**: Option to include or exclude mastered questions from the study queue.
- **Multiple Question Types**: Support for various question formats:
  - Multiple Choice
  - Multiple Answer
  - True/False
  - Keywords
  - Matching
  - Word Bank
- **Data Persistence**: Progress automatically saved to local storage.
- **Custom Content Import**: Import your own subjects and questions via JSON.
- **Profile Management**: Create and manage multiple study profiles.
- **Dark Mode**: Built-in theme toggle for comfortable studying.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Privacy-Focused**: All data is stored locally in your browser - no server required.

## Prerequisites

- Node.js 18.x or higher
- npm (Node Package Manager)
- A modern web browser

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haseebn19/ReQuizle.git
   ```

2. Navigate to the project directory:
   ```bash
   cd ReQuizle
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Select a Subject**:
   - Choose a subject from the left sidebar
   - Select specific topics or study all

2. **Answer Questions**:
   - Questions appear one at a time in the center
   - Submit your answer or skip to come back later
   - Incorrect questions are automatically re-queued

3. **Track Progress**:
   - View mastery percentage for each subject and topic
   - Toggle "Include Mastered" to review completed questions

4. **Import Custom Content**:
   - Use the Import tab in the right sidebar
   - Upload JSON files with your own subjects and questions

## Importing Custom Content

You can import your own subjects and questions using JSON. Upload a file or paste JSON in the Import tab.

### JSON Format

```json
[
  {
    "id": "example-subject",
    "name": "Example Subject",
    "topics": [
      {
        "id": "topic-1",
        "name": "All Question Types",
        "questions": [
          {
            "id": "q1",
            "type": "multiple_choice",
            "topicId": "topic-1",
            "prompt": "What is the capital of France?",
            "choices": ["London", "Paris", "Berlin", "Madrid"],
            "answerIndex": 1,
            "explanation": "Paris is the capital of France."
          },
          {
            "id": "q2",
            "type": "multiple_answer",
            "topicId": "topic-1",
            "prompt": "Select all prime numbers:",
            "choices": ["2", "4", "5", "9"],
            "answerIndices": [0, 2],
            "explanation": "2 and 5 are prime. 4 and 9 are composite."
          },
          {
            "id": "q3",
            "type": "true_false",
            "topicId": "topic-1",
            "prompt": "The Earth is flat.",
            "answer": false,
            "explanation": "The Earth is roughly spherical."
          },
          {
            "id": "q4",
            "type": "keywords",
            "topicId": "topic-1",
            "prompt": "What gas do plants absorb from the air?",
            "answer": ["carbon dioxide", "co2"],
            "explanation": "Plants absorb CO2 for photosynthesis."
          },
          {
            "id": "q5",
            "type": "matching",
            "topicId": "topic-1",
            "prompt": "Match the countries to their capitals:",
            "pairs": [
              { "left": "Japan", "right": "Tokyo" },
              { "left": "Italy", "right": "Rome" },
              { "left": "Egypt", "right": "Cairo" }
            ]
          },
          {
            "id": "q6",
            "type": "word_bank",
            "topicId": "topic-1",
            "prompt": "Complete the sentence:",
            "sentence": "The _ is the powerhouse of the _.",
            "wordBank": ["mitochondria", "cell", "nucleus", "atom"],
            "answers": ["mitochondria", "cell"]
          }
        ]
      }
    ]
  }
]
```

### Question Types

| Type | Required Fields |
|------|----------------|
| `multiple_choice` | `choices` (array), `answerIndex` (number) |
| `multiple_answer` | `choices` (array), `answerIndices` (number array) |
| `true_false` | `answer` (boolean) |
| `keywords` | `answer` (string or string array) |
| `matching` | `pairs` (array of `{left, right}`) |
| `word_bank` | `sentence` (with `_` for blanks), `wordBank` (array), `answers` (array) |

All questions require: `id`, `type`, `topicId`, `prompt`

Optional: `explanation` (shown after answering)

## Building for Production

To create a production build:
```bash
npm run build
```

The build files will be created in the `dist` directory.

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage report:
```bash
npm run test:coverage
```

## Contributing

If you'd like to contribute to ReQuizle or have suggestions for improvements, please fork the repository and create a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Credits

This project uses open-source libraries:
- [React](https://react.dev/) - UI framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons

---

## License

This project is licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).
