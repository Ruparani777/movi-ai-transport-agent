import { useEffect, useRef, useState } from "react";

type SpeechState = "idle" | "listening" | "speaking";

export const useSpeech = () => {
  const [transcript, setTranscript] = useState("");
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setSpeechState("idle");
    };

    recognition.onerror = () => {
      setSpeechState("idle");
    };

    recognition.onend = () => {
      setSpeechState("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setSpeechState("listening");
      recognitionRef.current.start();
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    setSpeechState("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeechState("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return {
    transcript,
    setTranscript,
    speechState,
    startListening,
    speak
  };
};

