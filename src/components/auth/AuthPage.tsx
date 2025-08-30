import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
// Use provided brand logo

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* subtle background accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-200 to-fuchsia-200 blur-3xl opacity-50 dark:from-blue-900/30 dark:to-fuchsia-900/30" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-sky-200 to-violet-200 blur-3xl opacity-50 dark:from-sky-900/30 dark:to-violet-900/30" />

      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white/90 dark:bg-white/10 flex items-center justify-center shadow-md ring-1 ring-black/5">
            <img src="https://mybudgetsandgoals.com/BudgetAndGoalsLogo.png" alt="My Budgets & Goals" className="h-8 w-auto" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-fuchsia-700 dark:from-blue-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            Personal Finance Manager
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Take control of your financial future</p>
        </div>

        {isLogin ? (
          <LoginForm onSwitchToSignUp={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
