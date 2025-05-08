# Contributing to Fides Vera

Thank you for considering contributing to Fides Vera! This document outlines the process for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an open and welcoming environment.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant logs or screenshots

### Suggesting Features

If you have an idea for a new feature, please open an issue with:

- A clear, descriptive title
- A detailed description of the proposed feature
- Why this feature would be beneficial to the project
- Any implementation ideas you may have

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run tests if available
5. Submit a pull request

#### Pull Request Guidelines

- Keep changes focused and address a single concern
- Write clear, descriptive commit messages
- Include tests for new features or bug fixes if possible
- Update documentation as needed
- Reference related issues in your pull request description

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fides-vera.git
   cd fides-vera
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   node setup.js
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## File Structure

```
fides-vera/
├── client/             # Frontend React application
│   ├── src/            # Source files
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions and type definitions
│   │   └── pages/      # Page components
├── server/             # Backend Express server
│   ├── services/       # Service layer
│   └── index.ts        # Entry point
├── shared/             # Shared types and schemas
└── vite.config.ts      # Vite configuration
```

## License

By contributing to Fides Vera, you agree that your contributions will be licensed under the project's MIT License.