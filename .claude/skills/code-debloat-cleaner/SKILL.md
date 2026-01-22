---
name: code-debloat-cleaner
description: A comprehensive code cleanup skill that removes unused code, comments, duplicates, imports, and bloat while preserving functionality and code logic.
when-to-use: When refactoring legacy code, preparing for production deployment, reducing bundle size, or simplifying overly complex codebases with accumulated technical debt.
capabilities:
  - Remove all comments (single-line, multi-line, documentation comments)
  - Identify and eliminate unused imports and dependencies
  - Detect and remove unused functions, methods, and variables
  - Find and consolidate duplicate functions or code blocks
  - Strip out dead code and unreachable branches
  - Remove empty or redundant blocks
  - Clean up unused type definitions and interfaces
  - Optimize code structure without changing behavior
  - Maintain code semantics and functional correctness
  - Support multiple programming languages (JavaScript, TypeScript, Python, Java, etc.)
guidelines:
  - Always preserve the core functionality and business logic
  - Run static analysis to identify truly unused code before removal
  - Check for side effects before removing functions
  - Be cautious with dynamically accessed properties or methods
  - Verify that removed code isn't used in tests or other files
  - Maintain code readability after cleanup
  - Consider the project's build system and dependency requirements
  - Remove comments unless they contain critical licensing information
  - Consolidate duplicates by keeping the most optimal version
  - Validate the cleanup by running existing tests
  - Provide a summary of changes made
examples:
  - |
    ## Before (JavaScript)
    ```javascript
    // This is a utility function
    import { useState, useEffect } from 'react';
    import { unusedHelper } from './utils';
    import { lodash } from 'lodash';
    
    /**
     * Calculate the sum of two numbers
     * @param {number} a 
     * @param {number} b 
     */
    function add(a, b) {
      return a + b;
    }
    
    // Duplicate function
    function addNumbers(x, y) {
      return x + y;
    }
    
    function multiply(a, b) {
      return a * b;
    }
    
    // Unused function
    function unusedFunc() {
      console.log('never called');
    }
    
    const result = add(5, 3);
    console.log(result);
    ```
    
    ## After (Cleaned)
    ```javascript
    function add(a, b) {
      return a + b;
    }
    
    function multiply(a, b) {
      return a * b;
    }
    
    console.log(add(5, 3));
    ```

  - |
    ## Before (Python)
    ```python
    # Import statements
    import os
    import sys
    import json  # unused
    from datetime import datetime
    
    # Helper function
    def process_data(items):
        """Process a list of items"""
        result = []
        for item in items:
            # Transform the item
            transformed = item.upper()
            result.append(transformed)
        return result
    
    # Duplicate function
    def process_items(items):
        result = []
        for item in items:
            result.append(item.upper())
        return result
    
    # Unused function
    def legacy_handler():
        pass
    
    data = ['hello', 'world']
    processed = process_data(data)
    print(processed)
    ```
    
    ## After (Cleaned)
    ```python
    from datetime import datetime
    
    def process_data(items):
        result = []
        for item in items:
            result.append(item.upper())
        return result
    
    print(process_data(['hello', 'world']))
    ```

  - |
    ## Before (TypeScript)
    ```typescript
    // Type definitions
    interface User {
      id: number;
      name: string;
      email: string;
    }
    
    interface UnusedType {
      value: string;
    }
    
    // Unused type
    type Status = 'active' | 'inactive';
    
    /**
     * Fetch user data
     */
    async function fetchUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    // Duplicate implementation
    async function getUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    // Unused function
    function logUser(user: User): void {
      console.log(user);
    }
    
    const user = await fetchUser(1);
    console.log(user.name);
    ```
    
    ## After (Cleaned)
    ```typescript
    interface User {
      id: number;
      name: string;
      email: string;
    }
    
    async function fetchUser(id: number): Promise<User> {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
    
    console.log((await fetchUser(1)).name);
    ```

success-criteria:
  - All unused imports are removed
  - All unused functions, variables, and types are eliminated
  - All comments are stripped (except critical licenses)
  - Duplicate code is consolidated
  - Code still compiles/runs without errors
  - All existing tests pass
  - Bundle size or file count is reduced
  - Code functionality remains identical

failure-modes:
  - Removing code that's used via dynamic access or reflection
  - Removing imports used only in type declarations
  - Eliminating code that affects global state
  - Removing functions referenced in configuration files
  - Stripping comments required for legal compliance
  - Consolidating duplicates that have subtle semantic differences
  - Breaking circular dependencies by removing imports incorrectly
  - Removing code used in tests but not in the main codebase

security-considerations:
  - Never remove code related to authentication, authorization, or security checks
  - Preserve error handling and validation logic
  - Be cautious with code that sanitizes input or prevents injection attacks
  - Maintain logging and auditing capabilities where required
  - Ensure removed code doesn't expose security vulnerabilities
---