import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PitchDetector } from './audio/PitchDetector';
import { SpectrogramDisplay } from './ui/components/SpectrogramDisplay';
import { VolumeMeter } from './ui/components/VolumeMeter';
import { ClarityThresholdControl } from './ui/components/ClarityThresholdControl';
import { LeaderSpeedControl } from './ui/components/LeaderSpeedControl';
import { useStore } from './ui/store/useStore';
import { useAudioPermission } from './ui/hooks/useAudioPermission';
import { useRegisterSW } from './pwa/useRegisterSW';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number>();
  const [currentRms, setCurrentRms] = useState(0);
  const [clarityThreshold, setClarityThreshold] = useState(0.5);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const detectorRef = useRef<PitchDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const isRecordingRef = useRef(false);

  const {
    isRecording,
    pitchData,
    error,
    setIsRecording,
    setPitchData,
    setError,
    leaderDirection,
    setLeaderDirection,
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
      detectorRef.current = new PitchDetector(isDebugMode);
    } else {
      detectorRef.current.setDebugMode(isDebugMode);
    }
  }, [isDebugMode]);

  const startRecording = async () => {
    if (!isGranted && needsPrompt) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      setIsRecording(true);
      isRecordingRef.current = true;

      await detectorRef.current?.start();
      setError(null);

      const updatePitch = () => {
        if (!detectorRef.current || !isRecordingRef.current) return;

        const result = detectorRef.current.analyze();
        if (result?.rms !== undefined) {
          setCurrentRms(result.rms);
        }
        if (result?.frequency && result.confidence >= clarityThreshold) {
          setPitchData(result);
        } else {
          setPitchData(null);
        }

        if (isRecordingRef.current) {
          animationFrameRef.current = requestAnimationFrame(updatePitch);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please check your microphone.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setCurrentRms(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    detectorRef.current?.stop();
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

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleDebugMode = () => setIsDebugMode(!isDebugMode);
  const toggleLeaderDirection = () => setLeaderDirection(leaderDirection === 'ltr' ? 'rtl' : 'ltr');

  // Reset the controls timeout
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Initialize controls timeout
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDenied) return;

    resetControlsTimeout();

    if (isRecording) {
      stopRecording();
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div
      className={`min-h-screen w-full fixed inset-0 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onMouseMove={resetControlsTimeout}
    >
      {/* Debug Overlay */}
      {isDebugMode && isRecording && (
        <div className="absolute top-4 right-4 z-20 w-64 space-y-2">
          <div className="backdrop-blur-sm bg-black/30 rounded-lg">
            <VolumeMeter
              rms={pitchData?.rms ?? 0}
              isDarkMode={true}
            />
          </div>
          <div className="backdrop-blur-sm bg-black/30 rounded-lg">
            <ClarityThresholdControl
              isDarkMode={true}
            />
          </div>
          <div className="backdrop-blur-sm bg-black/30 rounded-lg">
            <LeaderSpeedControl
              isDarkMode={true}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative w-full h-full">
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
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 p-4 rounded-lg backdrop-blur-sm bg-red-500/50 text-white text-center max-w-md"
            >
              {error || permissionError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-4 right-4 z-20 flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleLeaderDirection(); }}
              className={`p-2 rounded-full ${isDarkMode
                ? 'bg-gray-800/70 text-gray-400'
                : 'bg-gray-200/70 text-gray-600'
                } hover:opacity-80 transition-opacity backdrop-blur-sm`}
              title={`Leader line direction: ${leaderDirection.toUpperCase()}`}
            >
              {leaderDirection === 'ltr' ? '⇨' : '⇦'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleDebugMode(); }}
              className={`p-2 rounded-full ${isDarkMode
                ? isDebugMode ? 'bg-indigo-600 text-white' : 'bg-gray-800/70 text-gray-400'
                : isDebugMode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200/70 text-gray-600'
                } hover:opacity-80 transition-opacity backdrop-blur-sm`}
              title="Toggle debug logging"
            >
              🐛
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800/70 text-yellow-400' : 'bg-gray-200/70 text-gray-600'
                } hover:opacity-80 transition-opacity backdrop-blur-sm`}
              title="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Updates */}
      <AnimatePresence>
        {showControls && (isUpdateAvailable || canInstall) && (
          <motion.div
            className="absolute bottom-4 left-4 z-20 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {isUpdateAvailable && (
              <button
                onClick={(e) => { e.stopPropagation(); updateServiceWorker(); }}
                className="px-4 py-2 rounded-lg backdrop-blur-sm bg-indigo-500/50 text-white hover:bg-indigo-600/50"
              >
                Update available! Click to refresh
              </button>
            )}
            {canInstall && (
              <button
                onClick={(e) => { e.stopPropagation(); promptInstall(); }}
                className="px-4 py-2 rounded-lg backdrop-blur-sm bg-indigo-500/50 text-white hover:bg-indigo-600/50"
              >
                Install App
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
