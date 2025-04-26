import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PitchDetectionResult } from '../../audio/PitchDetector';

interface PitchDisplayProps {
    pitchData: PitchDetectionResult | null;
    isRecording: boolean;
}

export const PitchDisplay: React.FC<PitchDisplayProps> = ({ pitchData, isRecording }) => {
    const isSharp = pitchData?.cents && pitchData.cents > 5;
    const isFlat = pitchData?.cents && pitchData.cents < -5;
    const isPerfect = pitchData?.cents && Math.abs(pitchData.cents) <= 5;

    const getPitchColor = () => {
        if (!pitchData) return 'text-gray-400';
        if (isPerfect) return 'text-pitch-perfect';
        if (isSharp) return 'text-pitch-sharp';
        return 'text-pitch-flat';
    };

    const isAccidental = pitchData?.note?.includes('#');

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg">
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
                            <span className={`${getPitchColor()} ${isAccidental ? 'text-accidental-primary' : 'text-natural-primary'}`}>
                                {pitchData.note}
                                <sub className="text-3xl">{pitchData.octave}</sub>
                            </span>
                        </div>

                        <motion.div
                            className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden"
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

                        <div className="mt-4 text-sm text-gray-600">
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
                    className="text-gray-400 text-xl"
                >
                    Listening...
                </motion.div>
            )}

            {!isRecording && (
                <div className="text-gray-400 text-xl">
                    Press Start to begin
                </div>
            )}
        </div>
    );
};
