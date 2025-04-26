import { create } from 'zustand';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface AppState {
    isRecording: boolean;
    pitchData: PitchDetectionResult | null;
    error: string | null;
    clarityThreshold: number;
    leaderDirection: 'ltr' | 'rtl';
    setIsRecording: (isRecording: boolean) => void;
    setPitchData: (data: PitchDetectionResult | null) => void;
    setError: (error: string | null) => void;
    setClarityThreshold: (threshold: number) => void;
    setLeaderDirection: (direction: 'ltr' | 'rtl') => void;
    history: PitchDetectionResult[];
    addToHistory: (data: PitchDetectionResult) => void;
    clearHistory: () => void;
}

export const useStore = create<AppState>((set) => ({
    isRecording: false,
    pitchData: null,
    error: null,
    clarityThreshold: 0.8,
    leaderDirection: 'ltr',
    history: [],
    setIsRecording: (isRecording) => set({ isRecording }),
    setPitchData: (data) => {
        set((state) => {
            if (data && (!state.pitchData ||
                data.note !== state.pitchData.note ||
                data.octave !== state.pitchData.octave ||
                Math.abs(data.cents - state.pitchData.cents) > 5)) {
                return {
                    pitchData: data,
                    history: [...state.history.slice(-99), data],
                };
            }
            return { pitchData: state.pitchData };
        });
    },
    setError: (error) => set({ error }),
    setClarityThreshold: (threshold) => set({ clarityThreshold: threshold }),
    setLeaderDirection: (direction) => set({ leaderDirection: direction }),
    addToHistory: (data) =>
        set((state) => ({
            history: [...state.history.slice(-99), data]
        })),
    clearHistory: () => set({ history: [] }),
}));
