import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { PitchDetectionResult } from '../../audio/PitchDetector';
import { useStore } from '../store/useStore';

interface SpectrogramDisplayProps {
    pitchData: PitchDetectionResult | null;
    isRecording: boolean;
    isDarkMode: boolean;
}

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const MIN_DB = -70;
const MAX_DB = -20;
const NOISE_FLOOR = -60;
const COLUMN_WIDTH = 4;

// Helper function to convert frequency to y-position
function freqToY(freq: number, height: number, range: { min: number; max: number }): number {
    const minFreq = range.min;
    const maxFreq = range.max;
    const normalized = Math.log2(freq / minFreq) / Math.log2(maxFreq / minFreq);
    return Math.round(height - (normalized * height));
}

// Helper function to get note range
function getNoteRange(centerNote: string, centerOctave: number): { min: number; max: number } {
    const noteFreq = NOTE_FREQUENCIES.find(n => n.note === `${centerNote}${centerOctave}`)?.freq || 440;
    return {
        min: noteFreq / Math.pow(2, 0.75), // Down 0.75 octaves
        max: noteFreq * Math.pow(2, 0.75)  // Up 0.75 octaves
    };
}

// Define main musical notes and their frequencies (from high to low)
const NOTE_FREQUENCIES = [
    { note: 'C6', freq: 1046.50 },
    { note: 'B5', freq: 987.77 },
    { note: 'A#5', freq: 932.33 },
    { note: 'A5', freq: 880.00 },
    { note: 'G#5', freq: 830.61 },
    { note: 'G5', freq: 783.99 },
    { note: 'F#5', freq: 739.99 },
    { note: 'F5', freq: 698.46 },
    { note: 'E5', freq: 659.26 },
    { note: 'D#5', freq: 622.25 },
    { note: 'D5', freq: 587.33 },
    { note: 'C#5', freq: 554.37 },
    { note: 'C5', freq: 523.25 },
    { note: 'B4', freq: 493.88 },
    { note: 'A#4', freq: 466.16 },
    { note: 'A4', freq: 440.00 },
    { note: 'G#4', freq: 415.30 },
    { note: 'G4', freq: 392.00 },
    { note: 'F#4', freq: 369.99 },
    { note: 'F4', freq: 349.23 },
    { note: 'E4', freq: 329.63 },
    { note: 'D#4', freq: 311.13 },
    { note: 'D4', freq: 293.66 },
    { note: 'C#4', freq: 277.18 },
    { note: 'C4', freq: 261.63 },
    { note: 'B3', freq: 246.94 },
    { note: 'A#3', freq: 233.08 },
    { note: 'A3', freq: 220.00 },
    { note: 'G#3', freq: 207.65 },
    { note: 'G3', freq: 196.00 },
    { note: 'F#3', freq: 185.00 },
    { note: 'F3', freq: 174.61 },
    { note: 'E3', freq: 164.81 },
    { note: 'D#3', freq: 155.56 },
    { note: 'D3', freq: 146.83 },
    { note: 'C#3', freq: 138.59 },
    { note: 'C3', freq: 130.81 },
    { note: 'B2', freq: 123.47 },
    { note: 'A#2', freq: 116.54 },
    { note: 'A2', freq: 110.00 },
    { note: 'G#2', freq: 103.83 },
    { note: 'G2', freq: 98.00 },
    { note: 'F#2', freq: 92.50 },
    { note: 'F2', freq: 87.31 },
    { note: 'E2', freq: 82.41 }
];

export function SpectrogramDisplay({ pitchData, isRecording, isDarkMode }: SpectrogramDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const imageDataRef = useRef<ImageData | null>(null);
    const lastPitchRef = useRef<{ note: string; octave: number; frequency: number; cents: number } | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const { leaderDirection, leaderSpeed, noteRefreshRate } = useStore();
    const x = useMotionValue(0);
    const y = useMotionValue(CANVAS_HEIGHT / 2);
    const [firstNote, setFirstNote] = useState<{ note: string; octave: number } | null>(null);
    const [frequencyRange, setFrequencyRange] = useState<{ min: number; max: number } | null>(null);

    // Update frequency range when first note is detected
    useEffect(() => {
        if (!firstNote && pitchData?.note && pitchData.octave) {
            setFirstNote({ note: pitchData.note, octave: pitchData.octave });
            const range = getNoteRange(pitchData.note, pitchData.octave);
            setFrequencyRange(range);
        }
    }, [pitchData?.note, pitchData?.octave, firstNote]);

    // Smoothed pitch state
    const [smoothedPitch, setSmoothedPitch] = useState<{
        note: string;
        octave: number;
        frequency: number;
        cents: number;
    } | null>(null);

    // Update smoothed pitch with configurable refresh rate
    useEffect(() => {
        if (!pitchData?.note) {
            setSmoothedPitch(null);
            lastPitchRef.current = null;
            return;
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

        if (!lastPitchRef.current ||
            timeSinceLastUpdate > noteRefreshRate ||
            Math.abs(pitchData.frequency - lastPitchRef.current.frequency) > 5 ||
            pitchData.note !== lastPitchRef.current.note) {

            setSmoothedPitch({
                note: pitchData.note,
                octave: pitchData.octave,
                frequency: pitchData.frequency,
                cents: pitchData.cents
            });

            lastPitchRef.current = {
                note: pitchData.note,
                octave: pitchData.octave,
                frequency: pitchData.frequency,
                cents: pitchData.cents
            };
            lastUpdateTimeRef.current = now;
        }
    }, [pitchData, noteRefreshRate]);

    // Update y position based on pitch
    useEffect(() => {
        if (pitchData?.frequency && pitchData?.note && frequencyRange) {
            const noteFreq = NOTE_FREQUENCIES.find(
                n => n.note === `${pitchData.note}${pitchData.octave}`
            )?.freq;

            const targetY = freqToY(noteFreq || pitchData.frequency, CANVAS_HEIGHT, frequencyRange);

            animate(y, targetY, {
                type: "spring",
                stiffness: 300,
                damping: 30
            });
        }
    }, [pitchData?.frequency, pitchData?.note, frequencyRange]);

    // Reset x position and start animation when recording starts
    useEffect(() => {
        if (isRecording) {
            x.set(leaderDirection === 'ltr' ? 0 : CANVAS_WIDTH);
            animate(x, leaderDirection === 'ltr' ? CANVAS_WIDTH : 0, {
                duration: leaderSpeed * 5,
                ease: "linear",
                repeat: Infinity
            });
        }
    }, [isRecording, leaderDirection, leaderSpeed]);

    // Add resize handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            canvas.width = window.innerWidth * 2;
            canvas.height = window.innerHeight * 2;

            const ctx = canvas.getContext('2d', {
                alpha: false,
                willReadFrequently: true
            });
            if (!ctx) return;

            ctx.scale(2, 2);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            if (frequencyRange) {
                ctx.textBaseline = 'middle';
                ctx.textRendering = 'optimizeLegibility';

                // Only draw note lines within the frequency range
                NOTE_FREQUENCIES.forEach(({ note, freq }) => {
                    if (freq >= frequencyRange.min && freq <= frequencyRange.max) {
                        const y = freqToY(freq, window.innerHeight, frequencyRange);

                        ctx.fillStyle = '#ffffff80';
                        ctx.font = '12px "SF Mono", Monaco, Menlo, Consolas, monospace';

                        ctx.textAlign = 'left';
                        ctx.fillText(note, 5, y);

                        ctx.textAlign = 'right';
                        ctx.fillText(note, window.innerWidth - 5, y);

                        ctx.fillStyle = '#ffffff40';
                        ctx.fillRect(25, Math.floor(y), window.innerWidth - 50, 1);
                    }
                });
            }

            imageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isDarkMode, frequencyRange]);

    // Handle data updates and rendering
    useEffect(() => {
        if (!isRecording) {
            const ctx = canvasRef.current?.getContext('2d', {
                alpha: false,
                willReadFrequently: true
            });
            if (ctx && imageDataRef.current) {
                ctx.putImageData(imageDataRef.current, 0, 0);
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', {
            alpha: false,
            willReadFrequently: true
        });
        if (!ctx || !imageDataRef.current) return;

        const render = () => {
            ctx.putImageData(imageDataRef.current!, 0, 0);

            if (pitchData?.frequencyData && frequencyRange) {
                const frequencyData = pitchData.frequencyData;

                for (let i = 0; i < frequencyData.length / 4; i++) {
                    const value = frequencyData[i];
                    if (value < NOISE_FLOOR) continue;

                    const normalized = (value - MIN_DB) / (MAX_DB - MIN_DB);
                    const intensity = Math.max(0, Math.min(1, normalized));
                    if (intensity < 0.1) continue;

                    const r = Math.round(intensity * 180);
                    const g = Math.round(intensity * 100);
                    const b = Math.round(intensity * 255);
                    const a = Math.pow(intensity, 1.5) * 0.8;

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                    const freq = (i / (frequencyData.length / 4)) * (frequencyRange.max - frequencyRange.min) + frequencyRange.min;
                    const yPos = freqToY(freq, canvas.height, frequencyRange);
                    const nextFreq = ((i + 1) / (frequencyData.length / 4)) * (frequencyRange.max - frequencyRange.min) + frequencyRange.min;
                    const nextYPos = freqToY(nextFreq, canvas.height, frequencyRange);
                    const height = Math.abs(nextYPos - yPos);
                    ctx.fillRect(0, yPos, canvas.width, height);
                }

                if (pitchData.frequency && pitchData.note) {
                    const y = freqToY(pitchData.frequency, canvas.height, frequencyRange);
                    const clarity = pitchData.clarity || 0;

                    const leadingX = Math.min(Math.max(0, x.get() || 0), canvas.width);
                    if (Number.isFinite(leadingX)) {
                        const trailLength = 150;
                        const startX = leaderDirection === 'ltr'
                            ? Math.max(0, leadingX - trailLength)
                            : leadingX;
                        const endX = leaderDirection === 'ltr'
                            ? leadingX
                            : Math.min(canvas.width, leadingX + trailLength);

                        const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
                        const glowColor = '0, 255, 0';

                        if (leaderDirection === 'ltr') {
                            gradient.addColorStop(0, `rgba(${glowColor}, 0)`);
                            gradient.addColorStop(1, `rgba(${glowColor}, ${clarity * 0.8})`);
                        } else {
                            gradient.addColorStop(0, `rgba(${glowColor}, ${clarity * 0.8})`);
                            gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
                        }

                        ctx.fillStyle = gradient;
                        ctx.fillRect(startX, y - 3, endX - startX, 6);

                        const edgeGlow = ctx.createRadialGradient(
                            leadingX, y, 0,
                            leadingX, y, 10
                        );
                        edgeGlow.addColorStop(0, `rgba(${glowColor}, ${clarity})`);
                        edgeGlow.addColorStop(1, `rgba(${glowColor}, 0)`);

                        ctx.fillStyle = edgeGlow;
                        ctx.beginPath();
                        ctx.arc(leadingX, y, 10, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            imageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecording, isDarkMode, pitchData, x, leaderDirection, frequencyRange]);

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{
                    imageRendering: 'auto'
                }}
            />
            {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-mono">
                    Click Start to begin
                </div>
            )}
            {isRecording && smoothedPitch && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl bg-black/50 text-white font-mono backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <span className={`text-4xl font-bold tracking-wider ${Math.abs(smoothedPitch.cents) <= 5 ? 'text-green-400' :
                            smoothedPitch.cents > 0 ? 'text-red-400' : 'text-blue-400'
                            }`}>
                            {smoothedPitch.note}{smoothedPitch.octave}
                        </span>
                        <span className="text-lg mt-1">
                            {Math.round(smoothedPitch.frequency)}Hz
                            {smoothedPitch.cents !== 0 && (
                                <span className={
                                    smoothedPitch.cents > 0 ? 'text-red-400' : 'text-blue-400'
                                }>
                                    {` (${smoothedPitch.cents > 0 ? '+' : ''}${smoothedPitch.cents}¢)`}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            )}
            {isRecording && (
                <motion.div
                    className="absolute pointer-events-none"
                    style={{
                        x,
                        y,
                        translateX: '-50%',
                        translateY: '-50%'
                    }}
                >
                    <div className={`flex flex-col items-center justify-center ${pitchData?.frequency ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-0.5 h-${leaderDirection === 'ltr' ? '12' : '0'} mb-2 bg-white/50`} />

                        <div className="px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-[2px] text-white font-mono text-lg font-bold">
                            {pitchData?.note ? (
                                <>
                                    <span>{pitchData.note}</span>
                                    <sub>{pitchData.octave}</sub>
                                    <span className={`ml-1 text-xs ${Math.abs(pitchData.cents) <= 5 ? 'text-green-400' : pitchData.cents > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {pitchData.cents > 0 ? '+' : ''}{pitchData.cents}¢
                                    </span>
                                </>
                            ) : '—'}
                        </div>

                        {pitchData?.note && (
                            <div className="mt-1 flex items-center gap-1">
                                <div className={`h-0.5 w-4 rounded-full transition-colors ${Math.abs(pitchData.cents) <= 5
                                    ? 'bg-green-400'
                                    : pitchData.cents > 0
                                        ? 'bg-red-400'
                                        : 'bg-blue-400'
                                    }`} />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
