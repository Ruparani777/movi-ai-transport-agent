type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface Window {
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

