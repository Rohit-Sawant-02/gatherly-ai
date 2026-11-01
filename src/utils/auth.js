/**
 * Demo Authentication Utilities for Gatherly AI.
 * 
 * SECURITY TRANSPARENCY NOTICE:
 * This is a frontend-only demo authentication module for hackathon evaluation
 * and prototype demonstration. It does NOT constitute production-grade server-side
 * authentication. No real passwords or sensitive credentials should be stored here.
 * Real deployments require secure backend authentication, HTTPS session cookies,
 * rate limiting, and server-side authorization.
 */

import { KEYS, getItem, setItem, removeItem } from './storage.js';

export const DEMO_CREDENTIALS = {
  email: 'demo@gatherly.app',
  password: 'Gatherly2026!',
  name: 'Demo Evaluator',
  role: 'Event Planner',
};

/**
 * Validate credentials against fixed demo credentials.
 * Does not allow arbitrary email/password combinations.
 */
export function validateDemoLogin(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!cleanPassword) {
    return { success: false, error: 'Password is required.' };
  }

  // Fixed credentials check
  if (
    cleanEmail === DEMO_CREDENTIALS.email.toLowerCase() &&
    cleanPassword === DEMO_CREDENTIALS.password
  ) {
    const user = {
      email: DEMO_CREDENTIALS.email,
      name: DEMO_CREDENTIALS.name,
      role: DEMO_CREDENTIALS.role,
      loggedInAt: new Date().toISOString(),
    };
    return { success: true, user };
  }

  return {
    success: false,
    error: 'Invalid demo credentials. Please use the demo email and password provided below.',
  };
}

/**
 * Retrieves the persisted demo session from localStorage without altering event data.
 */
export function getSavedSession() {
  return getItem(KEYS.AUTH_SESSION, null);
}

/**
 * Persists the demo session across refreshes.
 */
export function saveSession(user) {
  return setItem(KEYS.AUTH_SESSION, user);
}

/**
 * Clears demo session on logout.
 * CRITICAL: Leaves all user events, vendors, settings, and ideas completely intact.
 */
export function clearSession() {
  return removeItem(KEYS.AUTH_SESSION);
}
