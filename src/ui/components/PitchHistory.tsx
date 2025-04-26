import React from 'react';
import { motion } from 'framer-motion';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface PitchHistoryProps {
    history: PitchDetectionResult[];
    isDarkMode: boolean;
}

export const PitchHistory: React.FC<PitchHistoryProps> = ({ history, isDarkMode }) => {
    const maxCents = 50; // Maximum cents deviation to display
    const height = 100; // Height of the graph in pixels

    return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Note History</h2>
            <div className="flex flex-wrap gap-2">
                {history.map((data, index) => (
                    <div
                        key={index}
                        className={`px-2 py-1 rounded ${isDarkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {data.note}
                        <sub>{data.octave}</sub>
                    </div>
                ))}
            </div>
            <div className="relative w-full h-full">
                {/* Center line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-200" />

                {/* Pitch markers */}
                <div className="absolute left-0 right-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
                    <span>+50¢</span>
                    <span>0¢</span>
                    <span>-50¢</span>
                </div>

                {/* History graph */}
                <div className="absolute inset-0 flex items-center">
                    <div className="relative w-full h-full flex items-center">
                        {history.map((point, index) => {
                            const normalizedCents = Math.max(Math.min(point.cents, maxCents), -maxCents);
                            const yPosition = (normalizedCents / maxCents) * (height / 2);

                            return (
                                <motion.div
                                    key={index}
                                    className={`absolute w-1 rounded-full ${Math.abs(point.cents) <= 5
                                        ? 'bg-pitch-perfect'
                                        : point.cents > 0
                                            ? 'bg-pitch-sharp'
                                            : 'bg-pitch-flat'
                                        }`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{
                                        height: '4px',
                                        opacity: 1 - (history.length - index) * (1 / history.length),
                                    }}
                                    style={{
                                        left: `${(index / history.length) * 100}%`,
                                        bottom: `${50 - yPosition}%`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
