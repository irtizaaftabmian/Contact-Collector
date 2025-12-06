import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../utils';

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setIsProcessing(true);
                try {
                    const text = await transcribeAudio(audioBlob);
                    onTranscriptionComplete(text);
                } catch (error) {
                    console.error('Transcription failed', error);
                    alert('Transcription failed. See console for details.');
                } finally {
                    setIsProcessing(false);
                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-4 rounded-full transition-all ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-[#0f62fe] hover:bg-[#0353e9]'
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isProcessing ? (
                    <Loader2 className="animate-spin" size={24} />
                ) : isRecording ? (
                    <Square size={24} />
                ) : (
                    <Mic size={24} />
                )}
            </button>
            <span className="text-sm text-gray-400">
                {isProcessing
                    ? 'Transcribing...'
                    : isRecording
                        ? 'Recording... Tap to stop'
                        : 'Tap to record voice note'}
            </span>
        </div>
    );
};
