import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpectrogramDisplay } from './ui/components/SpectrogramDisplay';
import { useStore } from './store/store';
import { SettingsPanel } from './ui/components/SettingsPanel';
import { useAudioPermission } from './ui/hooks/useAudioPermission';
import { useRegisterSW } from './pwa/useRegisterSW';
import { PitchDetector, PitchDetectionResult } from './audio/PitchDetector';

function App() {
  const { isDarkMode, isDebugMode, setDarkMode, setDebugMode } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: permissionError, isDenied } = useAudioPermission();
  const { canInstall, promptInstall, setCanInstall } = useRegisterSW();

  const detectorRef = useRef<PitchDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const isRecordingRef = useRef(false);

  const {
    leaderDirection,
    setLeaderDirection,
  } = useStore();

  useEffect(() => {
    detectorRef.current = new PitchDetector(isDebugMode);
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDebugMode]);

  const analyze = () => {
    if (!detectorRef.current || !isRecording) return;

    try {
      const result = detectorRef.current.analyze();
      setPitchData(result);
      animationFrameRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis error');
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (!detectorRef.current) return;
      await detectorRef.current.start();
      setIsRecording(true);
      analyze();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
    setPitchData(null);
  };

  useEffect(() => {
    if (isRecording && !isRecordingRef.current) {
      startRecording();
    } else if (!isRecording && isRecordingRef.current) {
      stopRecording();
    }

    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
    };
  }, [isRecording]);

  const toggleDarkMode = () => setDarkMode(!isDarkMode);
  const toggleDebugMode = () => setDebugMode(!isDebugMode);
  const toggleLeaderDirection = () => setLeaderDirection(leaderDirection === 'ltr' ? 'rtl' : 'ltr');

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="relative w-screen h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <SpectrogramDisplay
          pitchData={pitchData}
          isRecording={isRecording}
          isDarkMode={isDarkMode}
        />

        {/* Instructions Overlay */}
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="bg-black bg-opacity-50 p-4 rounded-lg backdrop-blur-sm">
              {isDenied ? (
                <p className="text-white">Please enable microphone access to use Vocal Smash</p>
              ) : (
                <p className="text-white">Click or touch anywhere to begin<br />Click or touch again to pause</p>
              )}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        <AnimatePresence>
          {(error || permissionError) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              {error || permissionError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            onClick={() => isRecording ? stopRecording() : startRecording()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isRecording ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Settings Modal */}
        {showSettings && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        )}

        {/* PWA Install Prompt */}
        <AnimatePresence>
          {canInstall && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 p-4 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-black/50 flex gap-4 items-center"
            >
              <span>Install as app?</span>
              <div className="flex gap-2">
                <button
                  onClick={promptInstall}
                  className="px-3 py-1 rounded-lg bg-blue-500 text-white"
                >
                  Install
                </button>
                <button
                  onClick={() => setCanInstall(false)}
                  className="px-3 py-1 rounded-lg bg-gray-500 text-white"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
