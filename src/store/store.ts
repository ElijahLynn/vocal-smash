import { create } from 'zustand';

interface State {
    isDarkMode: boolean;
    isDebugMode: boolean;
    leaderDirection: 'ltr' | 'rtl';
    leaderSpeed: number;
}

const initialState: State = {
    isDarkMode: false,
    isDebugMode: false,
    leaderDirection: 'ltr',
    leaderSpeed: 2, // Default speed in seconds
};

interface Actions {
    setDarkMode: (isDarkMode: boolean) => void;
    setDebugMode: (isDebugMode: boolean) => void;
    setLeaderDirection: (direction: 'ltr' | 'rtl') => void;
    setLeaderSpeed: (speed: number) => void;
}

export const useStore = create<State & Actions>((set) => ({
    ...initialState,
    setDarkMode: (isDarkMode) => set({ isDarkMode }),
    setDebugMode: (isDebugMode) => set({ isDebugMode }),
    setLeaderDirection: (direction) => set({ leaderDirection: direction }),
    setLeaderSpeed: (speed) => set({ leaderSpeed: speed }),
}));
