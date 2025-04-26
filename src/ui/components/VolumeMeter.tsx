import { motion } from 'framer-motion';

interface VolumeMeterProps {
    rms: number;
    isDarkMode: boolean;
}

export function VolumeMeter({ rms, isDarkMode }: VolumeMeterProps) {
    // Scale RMS to percentage (RMS is typically between 0 and 1)
    const volumePercentage = Math.min(100, Math.round(rms * 1000));

    // Color transitions based on volume level
    const getColor = () => {
        if (volumePercentage > 80) return 'bg-red-500';
        if (volumePercentage > 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-4`}>
            <div className="flex items-center gap-4">
                <div className="text-sm font-mono whitespace-nowrap">
                    RMS: {rms.toFixed(4)}
                </div>
                <div className="flex-grow h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${getColor()} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${volumePercentage}%` }}
                        transition={{
                            type: "tween",
                            duration: 0.1,
                            ease: "linear"
                        }}
                    />
                </div>
                <div className="text-sm font-mono whitespace-nowrap">
                    {volumePercentage}%
                </div>
            </div>
        </div>
    );
}
