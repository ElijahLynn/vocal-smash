import { create } from 'zustand';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface AppState {
    isRecording: boolean;
    pitchData: PitchDetectionResult | null;
    error: string | null;
    setIsRecording: (isRecording: boolean) => void;
    setPitchData: (pitchData: PitchDetectionResult | null) => void;
    setError: (error: string | null) => void;
    history: PitchDetectionResult[];
    addToHistory: (data: PitchDetectionResult) => void;
    clearHistory: () => void;
}

export const useStore = create<AppState>((set) => ({
    isRecording: false,
    pitchData: null,
    error: null,
    history: [],
    setIsRecording: (isRecording) => set({ isRecording }),
    setPitchData: (pitchData) => {
        set((state) => {
            if (pitchData && (!state.pitchData ||
                pitchData.note !== state.pitchData.note ||
                pitchData.octave !== state.pitchData.octave ||
                Math.abs(pitchData.cents - state.pitchData.cents) > 5)) {
                return {
                    pitchData,
                    history: [...state.history.slice(-99), pitchData],
                };
            }
            return { pitchData };
        });
    },
    setError: (error) => set({ error }),
    addToHistory: (data) =>
        set((state) => ({
            history: [...state.history.slice(-99), data]
        })),
    clearHistory: () => set({ history: [] }),
}));
