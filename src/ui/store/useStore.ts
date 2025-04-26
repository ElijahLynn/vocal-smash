import { create } from 'zustand';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface AppState {
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
    pitchData: PitchDetectionResult | null;
    setPitchData: (data: PitchDetectionResult | null) => void;
    error: string | null;
    setError: (error: string | null) => void;
    clarityThreshold: number;
    setClarityThreshold: (threshold: number) => void;
    leaderDirection: 'ltr' | 'rtl';
    setLeaderDirection: (direction: 'ltr' | 'rtl') => void;
    history: PitchDetectionResult[];
    addToHistory: (data: PitchDetectionResult) => void;
    clearHistory: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    leaderSpeed: number;
    setLeaderSpeed: (speed: number) => void;
    noteRefreshRate: number;
    setNoteRefreshRate: (rate: number) => void;
}

export const useStore = create<AppState>((set) => ({
    isRecording: false,
    setIsRecording: (isRecording) => set({ isRecording }),
    pitchData: null,
    setPitchData: (data) => set({ pitchData: data }),
    error: null,
    setError: (error) => set({ error }),
    clarityThreshold: 0.8,
    setClarityThreshold: (threshold) => set({ clarityThreshold: threshold }),
    leaderDirection: 'ltr',
    setLeaderDirection: (direction) => set({ leaderDirection: direction }),
    history: [],
    addToHistory: (data) => set((state) => ({ history: [...state.history, data] })),
    clearHistory: () => set({ history: [] }),
    isDarkMode: true,
    toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    leaderSpeed: 1,
    setLeaderSpeed: (speed) => set({ leaderSpeed: speed }),
    noteRefreshRate: 100,  // Default 100ms refresh rate
    setNoteRefreshRate: (rate) => set({ noteRefreshRate: rate }),
}));
