# Semantic Kernel Interactive Demo

An interactive web application showcasing Microsoft's Semantic Kernel capabilities including semantic memory, AI-powered functions, translation, and text summarization.

## Quick Start

1. Create a `.env` file with your Azure OpenAI credentials:
```
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=your-embedding-deployment-name
```

2. Install dependencies:
```
cd frontend && npm install
```
```
cd backend && pip install -r pyproject.toml
```

3. Start the application:
```
./start.sh
```

The script will launch both the backend server (http://localhost:8000) and frontend application (http://localhost:5173). Use Ctrl+C to stop both services.

## Features

- **Semantic Memory**: Store and retrieve information using semantic search
- **AI Functions**: Create and use AI-powered functions with natural language
- **Translation**: Translate text between multiple languages
- **Summarization**: Generate concise summaries of long texts
- **Weather Plugin**: Example of native plugin integration

## Requirements

- Node.js (v14+)
- Python (v3.13+)
- Azure OpenAI API credentials

## Project Structure

- `frontend/`: React application with Material UI
- `backend/`: FastAPI server with Semantic Kernel implementation
- `start.sh`: Convenience script to run both services

For detailed documentation and examples, visit the [Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
