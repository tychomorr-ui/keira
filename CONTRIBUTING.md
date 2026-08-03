# Contributing to Sovereign Truth Trifecta Portal Chat

We welcome contributions to the Sovereign Truth Trifecta Portal Chat project! By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### 1. Fork the Repository

Fork the `sovereign-truth-engine` repository on GitHub to your personal account.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/sovereign-truth-engine.git
cd sovereign-truth-engine
```

### 3. Create a New Branch

Create a new branch for your feature or bug fix. Use a descriptive name.

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/your-bug-fix-name
```

### 4. Make Your Changes

-   **Code Style**: Adhere to the existing code style. We use ESLint and Prettier for code formatting.
-   **TypeScript**: Ensure all new code is type-safe and passes TypeScript checks.
-   **Tests**: Write unit and integration tests for your changes. Ensure all existing tests pass.
-   **Documentation**: Update relevant documentation (README, ARCHITECTURE, API docs) for any new features or changes.

### 5. Run Tests and Linting

Before committing, ensure your changes pass all tests and linting checks.

```bash
pnpm test
pnpm lint
```

### 6. Commit Your Changes

Write clear, concise commit messages that explain the purpose of your changes.

```bash
git commit -m "feat: Add new feature X" # for new features
git commit -m "fix: Resolve bug Y" # for bug fixes
```

### 7. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 8. Create a Pull Request

-   Go to the original `sovereign-truth-engine` repository on GitHub.
-   You will see an option to create a new Pull Request from your branch.
-   Provide a detailed description of your changes, including:
    -   What problem does this solve?
    -   How was it solved?
    -   Any relevant screenshots or test results.

## Code of Conduct

We are committed to fostering an open and welcoming environment. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to understand the expectations for all contributors.

## Development Workflow

-   **Feature Branches**: All new features and bug fixes should be developed in separate branches.
-   **Pull Requests**: All changes must go through a Pull Request review process.
-   **Squash and Merge**: We prefer to squash and merge commits when merging Pull Requests to maintain a clean git history.

## Reporting Bugs

If you find a bug, please open an issue on GitHub with a clear description and steps to reproduce.

## Feature Requests

For new feature ideas, please open an issue on GitHub to discuss your proposal.

---

**Author**: Manus AI
**Version**: 1.0.0
**Date**: August 2, 2026
