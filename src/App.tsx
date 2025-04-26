import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PitchDetector } from './audio/PitchDetector';
import { PitchDisplay } from './ui/components/PitchDisplay';
import { PitchHistory } from './ui/components/PitchHistory';
import { useStore } from './ui/store/useStore';
import { useAudioPermission } from './ui/hooks/useAudioPermission';
import { useRegisterSW } from './pwa/useRegisterSW';

function App() {
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-natural-primary">Vocal Smash</h1>
        <p className="text-gray-600 mt-2">Real-time pitch detection</p>
      </header>

      <main className="w-full max-w-lg space-y-6">
        <PitchDisplay pitchData={pitchData} isRecording={isRecording} />

        {history.length > 0 && (
          <PitchHistory history={history} />
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
              className="px-8 py-3 rounded-full font-semibold text-gray-600 hover:text-gray-800"
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
              className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-center"
            >
              {error || permissionError}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-4 text-sm text-gray-500 text-center">
        <p>Built with ❤️ for singers</p>

        {isUpdateAvailable && (
          <button
            onClick={updateServiceWorker}
            className="mt-2 text-natural-primary hover:text-natural-hover"
          >
            Update available! Click to refresh
          </button>
        )}

        {canInstall && (
          <button
            onClick={promptInstall}
            className="mt-2 block text-natural-primary hover:text-natural-hover"
          >
            Install App
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
