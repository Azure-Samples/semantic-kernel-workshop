# Semantic Kernel Interactive Demo

This project is an interactive demonstration of Microsoft's Semantic Kernel SDK, showcasing its key features through a modern web application. The demo includes examples of semantic memory, semantic functions, translation, native plugins, and summarization.

## Project Structure

- `frontend/`: React application built with Vite and Material UI
- `backend/`: Python FastAPI server implementing Semantic Kernel functionality

## Features

- **Semantic Memory**: Store and retrieve information based on meaning rather than exact matches
- **Semantic Functions**: Create AI-powered functions using natural language prompts
- **Translation**: Translate text between languages using AI
- **Weather Plugin**: Demonstrate native plugin functionality with a simulated weather service
- **Summarization**: Generate concise summaries of longer text

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- Azure OpenAI API credentials (or OpenAI API credentials)

## Setup Instructions

### Environment Configuration

1. Create a `.env` file in the root directory of the project with your Azure OpenAI credentials:

```
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=your-embedding-deployment-name
```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```
   python run.py
   ```
   The server will start on http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install the required npm packages:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The application will be available at http://localhost:5173

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Use the navigation menu to explore different features of Semantic Kernel
3. Each demo page includes explanations and examples to help you understand the concepts

## Learning Resources

- [Semantic Kernel GitHub Repository](https://github.com/microsoft/semantic-kernel)
- [Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/overview/)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

## Acknowledgements

This demo is based on the concepts presented in the Semantic Kernel workshop notebooks, specifically:
- `01-intro.ipynb`: Introduction to Semantic Kernel
- `02-memory.ipynb`: Memory capabilities in Semantic Kernel
