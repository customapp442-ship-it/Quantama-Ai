import { useState, useEffect, useRef, useCallback } from 'react';
import { detectLanguage, cleanMarkdownForSpeech, getBestVoiceForLanguage, DetectedLanguage } from '../utils/speechDetection';

export type VoiceState = 'stopped' | 'listening' | 'processing' | 'speaking';

export interface VoiceLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'خودکار تشخیص', flag: '🌐' },
  { code: 'en-US', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

export interface UseVoiceConversationProps {
  onTranscriptReady: (transcript: string, autoSend?: boolean) => void;
  autoSpeakResponses?: boolean;
}

export function useVoiceConversation({
  onTranscriptReady,
  autoSpeakResponses = false,
}: UseVoiceConversationProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('stopped');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSpeakingMessageId, setActiveSpeakingMessageId] = useState<string | null>(null);
  const [detectedSpokenLanguage, setDetectedSpokenLanguage] = useState<DetectedLanguage | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs for tracking active objects
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isSpeechRecognitionActiveRef = useRef<boolean>(false);
  const speechSynthesisUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Initialize SpeechSynthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop active speech playback
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechSynthesisUtterancesRef.current = [];
    setActiveSpeakingMessageId(null);
    setVoiceState((prev) => (prev === 'speaking' ? 'stopped' : prev));
  }, []);

  // Speak a message aloud
  const speakMessage = useCallback(
    (text: string, messageId: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setErrorMessage('Speech playback is not supported on this device/browser.');
        return;
      }

      // If already speaking this message, toggle off
      if (activeSpeakingMessageId === messageId && voiceState === 'speaking') {
        stopSpeaking();
        return;
      }

      stopSpeaking();

      const cleanedText = cleanMarkdownForSpeech(text);
      if (!cleanedText) return;

      const detected = detectLanguage(cleanedText);
      setDetectedSpokenLanguage(detected);

      // Split into sensible sentence chunks to avoid browser utterance limits
      const sentences = cleanedText
        .split(/(?<=[.?!۔।\n])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (sentences.length === 0) return;

      setVoiceState('speaking');
      setActiveSpeakingMessageId(messageId);

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = getBestVoiceForLanguage(voices, detected.code);

      const utterances: SpeechSynthesisUtterance[] = [];

      sentences.forEach((sentence, index) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
        utterance.lang = matchedVoice?.lang || detected.code;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        if (index === sentences.length - 1) {
          utterance.onend = () => {
            setActiveSpeakingMessageId(null);
            setVoiceState('stopped');
          };
        }

        utterance.onerror = (e) => {
          // Ignore interruption/cancel errors
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('SpeechSynthesis error:', e.error);
          }
          setActiveSpeakingMessageId(null);
          setVoiceState('stopped');
        };

        utterances.push(utterance);
      });

      speechSynthesisUtterancesRef.current = utterances;

      utterances.forEach((u) => {
        window.speechSynthesis.speak(u);
      });
    },
    [activeSpeakingMessageId, voiceState, stopSpeaking]
  );

  // Fallback MediaRecorder transcription using server Gemini STT
  const startMediaRecording = async (stream: MediaStream): Promise<void> => {
    try {
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          setVoiceState('stopped');
          return;
        }

        setVoiceState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: base64Data,
                  mimeType,
                  language: selectedLanguage,
                }),
              });

              if (!res.ok) {
                throw new Error('Transcription failed on server.');
              }

              const data = await res.json();
              const recognized = (data.text || '').trim();
              if (recognized) {
                setInterimTranscript('');
                onTranscriptReady(recognized, false);
              }
            } catch (err: any) {
              console.warn('Fallback transcription error:', err);
              setErrorMessage('Could not transcribe audio. Please try again or type your message.');
            } finally {
              setVoiceState('stopped');
            }
          };
        } catch (err: any) {
          console.warn('Error reading recorded audio:', err);
          setVoiceState('stopped');
        }
      };

      recorder.start(250);
    } catch (recErr: any) {
      console.warn('MediaRecorder error:', recErr);
    }
  };

  // Start Voice Listening (Speech-to-Text)
  const startListening = useCallback(async () => {
    // If already speaking, stop playback first
    stopSpeaking();
    setErrorMessage(null);
    setInterimTranscript('');

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Check if browser allows getUserMedia microphone access
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Microphone permission check error:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser or site settings.'
        );
        setVoiceState('stopped');
        return;
      } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device found on this system.');
        setVoiceState('stopped');
        return;
      }
    }

    // If native Web Speech API is supported
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        if (selectedLanguage !== 'auto') {
          recognition.lang = selectedLanguage;
        } else {
          // Use user's navigator language or Urdu/Arabic if chosen
          recognition.lang = navigator.language || 'en-US';
        }

        let accumulatedFinalText = '';

        recognition.onstart = () => {
          isSpeechRecognitionActiveRef.current = true;
          setVoiceState('listening');
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedFinalText += (accumulatedFinalText ? ' ' : '') + transcript;
            } else {
              currentInterim += transcript;
            }
          }

          const combined = (accumulatedFinalText + ' ' + currentInterim).trim();
          setInterimTranscript(combined);
          if (combined) {
            onTranscriptReady(combined, false);
          }
        };

        recognition.onerror = async (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          isSpeechRecognitionActiveRef.current = false;

          if (event.error === 'not-allowed') {
            setErrorMessage(
              'Microphone access denied. Please click the permissions icon in your address bar to enable your microphone.'
            );
            setVoiceState('stopped');
          } else if (event.error === 'no-speech') {
            // No speech detected, graceful stop
            setVoiceState('stopped');
          } else {
            // If Web Speech failed on speech recognition engine, fallback to server MediaRecorder
            if (stream) {
              await startMediaRecording(stream);
            } else {
              setVoiceState('stopped');
            }
          }
        };

        recognition.onend = () => {
          isSpeechRecognitionActiveRef.current = false;
          if (accumulatedFinalText.trim()) {
            onTranscriptReady(accumulatedFinalText.trim(), false);
          }
          setInterimTranscript('');
          setVoiceState('stopped');

          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        recognition.start();
        return;
      } catch (err: any) {
        console.warn('SpeechRecognition start failed, trying fallback:', err);
      }
    }

    // Fallback path: If Web Speech API is unavailable or threw error, use MediaRecorder
    if (stream) {
      setVoiceState('listening');
      await startMediaRecording(stream);
    } else {
      setErrorMessage(
        'Speech recognition is not supported in this browser. You can still type your questions.'
      );
      setVoiceState('stopped');
    }
  }, [stopSpeaking, selectedLanguage, onTranscriptReady]);

  // Stop Voice Listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isSpeechRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      isSpeechRecognitionActiveRef.current = false;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        setVoiceState('processing');
        mediaRecorderRef.current.stop();
      } catch {
        setVoiceState('stopped');
      }
    } else if (voiceState === 'listening') {
      setVoiceState('stopped');
    }
  }, [voiceState]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  return {
    voiceState,
    selectedLanguage,
    setSelectedLanguage,
    interimTranscript,
    errorMessage,
    setErrorMessage,
    activeSpeakingMessageId,
    detectedSpokenLanguage,
    isSpeechSupported,
    availableVoices,
    startListening,
    stopListening,
    toggleListening,
    speakMessage,
    stopSpeaking,
  };
}
