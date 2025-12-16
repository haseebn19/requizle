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
- **LaTeX Support**: Render mathematical equations using `\(...\)` (inline) and `\[...\]` (block) syntax.
- **Media Support**: Add images or videos to questions via URL, base64, or local file upload.
- **Data Persistence**: Progress automatically saved to IndexedDB for large datasets.
- **Custom Content Import**: Import your own subjects and questions via JSON with automatic type detection.
- **Profile Management**: Create, rename, and manage multiple study profiles.
- **Dark Mode**: Built-in theme toggle for comfortable studying.
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Collapsible Sidebars**: Hide sidebars for a focused study experience.
- **Installable**: Can be installed as a Progressive Web App (PWA) on desktop and mobile.
- **Privacy-Focused**: All data is stored locally in your browser - no server required.

## Prerequisites

- Node.js 18.x or higher
- npm (Node Package Manager)
- A modern web browser

## Installation

```bash
git clone https://github.com/haseebn19/ReQuizle.git
cd ReQuizle
npm install
```

## Usage

```bash
npm run dev
```

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
   - Upload JSON files with subjects, questions, or full profiles
   - Import type is automatically detected
   - Imported data merges with existing content (updates existing, adds new)

## Importing Custom Content

You can import your own subjects and questions using JSON. Upload a file or paste JSON in the Import tab.

### JSON Format

The format is designed to be simple and intuitive. IDs are auto-generated if not provided.

```json
[
  {
    "name": "Example Subject",
    "topics": [
      {
        "name": "All Question Types",
        "questions": [
          {
            "type": "multiple_choice",
            "question": "What is the capital of France?",
            "choices": ["London", "Paris", "Berlin", "Madrid"],
            "answerIndex": 1,
            "explanation": "Paris is the capital of France."
          },
          {
            "type": "multiple_answer",
            "question": "Select all prime numbers:",
            "choices": ["2", "4", "5", "9"],
            "answerIndices": [0, 2],
            "explanation": "2 and 5 are prime. 4 and 9 are composite."
          },
          {
            "type": "true_false",
            "question": "The Earth is flat.",
            "answer": false,
            "explanation": "The Earth is roughly spherical."
          },
          {
            "type": "keywords",
            "question": "What gas do plants absorb from the air?",
            "answer": ["carbon dioxide", "co2"],
            "explanation": "Plants absorb CO2 for photosynthesis."
          },
          {
            "type": "matching",
            "question": "Match the countries to their capitals:",
            "pairs": [
              { "left": "Japan", "right": "Tokyo" },
              { "left": "Italy", "right": "Rome" },
              { "left": "Egypt", "right": "Cairo" }
            ]
          },
          {
            "type": "word_bank",
            "question": "Complete the sentence:",
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

### Structure Reference

#### Subject (top level)
| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✓ | Display name |
| `topics` | ✓ | Array of topics |
| `id` | | Auto-generated if not provided. Provide to enable merging. |

#### Topic (inside subject)
| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✓ | Display name |
| `questions` | ✓ | Array of questions |
| `id` | | Auto-generated if not provided. Provide to enable merging. |

#### Question (inside topic)
| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✓ | One of: `multiple_choice`, `multiple_answer`, `true_false`, `keywords`, `matching`, `word_bank` |
| `question` | ✓ | The question text (or use `prompt`) |
| `id` | | Auto-generated if not provided. Provide to enable merging. |
| `explanation` | | Shown after answering |
| `media` | | Image/video URL or filename (see Media Support) |

**Type-specific fields:**

| Type | Required Fields |
|------|----------------|
| `multiple_choice` | `choices` (array), `answerIndex` (number) |
| `multiple_answer` | `choices` (array), `answerIndices` (number array) |
| `true_false` | `answer` (boolean) |
| `keywords` | `answer` (string or string array) |
| `matching` | `pairs` (array of `{left, right}`) |
| `word_bank` | `sentence` (with `_` for blanks), `wordBank` (array), `answers` (array) |

### Merging Behavior

By default, each import creates new content with unique auto-generated IDs. This prevents accidental data loss or mixing of unrelated content.

**To update/merge existing content**, provide explicit matching `id` values:

```json
// First import - creates new subject with ID "bio-101"
{"id": "bio-101", "name": "Biology", "topics": [...]}

// Later import - updates the same subject because ID matches
{"id": "bio-101", "name": "Biology", "topics": [...]}
```

**Without explicit IDs**, importing the same file twice creates separate copies:
```json
{"name": "Biology", ...}  // Creates "Biology" with ID "subject-1234-0"
{"name": "Biology", ...}  // Creates another "Biology" with ID "subject-1234-1"
```

### Media Support

Questions can include images or videos that display above the prompt. Three formats are supported:

#### 1. Online URLs (Recommended)
```json
{
  "prompt": "What organ is highlighted in this diagram?",
  "media": "https://example.com/anatomy-diagram.png"
}
```

For videos:
```json
{
  "prompt": "Watch the video and identify the process shown",
  "media": "https://example.com/mitosis.mp4"
}
```

#### 2. Base64 Data URIs
```json
{
  "prompt": "Identify this structure",
  "media": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

#### 3. Local Files (with Upload)
Reference files by name - you'll be prompted to upload them during import:
```json
{
  "prompt": "What is the capital marked on this map?",
  "media": "europe-map.png"
}
```

**Supported formats:**
- **Images**: PNG, JPG, GIF, WebP, SVG
- **Videos**: MP4, WebM, OGG, MOV, AVI, MKV

When importing JSON with local media references, a modal will appear listing the required files. Select the files from your computer, and they'll be embedded into the data.

### LaTeX Support

You can include LaTeX mathematical notation in prompts, choices, explanations, and answers using Anki-style delimiters:

- **Inline math**: Use `\(...\)` syntax, e.g., `"The formula \(E = mc^2\) describes..."`
- **Block math**: Use `\[...\]` syntax for centered equations

These delimiters are used instead of `$...$` to avoid conflicts with literal dollar signs in text (e.g., "$50").

Example:
```json
{
  "prompt": "Solve for \\(x\\) in the equation \\(2x + 5 = 15\\)",
  "choices": ["\\(x = 5\\)", "\\(x = 10\\)", "\\(x = 7.5\\)", "\\(x = 2\\)"],
  "answerIndex": 0,
  "explanation": "Subtract 5 from both sides: \\(2x = 10\\), then divide by 2: \\(x = 5\\)"
}
```

## Development

### Setup

```bash
npm install
```

### Testing

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Building

```bash
npm run build
```

The build files will be created in the `dist` directory.

## Project Structure

```
requizle/
├── src/
│   ├── components/       # React components
│   │   └── inputs/       # Question type input components
│   ├── context/          # React context providers
│   ├── store/            # Zustand state management
│   ├── test/             # Test setup
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── types.ts          # TypeScript type definitions
│   └── index.css         # Global styles
├── public/               # Static assets
├── .github/workflows/    # CI/CD configuration
└── dist/                 # Production build output
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Credits

- [React](https://react.dev/) - UI framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons

## License

This project is licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).
