import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Calendar, Target, BarChart3, CreditCard } from 'lucide-react';
import LogoMark from '@/components/LogoMark';
import { AuthService } from '@/services/AuthService';

const Feature: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl border bg-white/70 dark:bg-gray-900/70">
    <div className="shrink-0 mt-1 text-blue-600 dark:text-blue-400">{icon}</div>
    <div>
      <div className="font-semibold text-gray-900 dark:text-white">{title}</div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
    </div>
  </div>
);

const ScreenshotCard: React.FC<{ title: string; desc: string; src?: string }> = ({ title, desc, src }) => (
  <div className="rounded-2xl border bg-white/70 dark:bg-gray-900/70 p-5 shadow-sm">
    {src ? (
      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3] w-full object-cover rounded-lg border"
      />
    ) : (
      <div className="aspect-[4/3] rounded-lg bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-400 text-sm">
        {title} preview
      </div>
    )}
    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{desc}</p>
  </div>
);

const Marketing: React.FC = () => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      await AuthService.signInWithGoogle();
      // If popup works, auth state will set user; if popup fails, we redirect and auth state updates after redirect.
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      {/* background accents */}
      <div className="pointer-events-none absolute -top-40 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-blue-200 to-fuchsia-200 blur-3xl opacity-50 dark:from-blue-900/30 dark:to-fuchsia-900/30" />
      <div className="pointer-events-none absolute -bottom-40 left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-sky-200 to-violet-200 blur-3xl opacity-50 dark:from-sky-900/30 dark:to-violet-900/30" />

      <header className="relative z-10 mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/90 dark:bg-white/10 flex items-center justify-center shadow-sm ring-1 ring-black/5 overflow-hidden">
            <img src="https://mybudgetsandgoals.com/BudgetAndGoalsLogo.png" alt="My Budgets & Goals" className="h-6 w-auto" />
          </div>
          <span className="font-extrabold text-lg">My Budgets & Goals</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoogle}
            className="px-4 py-2 text-sm rounded-md border hover:bg-white dark:hover:bg-gray-900 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.5 18.9 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.1C29.2 35.6 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.3 5.4-6.1 6.7l.1.1 6.2 5.1c-.4.4 6.5-3.8 6.5-12.9 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>
          <Link to="/auth" className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        {/* Hero */}
        <section className="text-center pt-8 pb-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-fuchsia-700 dark:from-blue-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            All your money, clearly organized
          </h1>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Multi-currency budgets, fixed savings, bills, loans, goal tracking and reports — all in one place.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/auth" className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Create free account</Link>
            <button
              onClick={handleGoogle}
              className="px-5 py-2.5 rounded-md border hover:bg-white dark:hover:bg-gray-900 inline-flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.5 18.9 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.1C29.2 35.6 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.3 5.4-6.1 6.7l.1.1 6.2 5.1c-.4.4 6.5-3.8 6.5-12.9 0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </section>

        {/* Feature bullets */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon={<Wallet className="h-5 w-5" />} title="Multi-currency accounts" desc="Track balances across currencies with clear formatting and rollups." />
          <Feature icon={<Calendar className="h-5 w-5" />} title="Bills with FX" desc="Pay bills from any account; cross-currency payments record the rate." />
          <Feature icon={<CreditCard className="h-5 w-5" />} title="Loans & projections" desc="See progress, next due, and repayment projections." />
          <Feature icon={<LogoMark size={20} />} title="Fixed Savings" desc="Partner plans and fixed deposits with multi-period contributions." />
          <Feature icon={<Target className="h-5 w-5" />} title="Goal tracking" desc="Link an account or enter a manual saved amount — your call." />
          <Feature icon={<BarChart3 className="h-5 w-5" />} title="Reports" desc="Spending by category and cash flow at a glance." />
        </section>

        {/* Screenshots */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScreenshotCard
            title="Accounts"
            desc="See balances by currency and account type."
            src="https://mybudgetsandgoals.com/AccountsExample.png"
          />
          <ScreenshotCard
            title="Bills & Reminders"
            desc="Pay with conversion and keep schedules on track."
            src="https://mybudgetsandgoals.com/BillsInMultipleCurrencies.png"
          />
          <ScreenshotCard
            title="Fixed Savings"
            desc="Contribute multiple weeks at once with clear progress."
            src="https://mybudgetsandgoals.com/FixedSsavings.png"
          />
        </section>

        {/* Testimonials */}
        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border bg-white/70 dark:bg-gray-900/70">
            <p className="text-gray-700 dark:text-gray-300">“Finally, my partner plan and bills live together. I actually see progress now.”</p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">— A happy saver</div>
          </div>
          <div className="p-5 rounded-xl border bg-white/70 dark:bg-gray-900/70">
            <p className="text-gray-700 dark:text-gray-300">“Cross-currency payments just work. The rate is saved so I can audit later.”</p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">— Frequent traveler</div>
          </div>
        </section>

        <section className="text-center mt-12 flex items-center justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={handleGoogle}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border hover:bg-white dark:hover:bg-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.5 18.9 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.1 28.9 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.1C29.2 35.6 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.3 5.4-6.1 6.7l.1.1 6.2 5.1c-.4.4 6.5-3.8 6.5-12.9 0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>
        </section>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <span>•</span>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </footer>
      </main>
    </div>
  );
};

export default Marketing;
