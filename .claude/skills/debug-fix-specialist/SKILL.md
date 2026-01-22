---
name: debug-fix-specialist
description: A specialized skill for systematically diagnosing and fixing bugs in code and applications, particularly effective when previous fix attempts have failed or the root cause is unclear.
when-to-use: Use when you encounter a bug that persists after initial fix attempts, when you need to understand the fundamental cause of an issue, or when a fix has unintended side effects on other functionality.
capabilities:
  - Deep analysis of bug reports to identify root causes rather than surface symptoms
  - Review and evaluation of previous fix attempts to understand why they failed
  - Systematic debugging approach using isolation, reproduction, and hypothesis testing
  - Generation of targeted fixes that address the core issue without breaking existing functionality
  - Impact analysis to predict and prevent side effects on related components
  - Security review of proposed fixes to ensure no new vulnerabilities are introduced
  - Testing strategy recommendations to validate fixes thoroughly
  - Identification of architectural or design-level issues that manifest as bugs
  - Clear documentation of the fix process for future reference and team knowledge sharing
  - Handling of race conditions, state management issues, and data consistency problems
  - Diagnostics for encryption, authentication, and provider setup flows
  - Analysis of state mutation bugs where one action unexpectedly affects another
---

# Debug Fix Specialist

## Overview

This skill provides a systematic, thorough approach to debugging and fixing bugs. It excels at handling complex issues where initial fixes failed or where the bug has cascading effects across the application.

## Guidelines

### 1. Initial Bug Analysis

When presented with a bug report:

1. **Deconstruct the symptom description** - Identify all observable behaviors mentioned
2. **Identify the expected behavior** - What should happen vs what is happening
3. **Map the affected components** - Which parts of the system are involved
4. **Check for previous fixes** - Review any attempted solutions and their outcomes

### 2. Root Cause Investigation

Follow this structured approach:

```
Step 1: Reproduce the issue mentally or via code review
Step 2: Trace the data flow from trigger to symptom
Step 3: Identify where expectations diverge from reality
Step 4: Formulate hypotheses about the root cause
Step 5: Test hypotheses against the evidence
```

### 3. Fix Development Principles

- **Fix the cause, not the symptom** - Address why the bug happens, not just what shows
- **Minimize changes** - The smallest fix that solves the problem
- **Preserve existing functionality** - Ensure no regressions
- **Consider the full lifecycle** - Initialization, updates, teardown, error states
- **Validate edge cases** - Empty inputs, nulls, boundaries, concurrent access

### 4. Fix Verification

Before presenting a fix, ensure:
- [ ] The fix directly addresses the identified root cause
- [ ] No existing tests would break (if tests exist)
- [ ] The fix doesn't introduce new side effects
- [ ] Security implications have been considered
- [ ] Error handling is appropriate
- [ ] The fix is maintainable and clear

## Examples

### Example 1: Encryption Settings State Mutation

**Bug Report:**
> "How does the encryption work? Now I go to settings, asks me for encryption password, but it deletes also the provider setup. How is the app functioning?"

**Analysis Process:**
1. **Symptoms**: Setting encryption password causes provider setup to be deleted
2. **Expected**: Provider setup should remain intact when configuring encryption
3. **Components involved**: Settings page, encryption flow, provider configuration, state management
4. **Root cause hypothesis**: The encryption state update is overwriting or clearing the entire settings object instead of merging

**Fix Approach:**
```javascript
// BAD - Overwrites entire settings state
function setEncryptionPassword(password) {
  this.settings = { encryptionPassword: password };
}

// GOOD - Merges encryption with existing settings
function setEncryptionPassword(password) {
  this.settings = { ...this.settings, encryptionPassword: password };
}
```

**Verification Questions:**
- Does the fix preserve provider setup? Yes
- Does encryption still work? Yes
- What if provider setup is empty? Still works correctly

---

### Example 2: Failed Initial Fix Scenario

**Bug Report:**
> "Clicking the save button on the profile form doesn't save changes. The previous fix added error logging but the data still doesn't persist."

**Analysis of Failed Fix:**
- Previous fix: Added `console.error()` calls
- Why it failed: It only added visibility, didn't address why saving fails
- New hypothesis: The save function may not be properly bound to the event handler, or the API endpoint returns success without persisting

**Systematic Debugging:**
```
1. Check event handler attachment
2. Verify save function is called with correct parameters
3. Inspect API response - does it return success?
4. Check if server-side persistence actually occurs
5. Verify state update after API response
```

**Comprehensive Fix:**
```javascript
// Event handler properly bound with async/await and full error handling
async function handleSave(e) {
  e.preventDefault();
  
  try {
    const formData = getFormData();
    const response = await api.saveProfile(formData);
    
    if (response.success) {
      updateLocalState(response.data);
      showSuccessMessage('Profile saved');
    } else {
      showErrorMessage(response.error || 'Save failed');
    }
  } catch (error) {
    console.error('Save error:', error);
    showErrorMessage('Unable to save profile. Please try again.');
    logErrorToService(error);
  }
}
```

---

### Example 3: Authentication Session Loss

**Bug Report:**
> "After I refresh the page, I'm logged out even though I checked 'Remember me'. The previous fix increased token expiration time but it still happens."

**Root Cause Investigation:**
1. Token expiration is set correctly ✓
2. Token is stored in localStorage ✓
3. **Issue discovered**: On page load, the auth check happens before localStorage is read, or the token validation logic has a mismatch

**Fix:**
```javascript
// Ensure auth state is properly initialized from storage
function initializeAuth() {
  const token = localStorage.getItem('authToken');
  const expiry = localStorage.getItem('tokenExpiry');
  
  if (token && expiry && Date.now() < parseInt(expiry)) {
    // Token is valid, set auth state
    setAuthState({ token, isAuthenticated: true });
  } else {
    // Clear invalid data
    clearAuthData();
  }
}

// Call this immediately on app initialization, before any auth-protected routes
```

## Failure Modes

| Situation | Response |
|-----------|----------|
| Insufficient bug information | Ask clarifying questions about reproduction steps, expected behavior, and environment details |
| Bug description contradicts itself | Highlight the contradictions and ask for clarification |
| Cannot reproduce mentally | Request code snippets, logs, or ask user to reproduce while providing observation guidance |
| Fix requires architectural changes | Propose both a quick workaround and a long-term solution with trade-offs |
| Multiple potential root causes | Present hypotheses in priority order with evidence for each |

## Security Considerations

When fixing bugs, always evaluate:

1. **Input validation** - Does the fix properly validate all inputs?
2. **Authorization checks** - Are permissions still enforced after the fix?
3. **Data exposure** - Does the fix inadvertently leak sensitive information?
4. **Injection vulnerabilities** - Are there new injection points in the fixed code?
5. **State corruption** - Could the fix allow invalid state that could be exploited?

## Success Criteria

A fix is successful when:
- ✓ The reported bug no longer occurs
- ✓ No previously working functionality is broken
- ✓ Related features continue to work as expected
- ✓ Edge cases are handled appropriately
- ✓ The fix is maintainable and documented
- ✓ Security posture is not degraded