import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { KEYS, getItem, setItem, removeItem } from '../utils/storage.js';

const AppContext = createContext(null);

const initialUser = getItem(KEYS.AUTH_SESSION, null);

const initialState = {
  events: [],
  vendors: [],
  savedIdeas: [],
  settings: { demoLoaded: false },
  activeSection: 'dashboard',
  activeEventId: null,
  user: initialUser,
  isAuthenticated: Boolean(initialUser),
};

function reducer(state, action) {
  switch (action.type) {
    // ─ Auth ────────────────────────────────────────────────────────────────
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };

    // ─ Events ──────────────────────────────────────────────────────────────
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e),
      };
    case 'DELETE_EVENT': {
      const id = action.payload;
      return {
        ...state,
        events: state.events.filter(e => e.id !== id),
        vendors: state.vendors.filter(v => v.eventId !== id),
        activeEventId: state.activeEventId === id ? null : state.activeEventId,
      };
    }

    // ─ Vendors ─────────────────────────────────────────────────────────────
    case 'SET_VENDORS':
      return { ...state, vendors: action.payload };
    case 'ADD_VENDOR':
      return { ...state, vendors: [...state.vendors, action.payload] };
    case 'UPDATE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v),
      };
    case 'DELETE_VENDOR':
      return { ...state, vendors: state.vendors.filter(v => v.id !== action.payload) };

    // ─ Ideas ───────────────────────────────────────────────────────────────
    case 'SET_SAVED_IDEAS':
      return { ...state, savedIdeas: action.payload };
    case 'TOGGLE_IDEA': {
      const { ideaId, eventId } = action.payload;
      const key = `${ideaId}:${eventId}`;
      const exists = state.savedIdeas.includes(key);
      return {
        ...state,
        savedIdeas: exists ? state.savedIdeas.filter(k => k !== key) : [...state.savedIdeas, key],
      };
    }

    // ─ Navigation ──────────────────────────────────────────────────────────
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventId: action.payload };

    // ─ Settings ────────────────────────────────────────────────────────────
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // ─ Load all ────────────────────────────────────────────────────────────
    case 'LOAD_ALL':
      return { ...state, ...action.payload };

    // ─ Clear all ───────────────────────────────────────────────────────────
    case 'CLEAR_ALL':
      return {
        ...initialState,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedEvents = getItem(KEYS.EVENTS, []);
    const savedActiveId = getItem(KEYS.ACTIVE_EVENT_ID, null);
    const validActiveId = loadedEvents.some(e => e.id === savedActiveId)
      ? savedActiveId
      : (loadedEvents[0]?.id || null);
    const savedUser = getItem(KEYS.AUTH_SESSION, null);

    dispatch({
      type: 'LOAD_ALL',
      payload: {
        events: loadedEvents,
        vendors: getItem(KEYS.VENDORS, []),
        savedIdeas: getItem(KEYS.SAVED_IDEAS, []),
        settings: getItem(KEYS.SETTINGS, { demoLoaded: false }),
        activeEventId: validActiveId,
        user: savedUser,
        isAuthenticated: Boolean(savedUser),
      },
    });
  }, []);

  // Persist changes
  useEffect(() => { setItem(KEYS.EVENTS, state.events); }, [state.events]);
  useEffect(() => { setItem(KEYS.VENDORS, state.vendors); }, [state.vendors]);
  useEffect(() => { setItem(KEYS.SAVED_IDEAS, state.savedIdeas); }, [state.savedIdeas]);
  useEffect(() => { setItem(KEYS.SETTINGS, state.settings); }, [state.settings]);
  useEffect(() => { setItem(KEYS.ACTIVE_EVENT_ID, state.activeEventId); }, [state.activeEventId]);
  useEffect(() => {
    if (state.user) {
      setItem(KEYS.AUTH_SESSION, state.user);
    } else {
      removeItem(KEYS.AUTH_SESSION);
    }
  }, [state.user]);

  const navigate = useCallback((section, eventId = null) => {
    dispatch({ type: 'SET_SECTION', payload: section });
    if (eventId !== null) dispatch({ type: 'SET_ACTIVE_EVENT', payload: eventId });
  }, []);

  const logout = useCallback(() => {
    removeItem(KEYS.AUTH_SESSION);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const activeEvent = state.events.find(e => e.id === state.activeEventId) || null;

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, logout, activeEvent }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
