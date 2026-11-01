import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, Check, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { DEMO_CREDENTIALS, validateDemoLogin } from '../utils/auth.js';
import { useApp } from '../context/AppContext.jsx';

export default function LoginPage() {
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const handleLogin = (e) => {
    e?.preventDefault();
    setError('');

    const result = validateDemoLogin(email, password);
    if (result.success) {
      dispatch({ type: 'LOGIN', payload: result.user });
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-sage-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-sage-500 items-center justify-center shadow-subtle mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <circle cx="12" cy="8" r="2" className="fill-gold-400" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Gatherly AI
        </h1>
        <p className="mt-1 text-sm text-charcoal-500 font-medium">
          Every detail, beautifully planned.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-ivory-200 sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-charcoal-900">Sign in to your planner</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Access your events, budget breakdowns, and timelines.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn"
            >
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                  <Mail size={16} aria-hidden="true" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@gatherly.app"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-ivory-300 placeholder-charcoal-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
                  <Lock size={16} aria-hidden="true" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-ivory-300 placeholder-charcoal-300 text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-subtle text-sm font-semibold text-white bg-sage-500 hover:bg-sage-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 active:bg-sage-700 transition-all duration-150 cursor-pointer"
            >
              Sign In to Planner
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          {/* Evaluator Demo Credentials Card */}
          <div className="mt-6 pt-5 border-t border-ivory-200">
            <div className="bg-gradient-to-br from-gold-50/80 to-ivory-100/70 rounded-xl p-4 border border-gold-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-gold-600" aria-hidden="true" />
                  <span className="text-xs font-bold text-gold-900 uppercase tracking-wider">
                    Demo Credentials
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs font-semibold text-sage-700 hover:text-sage-900 bg-white hover:bg-sage-50 px-2.5 py-1 rounded-md border border-sage-300 transition-colors shadow-2xs"
                >
                  Fill Demo Details
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-charcoal-700">
                <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-md border border-ivory-200 font-mono">
                  <span className="text-charcoal-500 text-[11px] font-sans">Email:</span>
                  <span className="font-semibold text-charcoal-800 select-all">{DEMO_CREDENTIALS.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(DEMO_CREDENTIALS.email, 'email')}
                    className="text-sage-600 hover:text-sage-800 text-[11px] font-sans"
                    title="Copy demo email"
                  >
                    {copiedField === 'email' ? <Check size={12} className="text-green-600" /> : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-md border border-ivory-200 font-mono">
                  <span className="text-charcoal-500 text-[11px] font-sans">Password:</span>
                  <span className="font-semibold text-charcoal-800 select-all">{DEMO_CREDENTIALS.password}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(DEMO_CREDENTIALS.password, 'password')}
                    className="text-sage-600 hover:text-sage-800 text-[11px] font-sans"
                    title="Copy demo password"
                  >
                    {copiedField === 'password' ? <Check size={12} className="text-green-600" /> : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-charcoal-500 flex items-start gap-1 leading-normal">
                <Info size={11} className="flex-shrink-0 mt-0.5 text-gold-600" aria-hidden="true" />
                <span>
                  Client-side demo authentication. Your local events and saved data remain preserved in this browser.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Security disclaimer footer */}
        <p className="text-center text-[11px] text-charcoal-400 mt-4">
          Gatherly AI Prototype · Evaluator Preview Mode · Client-side LocalStorage
        </p>
      </div>
    </div>
  );
}
