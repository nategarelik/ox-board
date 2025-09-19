# Contributing to OX Board

First off, thank you for considering contributing to OX Board! It's people like you that make OX Board such a great tool for bringing professional DJ capabilities to everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Use cases and examples
- Mockups or wireframes if applicable

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue that pull request!

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/ox-board.git
cd ox-board

# Install dependencies
npm install

# Create a .env.local file (copy from .env.example)
cp .env.example .env.local

# Run the development server
npm run dev
```

### Code Style

- We use TypeScript for type safety
- Follow the existing code style (enforced by ESLint and Prettier)
- Run `npm run lint` before committing
- Run `npm run type-check` to ensure type safety

### Testing

- Write tests for new features
- Run `npm test` to run the test suite
- Run `npm run test:coverage` to check coverage
- Aim for at least 80% code coverage for new code

### Commit Messages

We use conventional commits. Format: `type(scope): message`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

Examples:
```
feat(gestures): add pinch gesture for zoom control
fix(audio): resolve crackling sound in crossfader
docs(readme): update installation instructions
```

### Project Structure

```
ox-board/
├── app/                  # Next.js app directory
│   ├── components/       # React components
│   │   ├── AI/          # AI-powered features
│   │   ├── Camera/      # Webcam integration
│   │   ├── DJ/          # Core DJ interface
│   │   └── StemEffects/ # Audio visualizations
│   ├── services/        # Business logic
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # State management
│   ├── lib/             # Utility libraries
│   └── types/           # TypeScript definitions
├── public/              # Static assets
└── tests/               # Test files
```

## Key Technologies

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tone.js**: Audio processing
- **MediaPipe**: Hand tracking
- **Three.js**: 3D visualizations
- **Zustand**: State management

## Areas We Need Help With

- **Performance Optimization**: Improving gesture recognition latency
- **Audio Features**: Advanced mixing algorithms, beat matching
- **UI/UX**: Making the interface more intuitive
- **Testing**: Increasing test coverage
- **Documentation**: Improving docs and tutorials
- **Accessibility**: Making the app usable for everyone
- **Cross-browser Compatibility**: Testing and fixes

## Review Process

1. A maintainer will review your PR within 3-5 days
2. Address any requested changes
3. Once approved, your PR will be merged

## Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README and release notes. Thank you for your contribution!