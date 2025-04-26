import { motion } from 'framer-motion';
import { useStore } from '../../store/store';

interface LeaderSpeedControlProps {
    isDarkMode: boolean;
}

export function LeaderSpeedControl({ isDarkMode }: LeaderSpeedControlProps) {
    const { leaderSpeed, setLeaderSpeed } = useStore();

    return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">
                        Leader Speed: {leaderSpeed.toFixed(1)}s
                    </label>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLeaderSpeed(2)}
                        className={`text-xs px-2 py-1 rounded ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                    >
                        Reset
                    </motion.button>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={leaderSpeed}
                    onChange={(e) => setLeaderSpeed(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                        }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Faster</span>
                    <span>Slower</span>
                </div>
            </div>
        </div>
    );
}
