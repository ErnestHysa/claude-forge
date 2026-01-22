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
