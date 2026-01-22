---
name: tdd-workflow-enforcer
description: Enforces Test-Driven Development workflow using red-green-refactor cycle. Automatically detects project testing frameworks, prevents feature code implementation before failing tests exist, guides refactoring after green phase, and ensures test suite execution after code changes.
when-to-use: Use when developing new features, fixing bugs, or modifying existing code where test coverage is required. Essential for maintaining code quality and preventing regressions.
capabilities:
  - Enforce strict test-first development order (failing test must exist before implementation)
  - Auto-detect testing framework (Jest, Pytest, Vitest, RSpec, JUnit, etc.) from project configuration
  - Guide through complete red-green-refactor cycle with explicit phase transitions
  - Apply project-specific testing patterns (e.g., MSW for API mocking, FactoryBot for Rails fixtures)
  - Trigger full test suite execution after file changes or major edits
  - Generate test scaffolding aligned with framework conventions
  - Suggest refactoring opportunities once tests pass
  - Track test implementation state across sessions
---

# TDD Workflow Enforcer

## Purpose

Transform every development session into a disciplined Test-Driven Development workflow. This skill ensures you never write production code without a failing test first, following the red-green-refactor cycle rigorously.

## Core Principles

### 1. Red Phase - Write a Failing Test
- **ALWAYS** write the test before any implementation code
- Test must fail for the right reason (not syntax errors, but missing functionality)
- Use descriptive test names that specify behavior, not implementation
- Keep tests focused on a single behavior or assertion

### 2. Green Phase - Make It Pass
- Write the **minimum** code necessary to pass the failing test
- Do not optimize, refactor, or add extra features
- The goal is passing tests, not perfect code
- Run only the relevant test(s) until green

### 3. Refactor Phase - Improve Code
- Only refactor when all tests are green
- Improve code clarity, remove duplication, enhance design
- Run full test suite after each refactor to ensure no regressions
- Commit both tests and implementation together

## Framework Detection

Auto-detect and apply appropriate testing framework patterns:

| Framework | Language | File Pattern | Mock Pattern |
|-----------|----------|--------------|--------------|
| Jest/Vitest | TypeScript/JavaScript | `*.test.ts`, `*.spec.ts` | `jest.fn()`, `vi.fn()` |
| Pytest | Python | `test_*.py`, `*_test.py` | `unittest.mock`, `pytest-mock` |
| RSpec | Ruby | `*_spec.rb` | `instance_double`, `allow(...).to receive` |
| JUnit | Java | `*Test.java` | Mockito |
| go test | Go | `*_test.go` | testify/mock |

## Trigger Conditions

Invoke this skill when:
- Explicit trigger: `/tdd`
- Natural language: "test this feature", "TDD approach", "red-green-refactor"
- Beginning any new feature implementation
- Debugging failing tests
- Writing test files

## Workflow Enforcement Rules

### ⛔ Forbidden Actions
- Writing implementation code before a test exists
- Skipping the red phase (tests must fail first)
- Refactoring while tests are failing
- Committing implementation without tests
- Adding "just a little extra" during green phase

### ✅ Required Actions
- Verify test fails for correct reason before implementing
- Run full test suite after each file change
- Commit tests and implementation together
- Document test patterns for project consistency
- Update CLAUDE.md with project-specific test conventions

## Project-Specific Test Patterns

After detecting the project structure, apply these patterns:

### Frontend Applications
```
- Mock API responses with MSW (Mock Service Worker)
- Test component interactions with user-event library
- Mock React Router navigate in navigation tests
- Use Testing Library queries over implementation details
```

### Backend Applications
```
- Use factories/fixtures over raw test data creation
- Isolate database state between tests (transactions, rollbacks)
- Mock external service calls (APIs, message queues)
- Test error paths alongside happy paths
```

### Full-Stack Applications
```
- Integration tests at API boundaries
- Contract tests for service communication
- E2E tests for critical user journeys
- Shared test utilities across frontend/backend
```

## Example Sessions

### Example 1: New Feature (Jest/React)
```
User: "Add a user authentication feature"

TDD Enforcer:
🔴 RED PHASE: Let's write the failing test first.

I'll create `auth.test.tsx` with a test for user login:
```typescript
describe('User Authentication', () => {
  it('should authenticate user with valid credentials', async () => {
    // Test implementation - this will fail
  })
})
```

This test currently fails because:
- The auth service doesn't exist
- The login method isn't implemented

Shall I proceed to implement the minimum code to pass this test?
```

### Example 2: Bug Fix (Pytest/Python)
```
User: "Fix the calculation bug in the order total"

TDD Enforcer:
🔴 RED PHASE: Write a failing test that exposes the bug.

I'll add a test case to `test_orders.py`:
```python
def test_order_total_with_discount_applies_correctly():
    order = Order(items=[Item(price=100)], discount=0.1)
    assert order.total() == 90  # This will fail (currently returns 100)
```

Test is failing as expected - the bug is now documented.
Ready for green phase implementation?
```

### Example 3: Refactoring (after green)
```
TDD Enforcer:
✅ GREEN PHASE COMPLETE: All tests passing.

♻️ REFACTOR PHASE: Opportunities to improve code:

1. Duplicate logic in `calculateTotal()` and `calculateSubtotal()`
2. Magic number `0.1` for discount should be a named constant
3. Order class has too many responsibilities

I'll extract the calculation logic while running tests after each change.

Run full test suite after refactor? [y/n]
```

## CLAUDE.md Integration

Add this rule to your project's CLAUDE.md:

```markdown
## Testing Requirements

After every file change or major edit, run the full test suite:
- JavaScript/TypeScript: `npm test` or `pnpm test`
- Python: `pytest`
- Ruby: `bundle exec rspec`
- Go: `go test ./...`

Report any test failures immediately. Never proceed with new features while tests are failing.
```

## Success Criteria

- ✅ All new features have corresponding tests written before implementation
- ✅ Test suite passes after every code change
- ✅ Refactoring only occurs when tests are green
- ✅ Commits include both tests and implementation
- ✅ Project-specific testing patterns are documented and applied
- ✅ No regression bugs introduced in committed code

## Failure Modes & Recovery

| Symptom | Cause | Recovery |
|---------|-------|----------|
| Tests pass immediately (no red phase) | Test doesn't actually test new functionality | Review test assertions, ensure it tests the intended behavior |
| Can't make test fail | Test is incorrectly written or feature already exists | Verify test addresses new/changed requirements |
| Refactoring breaks tests | Insufficient test coverage | Add missing tests before continuing refactor |
| Test suite too slow | Running full suite too frequently | Use focused test runs during active development |

## Configuration

Customize behavior by setting these variables in your context:

```yaml
tdd:
  framework: "jest"  # Auto-detected if omitted
  test_command: "npm test"
  watch_mode: true
  coverage_threshold: 80
  require_commit_tests: true
```