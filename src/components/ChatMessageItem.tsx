import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Bot, User, Copy, Check, Volume2, Square, AudioLines } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSpeak?: (text: string, messageId: string) => void;
  isSpeakingThisMessage?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSpeak,
  isSpeakingThisMessage = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isBot = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id={`message-${message.id}`}
      className={`group flex w-full gap-3 sm:gap-4 py-4 px-3 sm:px-4 rounded-xl transition-colors ${
        isBot
          ? isSpeakingThisMessage
            ? 'bg-emerald-50/50 border border-emerald-300/80 dark:bg-emerald-950/20 dark:border-emerald-800/60'
            : 'bg-zinc-50/70 border border-zinc-200/60 dark:bg-zinc-900/40 dark:border-zinc-800/60'
          : 'bg-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isBot ? (
          <div
            id={`avatar-${message.id}`}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-xs transition-colors ${
              isSpeakingThisMessage
                ? 'bg-emerald-600 dark:bg-emerald-500'
                : 'bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900'
            }`}
          >
            {isSpeakingThisMessage ? (
              <AudioLines className="h-4 w-4 animate-pulse" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        ) : (
          <div
            id={`avatar-${message.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <User className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {isBot ? 'Quantuma' : 'You'}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {formattedTime}
            </span>
            {isSpeakingThisMessage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Speaking
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Speaker Button for AI message */}
            {isBot && message.content && message.status !== 'streaming' && onSpeak && (
              <button
                id={`speak-btn-${message.id}`}
                type="button"
                onClick={() => onSpeak(message.content, message.id)}
                className={`p-1.5 rounded-md transition-colors text-xs flex items-center gap-1 ${
                  isSpeakingThisMessage
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
                title={isSpeakingThisMessage ? 'Stop voice playback' : "Read Quantuma's response aloud"}
                aria-label={isSpeakingThisMessage ? 'Stop voice playback' : "Read Quantuma's response aloud"}
              >
                {isSpeakingThisMessage ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current text-rose-600 dark:text-rose-400" />
                    <span className="text-[11px] font-medium hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Listen</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Button */}
            {message.content && (
              <button
                id={`copy-btn-${message.id}`}
                type="button"
                onClick={handleCopy}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {isBot ? (
            <div className="prose prose-zinc max-w-none text-sm dark:prose-invert break-words">
              {message.content ? (
                <>
                  <Markdown>{message.content}</Markdown>
                  {message.status === 'streaming' && (
                    <span className="inline-block h-3.5 w-1.5 ml-1 bg-zinc-900 dark:bg-zinc-100 animate-pulse align-middle" />
                  )}
                </>
              ) : message.status === 'streaming' ? (
                <div className="flex items-center gap-1.5 py-1 text-zinc-400 dark:text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse dark:bg-zinc-600" />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:200ms] dark:bg-zinc-600" />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:400ms] dark:bg-zinc-600" />
                  <span className="text-xs ml-1 font-medium text-zinc-400 dark:text-zinc-500">Quantuma is thinking...</span>
                </div>
              ) : (
                <span className="italic text-zinc-400">No response generated.</span>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
};
