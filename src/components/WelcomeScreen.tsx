import React from 'react';
import { Bot, MessageSquare, HelpCircle, Calendar, Sparkles, Languages, Mic } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  const examplePrompts = [
    {
      title: 'Who created you?',
      subtitle: 'Learn about Quantuma and its creator',
      icon: HelpCircle,
      prompt: 'Who created you and what is your purpose?',
    },
    {
      title: "Voice Conversation / بول کر پوچھیں",
      subtitle: 'Tap the mic or ask in Urdu, Hindi, Arabic, etc.',
      icon: Mic,
      prompt: 'Aap kon ho aur aapko kisne banaya hai?',
    },
    {
      title: "Today's Date & Overview",
      subtitle: 'Ask for the current date and context',
      icon: Calendar,
      prompt: "What is today's date?",
    },
    {
      title: 'Explain Simply',
      subtitle: 'Complex topic broken down without jargon',
      icon: Sparkles,
      prompt: 'Can you explain quantum computing simply, avoiding unnecessary jargon?',
    },
  ];

  return (
    <div id="quantuma-welcome-view" className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center max-w-2xl mx-auto">
      {/* Avatar / Badge */}
      <div
        id="quantuma-hero-badge"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-md ring-4 ring-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-900"
      >
        <Bot className="h-7 w-7" />
      </div>

      {/* Title & Creator */}
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        Meet Quantuma
      </h2>
      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        A helpful AI assistant created by <span className="font-semibold text-zinc-800 dark:text-zinc-200">Faiq</span>.
      </p>

      {/* Traits Pill Row */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1 font-medium text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          <Mic className="h-3 w-3" />
          Voice Conversation (Speak & Listen)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Languages className="h-3 w-3" />
          Auto-Detects Any Language
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium dark:border-zinc-800 dark:bg-zinc-900">
          Friendly & Direct
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium dark:border-zinc-800 dark:bg-zinc-900">
          Jargon-Free
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium dark:border-zinc-800 dark:bg-zinc-900">
          Concise & Honest
        </span>
      </div>

      {/* Prompt Grid */}
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 text-left">
        {examplePrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`starter-prompt-${idx}`}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex items-start gap-3 rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50/80 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <div className="mt-0.5 rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
