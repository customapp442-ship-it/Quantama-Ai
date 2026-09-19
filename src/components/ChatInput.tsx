import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square, Mic, MicOff, Loader2, Volume2, VolumeX, Globe } from 'lucide-react';
import { VoiceState, SUPPORTED_VOICE_LANGUAGES } from '../hooks/useVoiceConversation';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  isStreaming: boolean;
  voiceState: VoiceState;
  onToggleVoice: () => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  onStop,
  isStreaming,
  voiceState,
  onToggleVoice,
  selectedLanguage,
  onSelectLanguage,
  autoSpeak,
  onToggleAutoSpeak,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    // Automatically focus the input textarea on mount and after streaming completes
    if (!isStreaming && voiceState !== 'listening') {
      textareaRef.current?.focus();
    }
  }, [isStreaming, voiceState]);

  // Close language menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSubmit();
      }
    }
  };

  const currentLangObj = SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_VOICE_LANGUAGES[0];

  return (
    <div className="sticky bottom-0 z-10 w-full bg-linear-to-t from-white via-white/95 to-transparent pt-3 pb-3 sm:pb-4 dark:from-zinc-950 dark:via-zinc-950/95">
      <div className="mx-auto max-w-4xl px-3 sm:px-6">
        <form
          id="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isStreaming) {
              onSubmit(e);
            }
          }}
          className={`relative flex items-end rounded-2xl border bg-white p-2 shadow-sm transition-all focus-within:ring-2 dark:bg-zinc-900 ${
            voiceState === 'listening'
              ? 'border-rose-400 ring-2 ring-rose-400/20 dark:border-rose-600'
              : 'border-zinc-200 focus-within:border-zinc-400 focus-within:ring-zinc-900/10 dark:border-zinc-800 dark:focus-within:border-zinc-600 dark:focus-within:ring-zinc-100/10'
          }`}
        >
          {/* Language Selector Popover Trigger */}
          <div className="relative shrink-0 pb-0.5" ref={languageMenuRef}>
            <button
              id="voice-language-selector-btn"
              type="button"
              onClick={() => setShowLanguageMenu((prev) => !prev)}
              title="Voice language (auto-detects by default)"
              aria-label="Select voice language"
              className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="hidden md:inline max-w-[80px] truncate">{currentLangObj.name}</span>
            </button>

            {/* Language Selection Dropdown Menu */}
            {showLanguageMenu && (
              <div
                id="voice-language-dropdown"
                className="absolute bottom-10 left-0 z-50 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Spoken Language
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onSelectLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                        selectedLanguage === lang.code
                          ? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                          : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {lang.nativeName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Area */}
          <textarea
            id="chat-textarea"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              voiceState === 'listening'
                ? 'Listening to you... speak naturally'
                : 'Ask Quantuma anything or click the microphone to speak...'
            }
            disabled={isStreaming}
            className="w-full resize-none border-0 bg-transparent px-2.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none disabled:opacity-60 dark:text-zinc-100 dark:placeholder-zinc-500 max-h-[180px]"
          />

          {/* Action buttons (Auto-speak, Microphone, Send/Stop) */}
          <div className="flex shrink-0 items-center gap-1.5 pb-0.5 pr-1">
            {/* Auto-read speech reply toggle */}
            <button
              id="toggle-auto-speak-btn"
              type="button"
              onClick={onToggleAutoSpeak}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                autoSpeak
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
              }`}
              title={autoSpeak ? 'Auto-speak replies: ON' : 'Auto-speak replies: OFF'}
              aria-label={autoSpeak ? 'Turn off auto-speaking replies' : 'Turn on auto-speaking replies'}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Microphone Button */}
            <button
              id="voice-mic-button"
              type="button"
              onClick={onToggleVoice}
              disabled={isStreaming}
              aria-label={voiceState === 'listening' ? 'Finish speaking' : 'Speak with Quantuma'}
              title={voiceState === 'listening' ? 'Finish speaking (Click to stop)' : 'Speak with Quantuma (Microphone)'}
              className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
                voiceState === 'listening'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/50 hover:bg-rose-700 animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`}
            >
              {voiceState === 'listening' ? (
                <MicOff className="h-4 w-4" />
              ) : voiceState === 'processing' ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-600 dark:text-zinc-300" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Send or Stop Generation Button */}
            {isStreaming ? (
              <button
                type="button"
                id="stop-generation-button"
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                title="Stop generating"
                aria-label="Stop generating response"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                id="send-message-button"
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:hover:bg-zinc-100"
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Voice and creator helper footer */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span>
            {voiceState === 'listening' ? (
              <span className="font-medium text-rose-600 dark:text-rose-400">
                ● Listening now — speak naturally in {currentLangObj.name}
              </span>
            ) : autoSpeak ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                🔊 Voice mode active (Auto-reading responses)
              </span>
            ) : (
              <span>🎤 Tap microphone to speak in any language</span>
            )}
          </span>
          <span>Quantuma by Faiq</span>
        </div>
      </div>
    </div>
  );
};
