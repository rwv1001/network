# Network - Identity Manager

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Project Overview
Network is an identity manager application. The repository is currently in early development stage with minimal infrastructure. This project will likely evolve into a web-based identity management system.

## Working Effectively

### Repository Status
- **CURRENT STATE**: Repository contains only README.md - no source code or build system exists yet
- **PROJECT TYPE**: Identity Manager (web application expected)
- **TECHNOLOGY STACK**: Not yet determined - will need to be established based on requirements

### Initial Development Setup
When starting work on this repository:

1. **Verify repository state**:
   ```bash
   ls -la
   cat README.md
   ```
   - Expected: Only README.md file present
   - Current content: "# network\nIdentity manager"

2. **Check for any new files or changes**:
   ```bash
   git status
   git log --oneline
   ```

### Development Environment Prerequisites
Since this is an identity manager, prepare for common technology stacks:

1. **Node.js/TypeScript Web Application**:
   ```bash
   # Install Node.js if needed
   node --version || echo "Node.js not installed"
   npm --version || echo "npm not installed"
   ```

2. **Python Web Application**:
   ```bash
   # Check Python availability
   python3 --version || echo "Python3 not installed"
   pip3 --version || echo "pip3 not installed"
   ```

3. **Database Tools** (common for identity management):
   ```bash
   # Check for database tools
   which psql || echo "PostgreSQL client not available"
   which mysql || echo "MySQL client not available"
   which sqlite3 || echo "SQLite not available"
   ```

### When Source Code is Added

#### For Node.js/JavaScript Projects
If package.json is added:
```bash
# Install dependencies
npm install
# Expected time: 2-5 minutes, NEVER CANCEL
# Set timeout to 10+ minutes

# Build (if build script exists)
npm run build
# Expected time: varies, NEVER CANCEL builds
# Set timeout to 60+ minutes for safety

# Run tests (if test script exists)
npm test
# Expected time: varies, NEVER CANCEL tests
# Set timeout to 30+ minutes for safety

# Start development server (if dev script exists)
npm run dev
# Usually starts immediately, runs continuously
```

#### For Python Projects
If requirements.txt or pyproject.toml is added:
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# Expected time: 2-10 minutes, NEVER CANCEL
# Set timeout to 15+ minutes

# Run tests (if applicable)
python -m pytest
# Expected time: varies, NEVER CANCEL tests
# Set timeout to 30+ minutes for safety

# Run application (if main module exists)
python app.py  # or python -m main
```

#### For Docker-based Projects
If Dockerfile is added:
```bash
# Build Docker image
docker build -t network-identity-manager .
# Expected time: 5-30 minutes, NEVER CANCEL
# Set timeout to 45+ minutes

# Run container
docker run -p 8080:8080 network-identity-manager
```

## Validation Requirements

### Manual Testing Scenarios
When the application becomes functional, always test these scenarios:

1. **Basic Application Start**:
   - Verify the application starts without errors
   - Check that required ports are accessible
   - Validate basic health endpoints (if implemented)

2. **Identity Management Core Functions** (when implemented):
   - User registration flow
   - User login/authentication
   - Password reset functionality
   - User profile management
   - Session management

3. **Security Testing** (critical for identity managers):
   - Verify HTTPS is enforced in production
   - Test password strength requirements
   - Validate session timeout behavior
   - Check for proper input sanitization

### Build and Test Timing Expectations
- **CRITICAL**: NEVER CANCEL builds or tests regardless of time
- **Initial setup**: 5-15 minutes for dependency installation
- **Build time**: Unknown until build system is implemented (expect 5-45 minutes)
- **Test suite**: Unknown until tests are implemented (expect 5-30 minutes)
- **Always use timeouts of 60+ minutes for builds and 30+ minutes for tests**

## Code Quality and CI/CD

### Pre-commit Validation
Always run these commands before committing (when applicable):
```bash
# Linting (adjust command based on technology)
npm run lint          # for Node.js
flake8 .             # for Python
eslint .             # for JavaScript/TypeScript

# Code formatting (adjust command based on technology)
npm run format       # for Node.js with prettier
black .              # for Python
prettier --write .   # for JavaScript/TypeScript

# Type checking (when applicable)
npm run type-check   # for TypeScript
mypy .               # for Python with type hints
```

### CI Pipeline (when implemented)
Monitor for these common CI workflow files:
- `.github/workflows/ci.yml` or `.github/workflows/build.yml`
- `.github/workflows/test.yml`
- `.travis.yml`, `.circleci/config.yml`, or similar

## Common Tasks

### Repository Structure (Current)
```
.
├── README.md                    # Project description
└── .github/
    └── copilot-instructions.md  # This file
```

### Expected Future Structure
```
.
├── README.md
├── package.json                 # Node.js dependencies (if Node.js)
├── requirements.txt             # Python dependencies (if Python)
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # Multi-service setup
├── src/                         # Source code
├── tests/                       # Test files
├── docs/                        # Documentation
├── config/                      # Configuration files
└── .github/
    ├── workflows/               # CI/CD pipelines
    └── copilot-instructions.md
```

## Security Considerations
Since this is an identity manager:

1. **NEVER commit secrets or credentials**
2. **Always use environment variables for sensitive configuration**
3. **Validate all input thoroughly**
4. **Use secure authentication libraries, don't implement crypto from scratch**
5. **Follow OWASP guidelines for identity management**
6. **Implement proper logging without exposing sensitive data**

## Development Workflow
1. Always check git status before starting work
2. Pull latest changes: `git pull origin main`
3. Create feature branch: `git checkout -b feature/your-feature-name`
4. Make minimal, focused changes
5. Test thoroughly using validation scenarios above
6. Run all quality checks (lint, format, type-check)
7. Commit with descriptive messages
8. Push and create pull request

## Troubleshooting

### Common Issues
- **"Command not found"**: Install required runtime/tools first
- **"Permission denied"**: Check file permissions, may need `chmod +x script.sh`
- **"Port already in use"**: Stop conflicting services or use different port
- **"Build timeout"**: Increase timeout, builds can take 45+ minutes

### Getting Help
- Check README.md for project-specific instructions
- Look for CONTRIBUTING.md (when added)
- Search for TODO, FIXME, or HACK comments in code
- Review issue tracker and pull requests for known problems

## Important Notes
- **This repository is in early development** - expect significant changes
- **Always validate commands** mentioned in these instructions still work
- **Update these instructions** when new build systems or workflows are added
- **Focus on security** since this is an identity management system
- **Document timing** for any new build or test commands you add