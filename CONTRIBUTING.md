# Contributing

Guidelines and instructions for contributing to Architex.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/Architex.git
   cd Architex
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a `.env.local` file based on `.env.example`
5. Run the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Run tests and linting:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm build
   ```

4. Commit your changes:
   ```bash
   git commit -m "feat: add your feature"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request

## Coding Standards

- Use TypeScript for all new files
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Write type-safe code
- Keep functions small and focused

## Commit Message Format

We follow the Conventional Commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure all tests pass and there are no linting errors
3. Update documentation as necessary
4. Request review from maintainers

## Code Review

All submissions require review before merging. We use GitHub pull requests for this purpose.

## Questions

Open an issue for questions or concerns.
