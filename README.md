# Fides Vera - Catholic RAG Chatbot

A comprehensive Catholic-focused Retrieval-Augmented Generation (RAG) chatbot named Fides Vera, designed to provide accurate and insightful responses based on Catholic teachings and documents.

## Features

- Groq API integration for high-performance inference
- React frontend with responsive design
- Advanced chat interface with source citations
- Comprehensive Catholic document corpus
- Tailored for accessible Catholic theological exploration

## Getting Started

### Prerequisites

- Node.js v20 or higher
- npm or yarn
- Groq API key (sign up at https://console.groq.com)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fides-vera.git
   cd fides-vera
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the setup script to create your environment file:
   ```bash
   node setup.js
   ```

4. Open the `.env` file in the root directory and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. Start the development server:
   
   On macOS/Linux:
   ```bash
   npm run dev
   ```
   
   On Windows (if you're not using Git Bash):
   ```bash
   npx cross-env NODE_ENV=development tsx server/index.ts
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Environment Variables

- `GROQ_API_KEY`: Your Groq API key (required for production use)
- `PORT`: The port to run the server on (default: 5000)
- `NODE_ENV`: The environment to run the app in (development/production)

## Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run check`: Run TypeScript type checking

## Deployment

This application can be deployed to various platforms:

### GitHub Pages or Netlify (Static Frontend Only)

For the static frontend only, you can deploy the built files to GitHub Pages or Netlify. Note that you'll need a separate backend service.

### Full-Stack Deployment

For full-stack deployment, consider:

- Heroku: Deploy the entire application
- Vercel: Deploy with serverless functions
- AWS/GCP/Azure: Deploy with Docker or serverless options

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Groq API for powerful language model inference
- Catholic documents and teachings referenced in the application