import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PitchDetector } from './audio/PitchDetector';
import { PitchDisplay } from './ui/components/PitchDisplay';
import { PitchHistory } from './ui/components/PitchHistory';
import { useStore } from './ui/store/useStore';
import { useAudioPermission } from './ui/hooks/useAudioPermission';
import { useRegisterSW } from './pwa/useRegisterSW';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const detectorRef = useRef<PitchDetector | null>(null);
  const animationFrameRef = useRef<number>();

  const {
    isRecording,
    pitchData,
    error,
    history,
    setIsRecording,
    setPitchData,
    setError,
    clearHistory,
  } = useStore();

  const {
    isGranted,
    isDenied,
    needsPrompt,
    requestPermission,
    error: permissionError,
  } = useAudioPermission();

  const {
    isUpdateAvailable,
    updateServiceWorker,
    canInstall,
    promptInstall,
  } = useRegisterSW();

  useEffect(() => {
    if (!detectorRef.current) {
      detectorRef.current = new PitchDetector();
    }
  }, []);

  const startRecording = async () => {
    if (!isGranted && needsPrompt) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      await detectorRef.current?.start();
      setIsRecording(true);
      setError(null);

      const updatePitch = () => {
        if (detectorRef.current && isRecording) {
          const result = detectorRef.current.analyze();
          setPitchData(result);
          animationFrameRef.current = requestAnimationFrame(updatePitch);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please check your microphone.');
    }
  };

  const stopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    detectorRef.current?.stop();
    setIsRecording(false);
    setPitchData(null);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'
    }`}>
      <header className="mb-8 text-center relative w-full">
        <h1 className={`text-4xl font-bold ${
          isDarkMode ? 'text-indigo-400' : 'text-natural-primary'
        }`}>Vocal Smash</h1>
        <p className={`mt-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>Real-time pitch detection</p>

        <button
          onClick={toggleDarkMode}
          className={`absolute right-4 top-0 p-2 rounded-full ${
            isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-600'
          } hover:opacity-80 transition-opacity`}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="w-full max-w-lg space-y-6">
        <PitchDisplay pitchData={pitchData} isRecording={isRecording} isDarkMode={isDarkMode} />

        {history.length > 0 && (
          <PitchHistory history={history} isDarkMode={isDarkMode} />
        )}

        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isDenied}
            className={`px-8 py-3 rounded-full font-semibold text-white shadow-lg
              ${isRecording
                ? 'bg-pitch-sharp hover:bg-red-600'
                : isDarkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-natural-primary hover:bg-natural-hover'
              } ${isDenied ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? 'Stop' : 'Start'}
          </motion.button>

          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearHistory}
              className={`px-8 py-3 rounded-full font-semibold ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Clear History
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {(error || permissionError) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-lg text-center ${
                isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
              }`}
            >
              {error || permissionError}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className={`mt-auto py-4 text-sm text-center ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p>Built with ❤️ for singers</p>

        {isUpdateAvailable && (
          <button
            onClick={updateServiceWorker}
            className={`mt-2 ${
              isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-natural-primary hover:text-natural-hover'
            }`}
          >
            Update available! Click to refresh
          </button>
        )}

        {canInstall && (
          <button
            onClick={promptInstall}
            className={`mt-2 block ${
              isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-natural-primary hover:text-natural-hover'
            }`}
          >
            Install App
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
