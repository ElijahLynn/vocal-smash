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
        if (this.isRunning) return;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });

            if (!this.audioContext) {
                await this.initializeAudioContext();
            }

            this.source = this.audioContext!.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext!.createAnalyser();
            this.analyser.fftSize = this.bufferSize;
            this.analyser.smoothingTimeConstant = 0.8;

            this.source.connect(this.analyser);
            this.isRunning = true;
        } catch (error) {
            console.error('Failed to start audio capture:', error);
            throw error;
        }
    }

    stop(): void {
        if (!this.isRunning) return;

        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.source?.disconnect();
        this.analyser?.disconnect();
        this.isRunning = false;
    }

    analyze(): PitchDetectionResult | null {
        if (!this.isRunning || !this.analyser) return null;

        const buffer = new Float32Array(this.analyser.frequencyBinCount);
        this.analyser.getFloatTimeDomainData(buffer);

        const result = this.detectPitch(buffer);
        if (!result) return null;

        return {
            ...result,
            ...this.frequencyToNote(result.frequency),
        };
    }

    private detectPitch(buffer: Float32Array): { frequency: number; confidence: number } | null {
        // Implement autocorrelation-based pitch detection
        const correlations = new Float32Array(buffer.length / 2);
        let maxCorrelation = 0;
        let maxLag = 0;

        for (let lag = 0; lag < correlations.length; lag++) {
            let correlation = 0;
            for (let i = 0; i < correlations.length; i++) {
                correlation += buffer[i] * buffer[i + lag];
            }
            correlations[lag] = correlation;

            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                maxLag = lag;
            }
        }

        const frequency = this.sampleRate / maxLag;
        const confidence = maxCorrelation / correlations[0];

        // Filter out unreliable results - adjusted for human vocal range
        if (frequency < 80 || frequency > 1100 || confidence < 0.3) { // Human vocal range: ~80Hz (E2) to ~1100Hz (C6)
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
