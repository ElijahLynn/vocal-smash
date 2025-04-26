import { useStore } from '../../store/store';
import { motion } from 'framer-motion';
import { LeaderDirectionControl } from './LeaderDirectionControl';
import { LeaderSpeedControl } from './LeaderSpeedControl';
import { NoteRefreshControl } from './NoteRefreshControl';

interface SettingsPanelProps {
    onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
    const { isDebugMode, setDebugMode } = useStore();

    return (
        <motion.div
            className="bg-gray-800 rounded-lg shadow-xl p-6 w-[400px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="text-lg text-white">Debug Mode</label>
                    <button
                        onClick={() => setDebugMode(!isDebugMode)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors ${isDebugMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                        <motion.div
                            className="w-6 h-6 bg-white rounded-full"
                            animate={{ x: isDebugMode ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>

                <LeaderDirectionControl />
                <LeaderSpeedControl isDarkMode={true} />
                <NoteRefreshControl />
            </div>
        </motion.div>
    );
}
