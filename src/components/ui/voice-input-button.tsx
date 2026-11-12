"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition;
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  lang?: string;
  fallbackLang?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  onError,
  lang = "ur-PK",
  fallbackLang = "en-US",
  label = "input",
  className,
  disabled = false,
}: VoiceInputButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleError = useCallback(
    (code?: string) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Please allow mic access in your browser.",
        "service-not-allowed": "Microphone access is blocked by the browser.",
        "no-speech": "No speech detected. Please try again.",
        "audio-capture": "No microphone found. Please check your device.",
        "network": "Voice recognition needs an internet connection.",
        "language-not-supported": "This voice language is not supported. Switch to EN and try again.",
        "aborted": "Voice input stopped.",
      };
      onError?.(messages[code ?? ""] || "Voice input failed. Please try again.");
    },
    [onError]
  );

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const startRecognition = (recognitionLang: string, allowFallback: boolean) => {
    const SpeechRecognitionImpl = getSpeechRecognition();
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = recognitionLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current === recognition) {
        setIsListening(false);
        recognitionRef.current = null;
      }

      if (
        event.error === "language-not-supported" &&
        allowFallback &&
        fallbackLang &&
        fallbackLang !== recognitionLang
      ) {
        onError?.("Urdu voice is not supported on this browser. Switching to English — please speak again.");
        window.setTimeout(() => startRecognition(fallbackLang, false), 250);
        return;
      }

      handleError(event.error);
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      const cleaned = transcript.replace(/\s+/g, " ").trim();
      if (cleaned) onTranscript(cleaned);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      if (allowFallback && fallbackLang && fallbackLang !== recognitionLang) {
        window.setTimeout(() => startRecognition(fallbackLang, false), 250);
        return;
      }
      onError?.("Voice input could not start. Please try again.");
    }
  };

  const toggleListening = () => {
    if (disabled || !isSupported) return;
    if (recognitionRef.current) {
      setIsListening(false);
      stopListening();
      return;
    }

    startRecognition(lang, true);
  };

  const tooltip = !isSupported
    ? "Voice input is not supported in this browser"
    : isListening
    ? `Stop listening for ${label}`
    : `Speak ${label}`;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled || !isSupported}
      title={tooltip}
      aria-label={tooltip}
      aria-pressed={isListening}
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200 cursor-pointer",
        isListening
          ? "border-[#DC2626] bg-[#DC2626] text-white shadow-md shadow-[#DC2626]/25"
          : "border-[#D8C5AD] bg-[#FAF7F2] text-[#8C6843] hover:border-[#8C6843] hover:bg-[#F0E6D8] dark:border-[#2D3E58] dark:bg-[#131B2A] dark:text-[#D4AF37] dark:hover:border-[#D4AF37] dark:hover:bg-[#1A2438]",
        (disabled || !isSupported) && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {isListening && (
        <span
          className="pointer-events-none absolute inset-0 animate-ping rounded-xl bg-[#DC2626]/40"
          style={{ animationDuration: "1.4s" }}
        />
      )}
      <Mic className="relative h-4 w-4" />
      {isListening && <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-[#DC2626]/60" />}
    </button>
  );
}
