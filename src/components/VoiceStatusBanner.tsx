import React from 'react';
import { VoiceState } from '../hooks/useVoiceConversation';
import { Mic, Volume2, Square, Loader2, AlertCircle, X, Languages } from 'lucide-react';
import { DetectedLanguage } from '../utils/speechDetection';

interface VoiceStatusBannerProps {
  voiceState: VoiceState;
  errorMessage: string | null;
  onDismissError: () => void;
  onStopSpeaking: () => void;
  onStopListening: () => void;
  detectedLanguage: DetectedLanguage | null;
  selectedLanguage: string;
}

export const VoiceStatusBanner: React.FC<VoiceStatusBannerProps> = ({
  voiceState,
  errorMessage,
  onDismissError,
  onStopSpeaking,
  onStopListening,
  detectedLanguage,
}) => {
  if (errorMessage) {
    return (
      <div
        id="voice-error-banner"
        role="alert"
        className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs text-rose-800 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
        <button
          id="dismiss-voice-error-btn"
          type="button"
          onClick={onDismissError}
          aria-label="Dismiss error notification"
          className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/60"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (voiceState === 'stopped') {
    return null;
  }

  return (
    <div
      id="voice-active-banner"
      role="status"
      aria-live="polite"
      className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      {/* Listening State */}
      {voiceState === 'listening' && (
        <>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              <span>Listening... Speak naturally in any language</span>
            </div>
            {/* Live animated waveform bars */}
            <div className="hidden sm:flex items-center gap-0.5 ml-2">
              <span className="h-3 w-1 rounded-full bg-rose-500 animate-pulse" />
              <span className="h-5 w-1 rounded-full bg-rose-500 animate-pulse [animation-delay:150ms]" />
              <span className="h-4 w-1 rounded-full bg-rose-500 animate-pulse [animation-delay:300ms]" />
              <span className="h-6 w-1 rounded-full bg-rose-500 animate-pulse [animation-delay:100ms]" />
              <span className="h-3 w-1 rounded-full bg-rose-500 animate-pulse [animation-delay:250ms]" />
            </div>
          </div>

          <button
            id="stop-listening-btn"
            type="button"
            onClick={onStopListening}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Finish</span>
          </button>
        </>
      )}

      {/* Processing State */}
      {voiceState === 'processing' && (
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
          <span>Processing speech & detecting language...</span>
        </div>
      )}

      {/* Speaking State */}
      {voiceState === 'speaking' && (
        <>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span>Quantuma is speaking</span>
              {detectedLanguage && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Languages className="h-3 w-3 text-emerald-500" />
                  <span>{detectedLanguage.name}</span>
                </span>
              )}
            </div>

            {/* Speaking animated equalizer bars */}
            <div className="flex items-center gap-0.5 ml-2">
              <span className="h-2 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="h-4 w-1 rounded-full bg-emerald-500 animate-pulse [animation-delay:120ms]" />
              <span className="h-3 w-1 rounded-full bg-emerald-500 animate-pulse [animation-delay:240ms]" />
              <span className="h-5 w-1 rounded-full bg-emerald-500 animate-pulse [animation-delay:360ms]" />
              <span className="h-2 w-1 rounded-full bg-emerald-500 animate-pulse [animation-delay:80ms]" />
            </div>
          </div>

          <button
            id="stop-speaking-btn"
            type="button"
            onClick={onStopSpeaking}
            aria-label="Stop audio playback"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Square className="h-3 w-3 fill-current text-rose-500" />
            <span>Stop Audio</span>
          </button>
        </>
      )}
    </div>
  );
};
