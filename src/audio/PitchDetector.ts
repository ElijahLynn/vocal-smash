import * as Pitchy from 'pitchy';

export interface PitchDetectionResult {
    frequency: number;
    note: string;
    octave: number;
    cents: number;
    confidence: number;
    rms: number;
    frequencyData?: Float32Array;
}

export class PitchDetector {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNode: GainNode | null = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private isRunning = false;
    private readonly bufferSize = 1024;
    private readonly sampleRate = 48000;
    private readonly inputGain = 1.0;
    private readonly minFreq = 80;  // C2
    private readonly maxFreq = 1100; // C6
    private debugMode = false;
    private pitchyDetector: Pitchy.PitchDetector | null = null;
    private inputBuffer: Float32Array | null = null;

    constructor(debug = false) {
        this.debugMode = debug;
        this.log('🐛 Debug mode ' + (debug ? 'enabled' : 'disabled') + ' 🐛');
        if (debug) {
            this.log('Debug logging will show:');
            this.log('🎤 - Audio setup and state changes');
            this.log('📊 - Buffer RMS levels and signal quality');
            this.log('🎵 - Detected frequencies and notes');
            this.log('❌ - Error conditions and rejections');
        }
    }

    private log(...args: any[]) {
        if (this.debugMode) {
            console.log(...args);
        }
    }

    private async initializeAudioContext() {
        try {
            this.audioContext = new AudioContext({
                latencyHint: 'interactive',
                sampleRate: this.sampleRate,
            });

            // Initialize Pitchy detector with the buffer size
            this.pitchyDetector = Pitchy.PitchDetector.forFloat32Array(this.bufferSize);
            this.inputBuffer = new Float32Array(this.bufferSize);
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            throw error;
        }
    }

    private frequencyToNote(frequency: number): { note: string; octave: number; cents: number } {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4 = 440;
        const a4Index = 69; // MIDI note number for A4

        const halfStepsFromA4 = 12 * Math.log2(frequency / a4);
        const midiNote = Math.round(a4Index + halfStepsFromA4);
        const octave = Math.floor((midiNote - 12) / 12);
        const noteIndex = (midiNote - 12) % 12;

        // Calculate cents deviation
        const exactHalfSteps = a4Index + halfStepsFromA4;
        const cents = Math.round((exactHalfSteps - midiNote) * 100);

        return {
            note: noteNames[noteIndex],
            octave,
            cents,
        };
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            this.log('🎤 Already running');
            return;
        }

        try {
            this.log('🎤 Requesting microphone access...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    latency: 0,
                    channelCount: 1
                },
            });
            this.log('🎤 Microphone access granted');

            if (!this.audioContext || this.audioContext.state === 'closed') {
                this.log('🎤 Initializing audio context...');
                await this.initializeAudioContext();
            }

            if (this.audioContext?.state === 'suspended') {
                this.log('🎤 Resuming audio context...');
                await this.audioContext.resume();
            }

            this.log('🎤 Setting up audio nodes...');
            this.source = this.audioContext!.createMediaStreamSource(this.mediaStream);
            this.gainNode = this.audioContext!.createGain();
            this.gainNode.gain.value = this.inputGain;
            this.analyser = this.audioContext!.createAnalyser();
            this.analyser.fftSize = this.bufferSize;
            this.analyser.smoothingTimeConstant = 0.5;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;

            this.source.connect(this.gainNode);
            this.gainNode.connect(this.analyser);
            this.isRunning = true;
            this.log('🎤 Pitch detector ready');
        } catch (error) {
            console.error('❌ Failed to start audio capture:', error);
            this.stop();
            throw error;
        }
    }

    stop(): void {
        if (!this.isRunning) return;

        this.log('🎤 Stopping pitch detector');
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.source?.disconnect();
        this.gainNode?.disconnect();
        this.analyser?.disconnect();
        this.isRunning = false;
        this.log('🎤 Pitch detector stopped');
    }

    analyze(): PitchDetectionResult | null {
        if (!this.isRunning || !this.analyser || !this.pitchyDetector || !this.inputBuffer) return null;

        // Get time domain data
        this.analyser.getFloatTimeDomainData(this.inputBuffer);

        // Calculate RMS
        const rms = Math.sqrt(this.inputBuffer.reduce((acc, val) => acc + val * val, 0) / this.inputBuffer.length);

        // Get frequency data for visualization
        const frequencyData = new Float32Array(this.analyser.frequencyBinCount);
        this.analyser.getFloatFrequencyData(frequencyData);

        // Only process if we have enough signal
        if (rms < 0.005) {
            // Only log weak signal in debug mode and at a reduced frequency
            if (this.debugMode && Math.random() < 0.01) { // Log only ~1% of weak signals
                this.log('📊 Signal below threshold:', rms.toFixed(4));
            }
            return {
                frequency: 0,
                note: '',
                octave: 0,
                cents: 0,
                confidence: 0,
                rms,
                frequencyData
            };
        }

        // Use Pitchy to detect the pitch
        const [pitch, clarity] = this.pitchyDetector.findPitch(this.inputBuffer, this.sampleRate);

        // Log the RMS value if it's significant and in debug mode
        if (this.debugMode && rms > 0.01) {
            this.log('📊 Buffer RMS:', rms.toFixed(4));
        }

        // Return the result even if clarity is low, let the consumer decide the threshold
        if (pitch >= this.minFreq && pitch <= this.maxFreq) {
            const noteInfo = this.frequencyToNote(pitch);

            if (this.debugMode) {
                this.log('🎵 Detected:', noteInfo.note + noteInfo.octave,
                    `(${Math.round(pitch)}Hz)`,
                    `Clarity: ${clarity.toFixed(2)}`,
                    `Cents: ${noteInfo.cents}`);
            }

            return {
                frequency: pitch,
                ...noteInfo,
                confidence: clarity,
                rms,
                frequencyData
            };
        }

        return {
            frequency: 0,
            note: '',
            octave: 0,
            cents: 0,
            confidence: 0,
            rms,
            frequencyData
        };
    }

    setDebugMode(enabled: boolean) {
        this.debugMode = enabled;
        this.log('🐛 Debug mode ' + (enabled ? 'enabled' : 'disabled') + ' 🐛');
    }
}
