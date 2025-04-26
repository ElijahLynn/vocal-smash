export interface PitchDetectionResult {
    frequency: number;
    note: string;
    octave: number;
    cents: number;
    confidence: number;
}

export class PitchDetector {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private isRunning = false;
    private readonly bufferSize = 1024;
    private readonly sampleRate = 48000;

    constructor() {
        this.initializeAudioContext();
    }

    private async initializeAudioContext() {
        try {
            this.audioContext = new AudioContext({
                latencyHint: 'interactive',
                sampleRate: this.sampleRate,
            });
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            throw error;
        }
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Already running');
            return;
        }

        try {
            console.log('Requesting microphone access...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });
            console.log('Microphone access granted');

            if (!this.audioContext || this.audioContext.state === 'closed') {
                console.log('Initializing audio context...');
                await this.initializeAudioContext();
            }

            if (this.audioContext?.state === 'suspended') {
                console.log('Resuming audio context...');
                await this.audioContext.resume();
            }

            console.log('Creating audio nodes...');
            this.source = this.audioContext!.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext!.createAnalyser();
            this.analyser.fftSize = this.bufferSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.source.connect(this.analyser);
            this.isRunning = true;
            console.log('Pitch detector started successfully');
        } catch (error) {
            console.error('Failed to start audio capture:', error);
            this.stop();
            throw error;
        }
    }

    stop(): void {
        console.log('Stopping pitch detector...');
        if (!this.isRunning) {
            console.log('Already stopped');
            return;
        }

        this.mediaStream?.getTracks().forEach(track => {
            console.log('Stopping audio track:', track.label);
            track.stop();
        });
        this.source?.disconnect();
        this.analyser?.disconnect();
        this.isRunning = false;
        console.log('Pitch detector stopped');
    }

    analyze(): PitchDetectionResult | null {
        if (!this.isRunning || !this.analyser) {
            console.log('Cannot analyze: detector not running');
            return null;
        }

        const buffer = new Float32Array(this.analyser.frequencyBinCount);
        this.analyser.getFloatTimeDomainData(buffer);

        // Debug: Log buffer stats
        const rms = Math.sqrt(buffer.reduce((acc, val) => acc + val * val, 0) / buffer.length);
        console.log('Buffer RMS:', rms.toFixed(4));

        const result = this.detectPitch(buffer);
        if (!result) {
            return null;
        }

        console.log('Raw frequency:', result.frequency.toFixed(1), 'Hz, Confidence:', result.confidence.toFixed(3));
        const noteResult = this.frequencyToNote(result.frequency);
        console.log('Note:', noteResult.note + noteResult.octave, 'Cents:', noteResult.cents);

        return {
            ...result,
            ...noteResult,
        };
    }

    private detectPitch(buffer: Float32Array): { frequency: number; confidence: number } | null {
        // Check if there's enough signal
        const rms = Math.sqrt(buffer.reduce((acc, val) => acc + val * val, 0) / buffer.length);
        if (rms < 0.01) {
            console.log('Signal too weak, RMS:', rms);
            return null;
        }

        const correlations = new Float32Array(buffer.length / 2);
        let maxCorrelation = 0;
        let bestLag = 0;

        // Find the first peak after the first few samples
        const minLag = Math.floor(this.sampleRate / 1100); // Highest expected frequency
        const maxLag = Math.floor(this.sampleRate / 80);   // Lowest expected frequency

        for (let lag = minLag; lag < maxLag; lag++) {
            let correlation = 0;
            let norm = 0;

            for (let i = 0; i < correlations.length; i++) {
                correlation += buffer[i] * buffer[i + lag];
                norm += buffer[i] * buffer[i] + buffer[i + lag] * buffer[i + lag];
            }

            correlation = correlation / Math.sqrt(norm / 2);
            correlations[lag] = correlation;

            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                bestLag = lag;
            }
        }

        const frequency = this.sampleRate / bestLag;
        const confidence = maxCorrelation;

        // Filter out unreliable results - adjusted for human vocal range
        if (frequency < 80 || frequency > 1100 || confidence < 0.15) {
            console.log('Rejected result:', { frequency, confidence });
            return null;
        }

        return { frequency, confidence };
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
}
