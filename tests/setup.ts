import '@testing-library/jest-dom';

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

// Mock navigator.permissions
const mockPermissions = {
    query: jest.fn().mockResolvedValue({
        state: 'prompt',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }),
};

// Setup global mocks
global.AudioContext = MockAudioContext as any;
global.navigator.mediaDevices = mockMediaDevices as any;
global.navigator.permissions = mockPermissions as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(() => callback(Date.now()), 0);
};

global.cancelAnimationFrame = (handle: number): void => {
    clearTimeout(handle);
};

// Mock ResizeObserver
class MockResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

global.IntersectionObserver = MockIntersectionObserver;
