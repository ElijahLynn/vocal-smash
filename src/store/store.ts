import { create } from 'zustand';

interface State {
    isDebugMode: boolean;
    leaderDirection: 'ltr' | 'rtl';
    leaderSpeed: number;
}

const initialState: State = {
    isDebugMode: false,
    leaderDirection: 'ltr',
    leaderSpeed: 2, // Default speed in seconds
};

interface Actions {
    setDebugMode: (isDebugMode: boolean) => void;
    setLeaderDirection: (direction: 'ltr' | 'rtl') => void;
    setLeaderSpeed: (speed: number) => void;
}

export const useStore = create<State & Actions>((set) => ({
    ...initialState,
    setDebugMode: (isDebugMode) => set({ isDebugMode }),
    setLeaderDirection: (direction) => set({ leaderDirection: direction }),
    setLeaderSpeed: (speed) => set({ leaderSpeed: speed }),
}));
