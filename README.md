# FlowSwift

AI-powered construction reporting app that transforms voice notes into professional daily reports.

## Features

- **Voice Recording** - Capture field notes hands-free with audio recording
- **AI Transcription** - Automatic speech-to-text using OpenAI Whisper
- **Batch Processing** - Transcribe multiple recordings simultaneously
- **AI Chat Assistant** - Interactive chat with streaming responses for report refinement
- **Smart Report Generation** - AI-powered content intelligence analyzes transcriptions and generates structured reports
- **Template System** - Upload custom DOCX templates with editable blocks
- **Document Export** - Generate professional Word documents from reports

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **AI**: OpenAI (Whisper for transcription, GPT for chat and content generation)

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# VITE_FIREBASE_API_KEY=...
# VITE_OPENAI_API_KEY=...

# Start development server
npm run dev
```

### Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Deploy functions
cd functions && npm install
firebase deploy --only functions
```

## Project Structure

```
src/
├── apis/           # API integrations (Firebase, OpenAI)
├── components/     # React components
│   ├── ui/         # shadcn/ui primitives
│   ├── auth/       # Authentication components
│   ├── dashboard/  # Main app components
│   ├── reports/    # Report generation UI
│   └── shared/     # Shared components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── models/         # Data models
├── pages/          # Page components
├── services/       # Business logic services
├── styles/         # Global styles
└── utils/          # Utility functions
functions/          # Firebase Cloud Functions
```

## License

MIT
