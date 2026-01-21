---
name: user-flow-validator
description: Analyzes project documentation and code to systematically identify, validate, and test user flows, detecting friction points and generating actionable test reports with recommendations.
when-to-use: Before feature launches, after UI/UX changes, during QA cycles, project onboarding, or post-refactoring of navigation systems
capabilities:
  - Parses project structure to extract user flow definitions from documentation, code, and design specs
  - Maps complete user journeys with all decision points, branches, and edge cases
  - Generates comprehensive test scenarios covering happy paths, error states, and boundary conditions
  - Simulates user behavior through flows to identify UX friction points
  - Validates accessibility compliance at each flow step
  - Identifies breaking changes in existing flows after code modifications
  - Generates structured test reports with severity ratings and prioritized recommendations
  - Supports responsive design validation across device breakpoints
  - Tracks flow completion rates and drop-off risk areas
  - Integrates with both frontend and backend routing logic analysis
---

# User Flow Validator Skill

## Purpose

Systematically validate that users can successfully complete intended paths through your application, identifying friction points, breaking changes, and accessibility barriers before they impact end users.

## Core Workflow

### 1. Flow Discovery
- Scan project documentation (READMEs, user stories, design specs)
- Analyze routing configuration and navigation components
- Identify entry points, success states, and exit conditions
- Map decision branches and conditional paths
- Extract user personas and their specific flow requirements

### 2. Test Scenario Generation
For each identified flow, create scenarios covering:
- **Happy Path**: Optimal user journey from start to completion
- **Error States**: Invalid inputs, network failures, permission errors
- **Edge Cases**: Empty states, maximum limits, special characters
- **Cross-Flow Transitions**: Moving between related workflows
- **Device/Viewport Variations**: Mobile, tablet, desktop breakpoints

### 3. Execution & Analysis
- Walk through each scenario step-by-step
- Verify UI elements are present and interactive
- Check loading states and user feedback mechanisms
- Validate error messages are clear and actionable
- Confirm success states and next-step guidance
- Test keyboard navigation and screen reader compatibility

### 4. Report Generation
- Document findings with severity levels (Critical, High, Medium, Low)
- Provide reproduction steps for each issue
- Suggest specific fixes with code examples where applicable
- Prioritize recommendations based on user impact
- Track regression risks for future changes

## Success Criteria

- [ ] All documented user flows have corresponding test coverage
- [ ] Happy paths complete without user confusion
- [ ] Error states provide clear recovery guidance
- [ ] No accessibility blockers in critical flows
- [ ] Mobile and desktop flows are equally functional
- [ ] Breaking changes are identified before deployment
- [ ] Stakeholders can understand and act on reported issues

## Failure Modes & Recovery

| Failure Mode | Detection | Recovery Strategy |
|--------------|-----------|-------------------|
| Incomplete flow documentation | Missing entry/exit points, ambiguous branches | Flag for stakeholder review, propose flow based on code analysis |
| Dynamic routes not captured | Route parameters, query strings ignored | Request route configuration or analyze router source code |
| External dependencies untested | API calls, third-party integrations skipped | Document assumptions, recommend integration testing |
| Accessibility tools unavailable | No screen reader emulation | Use semantic HTML analysis and WCAG checklist |

## Security Considerations

- Verify authentication requirements at protected flow entry points
- Check for sensitive data exposure in error messages
- Validate authorization checks at each flow decision point
- Ensure logout and session expiration behaviors are tested
- Test for unauthorized flow bypass attempts

## Examples

### Example 1: E-Commerce Checkout Flow

**Input:**
```markdown
Project: Online Store
Focus: Checkout process from cart to order confirmation
```

**Generated Test Plan:**
```markdown
## Flow: Checkout Process

### Happy Path Scenario
1. User navigates to /cart with items
2. Clicks "Proceed to Checkout" → redirects to /checkout/shipping
3. Fills required shipping fields (name, address, city, zip, country)
4. Clicks "Continue to Payment" → validates form, redirects to /checkout/payment
5. Enters valid payment details
6. Clicks "Place Order" → processes payment, redirects to /order/confirmation
7. Confirmation displays order ID and summary

### Error State Tests
- [ ] Submit shipping form with missing required fields → inline errors, button disabled
- [ ] Enter invalid zip code format → real-time validation message
- [ ] Payment declined → clear error message, retry option
- [ ] Network timeout during order placement → retry prompt, order not duplicated

### Accessibility Checks
- [ ] All form fields have associated labels
- [ ] Error announcements are screen reader compatible
- [ ] Focus management between checkout steps
- [ ] Keyboard navigation completes entire flow

### Critical Issues Found
- [CRITICAL] Payment form allows submission with expired card date
- [HIGH] No loading indicator during payment processing
- [MEDIUM] Back button from confirmation re-submits order
```

### Example 2: Multi-Step Onboarding Flow

**Input:**
```typescript
// Route configuration
const onboardingRoutes = [
  { path: '/onboarding/welcome', component: WelcomeStep },
  { path: '/onboarding/profile', component: ProfileSetup, requiresAuth: true },
  { path: '/onboarding/preferences', component: UserPreferences },
  { path: '/onboarding/complete', component: Completion, canSkip: true }
]
```

**Generated Flow Analysis:**
```markdown
## Flow: User Onboarding

### Flow Map
```
Start → /onboarding/welcome
        ↓ (Continue)
/onboarding/profile (requires auth)
        ↓ (Save & Continue)
/onboarding/preferences
        ↓ (Complete OR Skip)
/onboarding/complete → Dashboard
```

### Identified Issues
1. **[CRITICAL]** `/onboarding/profile` requires auth but user may not be authenticated when starting onboarding
   - **Impact**: Users redirected unexpectedly, incomplete onboarding
   - **Fix**: Add auth check at flow entry, redirect to login with return URL

2. **[HIGH]** No progress indicator showing number of steps
   - **Impact**: Users don't know expected completion time
   - **Fix**: Add progress bar (Step 1 of 4)

3. **[MEDIUM]** Skip option not visible on `/onboarding/preferences`
   - **Impact**: Users who want to skip may abandon flow
   - **Fix**: Add visible "Skip for now" button

4. **[LOW]** No way to return to previous step after advancing
   - **Impact**: Users must restart to correct mistakes
   - **Fix**: Add "Back" buttons to each step

### Regression Test Cases
After any onboarding changes, verify:
- Authenticated user starts at profile step
- Unauthenticated user redirected to auth first
- Progress persists across page refresh
- Skip functionality respects saved preferences
- Dashboard accessible after completion
```

### Example 3: Detecting Breaking Changes

**Before Change:**
```
Login Flow: /login → (success) → /dashboard
```

**After Refactor:**
```
Login Flow: /login → (success) → /home
```

**Regression Report:**
```markdown
## Breaking Change Detected

### Changed Flow: Post-Login Redirect

**Previous Behavior:**
```
/login → successful auth → /dashboard
```

**Current Behavior:**
```
/login → successful auth → /home
```

### Impact Assessment
- **Severity**: HIGH
- **Affected Users**: All existing users with bookmarked /dashboard
- **Risk**: User confusion, potential 404 errors if /dashboard removed

### Recommendations
1. Set up redirect from /dashboard → /home
2. Update all documentation references
3. Consider dual-support period before removing /dashboard
4. Add analytics to track /dashboard access patterns

### Test Coverage Needed
- [ ] Direct access to /dashboard redirects correctly
- [ ] Login redirects to new destination
- [ ] Deep links to /dashboard sub-routes preserved
- [ ] Browser back button behavior maintained
```

## Best Practices

1. **Start Early**: Test flows during design, not just before launch
2. **Think Like Users**: Consider technical literacy, device limitations, patience levels
3. **Test Real Scenarios**: Use actual data, not lorem ipsum
4. **Document Assumptions**: Clearly state what you're testing vs. what's out of scope
5. **Collaborate**: Share findings with designers, PMs, and developers
6. **Iterate**: Update test plans as flows evolve
7. **Automate**: Convert critical happy paths to automated tests where possible