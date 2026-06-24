import { useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatVoiceRecorder({ onAudioReady, theme, isRecording, setIsRecording }) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
          if (onAudioReady) {
            onAudioReady(audioFile);
          }
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        toast.error('Could not access microphone.');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => e.preventDefault()}
      className={`py-3 sm:py-4 flex items-center justify-center rounded-full transition-all flex-shrink-0`}
      title={isRecording ? "Stop recording" : "Voice message"}
    >
      {isRecording ? (
        <Square className="w-6 h-6 fill-red-500 text-red-500" />
      ) : (
        <Mic className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
      )}
    </button>
  );
}
