import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessageItem';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatInput } from './components/ChatInput';
import { VoiceStatusBanner } from './components/VoiceStatusBanner';
import { useVoiceConversation } from './hooks/useVoiceConversation';
import { ChatMessage } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'quantuma_chat_history_v1';
const AUTO_SPEAK_STORAGE_KEY = 'quantuma_auto_speak_v1';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Sanitize any messages stuck in 'streaming' state from a previous session
          return parsed.map((m: ChatMessage) =>
            m.status === 'streaming'
              ? { ...m, status: m.content.trim() ? 'complete' : 'error' }
              : m
          );
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_SPEAK_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSpeakRef = useRef<boolean>(autoSpeak);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
    try {
      localStorage.setItem(AUTO_SPEAK_STORAGE_KEY, String(autoSpeak));
    } catch {
      // ignore
    }
  }, [autoSpeak]);

  // Voice conversation hook
  const {
    voiceState,
    selectedLanguage,
    setSelectedLanguage,
    errorMessage: voiceError,
    setErrorMessage: setVoiceError,
    activeSpeakingMessageId,
    detectedSpokenLanguage,
    stopListening,
    toggleListening,
    speakMessage,
    stopSpeaking,
  } = useVoiceConversation({
    onTranscriptReady: (transcript) => {
      // Place recognized text into the input field
      setInput(transcript);
    },
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota or local storage restriction
    }
  }, [messages]);

  // Smooth scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (textToSend?: string, customHistory?: ChatMessage[]) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isStreaming) return;

    // Stop speaking any ongoing audio
    stopSpeaking();
    stopListening();
    setError(null);
    setInput('');

    const baseHistory = customHistory !== undefined ? customHistory : messages;
    // Filter out empty or unfinished assistant placeholders
    const cleanHistory = baseHistory.filter(
      (m) => m.content.trim().length > 0 && m.status !== 'error'
    );

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      status: 'complete',
    };

    const assistantPlaceholderId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    };

    const updatedMessages = [...cleanHistory, userMessage];
    setMessages([...updatedMessages, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errText = 'Failed to generate response.';
        try {
          const errJson = await response.json();
          if (errJson?.error) errText = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errText);
      }

      if (!response.body) {
        throw new Error('No response body returned from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';
      let streamFinished = false;

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataPayload = trimmed.slice(5).trim();
          if (dataPayload === '[DONE]') {
            streamFinished = true;
            break;
          }

          let parsed: any;
          try {
            parsed = JSON.parse(dataPayload);
          } catch {
            continue;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.text) {
            accumulatedContent += parsed.text;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantPlaceholderId
                  ? { ...msg, content: accumulatedContent, status: 'streaming' }
                  : msg
              )
            );
          }
        }
      }

      const finalAssistantText =
        accumulatedContent ||
        "I am ready to help. Please ask your question!";

      // Mark message complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                ...msg,
                content: finalAssistantText,
                status: 'complete',
              }
            : msg
        )
      );

      // If auto-speak is enabled, speak Quantuma's answer aloud
      if (autoSpeakRef.current && finalAssistantText) {
        speakMessage(finalAssistantText, assistantPlaceholderId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User voluntarily stopped generation
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantPlaceholderId
              ? { ...msg, status: 'complete' }
              : msg
          )
        );
      } else {
        const msg = err?.message || 'Something went wrong while connecting to Quantuma.';
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "I apologize, but I encountered an error while processing your request. Please try again.",
                  status: 'error',
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    stopSpeaking();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleResetChat = () => {
    stopSpeaking();
    stopListening();
    if (isStreaming) {
      handleStop();
    }
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleRetryLast = () => {
    if (messages.length === 0 || isStreaming) return;
    // Find the last user message
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const lastUserMsg = messages[lastUserIdx];
      // Keep only history before that user message
      const historyBefore = messages.slice(0, lastUserIdx);
      handleSendMessage(lastUserMsg.content, historyBefore);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        onResetChat={handleResetChat}
        hasMessages={messages.length > 0}
        isStreaming={isStreaming}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
          {messages.length === 0 ? (
            <WelcomeScreen onSelectPrompt={(p) => handleSendMessage(p)} />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  onSpeak={speakMessage}
                  isSpeakingThisMessage={activeSpeakingMessageId === message.id}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}

          {error && (
            <div
              id="error-banner"
              className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={handleRetryLast}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-700 shadow-xs hover:bg-red-50 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Voice Status & Active Controls Banner */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <VoiceStatusBanner
          voiceState={voiceState}
          errorMessage={voiceError}
          onDismissError={() => setVoiceError(null)}
          onStopSpeaking={stopSpeaking}
          onStopListening={stopListening}
          detectedLanguage={detectedSpokenLanguage}
          selectedLanguage={selectedLanguage}
        />
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={() => handleSendMessage()}
        onStop={handleStop}
        isStreaming={isStreaming}
        voiceState={voiceState}
        onToggleVoice={toggleListening}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
      />
    </div>
  );
}
