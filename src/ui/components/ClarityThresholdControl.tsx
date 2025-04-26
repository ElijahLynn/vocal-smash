import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

interface ClarityThresholdControlProps {
    isDarkMode: boolean;
}

export function ClarityThresholdControl({ isDarkMode }: ClarityThresholdControlProps) {
    const { clarityThreshold, setClarityThreshold } = useStore();

    return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">
                        Clarity Threshold: {(clarityThreshold * 100).toFixed(0)}%
                    </label>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setClarityThreshold(0.8)}
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
                    min="0"
                    max="100"
                    value={clarityThreshold * 100}
                    onChange={(e) => setClarityThreshold(Number(e.target.value) / 100)}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode
                            ? 'bg-gray-700'
                            : 'bg-gray-200'
                        }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Less strict</span>
                    <span>More strict</span>
                </div>
            </div>
        </div>
    );
}
