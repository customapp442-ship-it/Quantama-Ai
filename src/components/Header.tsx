import React from 'react';
import { RotateCcw, Calendar, Bot, Languages, Mic } from 'lucide-react';

interface HeaderProps {
  onResetChat: () => void;
  hasMessages: boolean;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onResetChat,
  hasMessages,
  isStreaming,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      id="quantuma-header"
      className="sticky top-0 z-20 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95"
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            id="quantuma-avatar-badge"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800/10 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Quantuma
              </h1>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-500/30">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Created by <span className="font-medium text-zinc-700 dark:text-zinc-300">Faiq</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <Mic className="h-3.5 w-3.5 text-rose-500" />
            <span>Voice & Audio</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <Languages className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Auto Language</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            <span>{currentDate}</span>
          </div>

          {hasMessages && (
            <button
              id="new-chat-button"
              onClick={onResetChat}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Start a new conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
