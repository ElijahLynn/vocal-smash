import { PitchDetector } from '../../src/audio/PitchDetector';

// Mock Web Audio API
class MockAudioContext {
    createAnalyser() {
        return {
            fftSize: 0,
            smoothingTimeConstant: 0,
            frequencyBinCount: 1024,
            getFloatTimeDomainData: (buffer: Float32Array) => {
                // Simulate a 440Hz sine wave
                for (let i = 0; i < buffer.length; i++) {
                    buffer[i] = Math.sin(2 * Math.PI * 440 * i / 48000);
                }
            },
            disconnect: jest.fn(),
        };
    }

    createMediaStreamSource() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
        };
    }
}

// Mock navigator.mediaDevices
const mockMediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{
            stop: jest.fn(),
        }],
    }),
};

// Setup global mocks
global.AudioContext = MockAudioContext as any;
global.navigator.mediaDevices = mockMediaDevices as any;

describe('PitchDetector', () => {
    let detector: PitchDetector;

    beforeEach(() => {
        detector = new PitchDetector();
    });

    afterEach(() => {
        detector.stop();
        jest.clearAllMocks();
    });

    it('should initialize without errors', () => {
        expect(detector).toBeTruthy();
    });

    it('should start and stop recording', async () => {
        await detector.start();
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });

        detector.stop();
    });

    it('should detect pitch near A4 (440Hz)', async () => {
        await detector.start();
        const result = detector.analyze();

        expect(result).toBeTruthy();
        if (result) {
            expect(result.note).toBe('A');
            expect(result.octave).toBe(4);
            expect(Math.abs(result.frequency - 440)).toBeLessThan(1);
            expect(Math.abs(result.cents)).toBeLessThan(10);
        }
    });
});
