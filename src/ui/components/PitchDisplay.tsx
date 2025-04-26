import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface PitchDisplayProps {
    pitchData: PitchDetectionResult | null;
    isRecording: boolean;
    isDarkMode: boolean;
}

export const PitchDisplay: React.FC<PitchDisplayProps> = ({ pitchData, isRecording, isDarkMode }) => {
    const isSharp = pitchData?.cents && pitchData.cents > 5;
    const isFlat = pitchData?.cents && pitchData.cents < -5;
    const isPerfect = pitchData?.cents && Math.abs(pitchData.cents) <= 5;

    const getPitchColor = () => {
        if (!pitchData) return isDarkMode ? 'text-gray-500' : 'text-gray-400';
        if (isPerfect) return 'text-pitch-perfect';
        if (isSharp) return 'text-pitch-sharp';
        return 'text-pitch-flat';
    };

    const isAccidental = pitchData?.note?.includes('#');

    return (
        <div className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <AnimatePresence mode="wait">
                {pitchData && (
                    <motion.div
                        key={`${pitchData.note}${pitchData.octave}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center"
                    >
                        <div className="text-6xl font-bold mb-4">
                            <span className={`${getPitchColor()} ${isAccidental
                                ? isDarkMode ? 'text-gray-400' : 'text-accidental-primary'
                                : isDarkMode ? 'text-indigo-400' : 'text-natural-primary'
                                }`}>
                                {pitchData.note}
                                <sub className="text-3xl">{pitchData.octave}</sub>
                            </span>
                        </div>

                        <motion.div
                            className={`h-2 w-40 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}
                            initial={false}
                        >
                            <motion.div
                                className={`h-full ${isPerfect ? 'bg-pitch-perfect' : isSharp ? 'bg-pitch-sharp' : 'bg-pitch-flat'}`}
                                initial={{ width: '50%', x: '0%' }}
                                animate={{
                                    width: '10%',
                                    x: `${Math.max(Math.min(pitchData.cents, 50), -50)}%`,
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </motion.div>

                        <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            {pitchData.frequency.toFixed(1)} Hz
                            <span className="mx-2">|</span>
                            {pitchData.cents > 0 ? '+' : ''}{pitchData.cents} cents
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!pitchData && isRecording && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}
                >
                    Listening...
                    <div className="mt-4 flex gap-1">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2 h-2 rounded-full bg-indigo-400"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="w-2 h-2 rounded-full bg-indigo-400"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="w-2 h-2 rounded-full bg-indigo-400"
                        />
                    </div>
                </motion.div>
            )}

            {!isRecording && (
                <div className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Press Start to begin
                </div>
            )}
        </div>
    );
};
