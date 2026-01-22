---
name: ci-cd-pipeline-generator
description: A systematic skill for generating validated, project-accurate CI/CD pipeline workflows that pass all tests by analyzing actual project structure, dependencies, and existing configurations before outputting working GitHub Actions or other CI/CD manifests.
when-to-use: When creating new CI/CD pipelines, fixing broken workflows, or setting up automated testing/deployment for any project.
capabilities:
  - Analyze project structure to determine language, framework, and build system
  - Read existing configuration files (package.json, requirements.txt, Cargo.toml, etc.)
  - Examine test frameworks and testing commands
  - Generate platform-specific workflows (GitHub Actions, GitLab CI, CircleCI, etc.)
  - Include proper caching, parallelization, and dependency management
  - Add environment-specific configurations (dev, staging, prod)
  - Validate output against project requirements
  - Generate deployment manifests with proper secrets handling
  - Include rollback strategies and error handling
---

# CI/CD Pipeline Generator

## Purpose

Generate production-ready, validated CI/CD workflows by systematically analyzing the actual project context rather than making assumptions. This skill ensures 100% accuracy by reading real project files, understanding dependencies, and following framework-specific best practices.

## Guidelines

### Phase 1: Project Analysis

**ALWAYS** perform these checks before generating any workflow:

1. **Detect Project Type**
   - Scan for `package.json` (Node.js/TypeScript)
   - Check for `requirements.txt`, `pyproject.toml`, `setup.py` (Python)
   - Look for `go.mod` (Go), `Cargo.toml` (Rust), `pom.xml` (Java/Maven)
   - Check for `Gemfile` (Ruby), `composer.json` (PHP)
   - Examine `build.gradle` or `gradle.properties` (Gradle)

2. **Identify Build Tools**
   - npm, yarn, pnpm, bun (Node.js)
   - pip, poetry, pipenv (Python)
   - make, cmake, bazel (C/C++)
   - gradle, maven (Java)

3. **Determine Test Frameworks**
   - Look for test scripts in `package.json`
   - Check for `pytest.ini`, `tox.ini` (Python)
   - Examine `*_test.go` files (Go)
   - Look for JUnit configuration (Java)

4. **Read Existing Workflows**
   - Check `.github/workflows/` for existing GitHub Actions
   - Examine `.gitlab-ci.yml` for GitLab CI
   - Review `.circleci/` for CircleCI config

### Phase 2: Workflow Generation

**Core Requirements for Every Workflow:**

```yaml
# Template Structure
name: <descriptive-name>
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  <job-name>:
    runs-on: <appropriate-runner>
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        # Always use @v4 or latest stable version
```

**Essential Components:**

1. **Checkout with full history** (needed for some tools)
   ```yaml
   - uses: actions/checkout@v4
     with:
       fetch-depth: 0  # For tools that need git history
   ```

2. **Language-specific setup**
   - Use official actions: `actions/setup-node@v4`, `actions/setup-python@v5`, etc.
   - Pin exact versions from project files
   - Enable caching for dependencies

3. **Dependency caching**
   ```yaml
   - name: Cache dependencies
     uses: actions/cache@v4
     with:
       path: |
         ~/.npm
         node_modules
       key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
       restore-keys: |
         ${{ runner.os }}-deps-
   ```

4. **Install dependencies**
   - Use exact commands from project scripts
   - Include lock file validation
   - Handle private registry authentication if needed

5. **Linting** (before tests)
   - Run configured linters
   - Fail build on lint errors
   - Format checking

6. **Testing**
   - Run all test suites
   - Generate coverage reports
   - Upload test artifacts
   - Parallelize test jobs for large suites

7. **Build** (if applicable)
   - Compile code
   - Generate artifacts
   - Build Docker images (if containerized)

### Phase 3: Validation

**Before presenting the workflow, verify:**

- [ ] All referenced files actually exist in the project
- [ ] All environment variables are documented or referenced
- [ ] Secrets are properly referenced (not hardcoded)
- [ ] Node.js/Python/etc. version matches project requirements
- [ ] Test commands match actual test scripts
- [ ] Build commands are appropriate for the project type
- [ ] Matrix jobs are properly configured
- [ ] Conditional logic uses correct syntax

### Phase 4: Deployment

**Production Deployment Checklist:**

1. **Environment Separation**
   - Separate workflows or jobs for staging/production
   - Environment-specific secrets
   - Approval gates for production

2. **Secrets Management**
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
   # Never hardcode secrets
   ```

3. **Deployment Strategies**
   - Blue-green deployment
   - Rolling updates
   - Canary releases (configure based on needs)

4. **Rollback Capability**
   - Keep previous version artifacts
   - Document rollback procedure
   - Include rollback job if applicable

## Examples

### Node.js/TypeScript Project

```yaml
name: Node.js CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### Python Project

```yaml
name: Python CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff flake8 mypy
      
      - name: Run ruff
        run: ruff check .
      
      - name: Run mypy
        run: mypy .

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"
      
      - name: Run pytest
        run: pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

### Go Project

```yaml
name: Go CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: ['1.21', '1.22']
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ matrix.go-version }}
          cache: true
      
      - name: Download dependencies
        run: go mod download
      
      - name: Run go vet
        run: go vet ./...
      
      - name: Run go fmt check
        run: |
          if [ -n "$(gofmt -l .)" ]; then
            echo "Go code is not formatted:"
            gofmt -d .
            exit 1
          fi
      
      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.out

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true
      
      - name: Build
        run: go build -v -o app ./cmd/server
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-binary
          path: app
```

## Security Considerations

1. **Never hardcode secrets** - Always use `${{ secrets.SECRET_NAME }}`
2. **Use `@v4` or later** for all official GitHub Actions
3. **Pin third-party actions** to commit SHAs or explicit tags
4. **Validate environment variables** before use
5. **Use least-privilege tokens** - `permissions:` block
   ```yaml
   permissions:
     contents: read
     pull-requests: write
   ```
6. **Scan dependencies** for vulnerabilities (e.g., `npm audit`, `pip-audit`)
7. **Sign commits and artifacts** where appropriate

## Edge Cases and Failure Modes

### Common Pitfalls to Avoid

| Issue | Detection | Solution |
|-------|-----------|----------|
| Wrong Node.js version | Check `.nvmrc` or `engines` in package.json | Use exact version from file |
| Missing test command | Check `scripts` in package.json | Verify command exists before including |
| Wrong cache key | Compare paths with actual lock files | Use correct file path in `hashFiles()` |
| Timeout on large installs | Check dependency size | Increase timeout, use caching |
| Private registry auth | Check `.npmrc`, `pip.conf` | Add secret-based authentication |
| Docker daemon not available | Docker-based steps fail | Use `runs-on: ubuntu-latest` with `docker://` actions |

### Failure Recovery

1. **Partial success** - Allow critical jobs to continue while logging warnings
2. **Retry logic** - Use `continue-on-error` for flaky external services
3. **Artifact retention** - Keep logs and artifacts for debugging
   ```yaml
   - name: Upload logs on failure
     if: failure()
     uses: actions/upload-artifact@v4
     with:
       name: logs
       path: logs/
   ```

## Success Criteria

A workflow is considered successful when:

- ✅ All referenced files exist in the project
- ✅ All commands execute successfully in the specified environment
- ✅ Tests pass across all matrix configurations
- ✅ Artifacts are generated and uploaded correctly
- ✅ Secrets are properly referenced (never exposed)
- ✅ Caching is configured and working
- ✅ Workflow completes within GitHub Actions limits
- ✅ Deployment jobs only trigger on appropriate branches/events

## When NOT to Use This Skill

- For simple shell scripts (use standard scripting instead)
- When project structure is unknown (always analyze first)
- For monorepos without understanding workspace structure
- When custom runners are required without documentation