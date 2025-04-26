import { renderHook, act } from '@testing-library/react';
import { useAudioPermission, PermissionStatus } from '../../src/ui/hooks/useAudioPermission';

describe('useAudioPermission', () => {
    const mockPermission = {
        state: 'prompt' as PermissionState,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    };

    beforeEach(() => {
        // Mock navigator.permissions.query
        Object.defineProperty(navigator, 'permissions', {
            value: {
                query: jest.fn().mockResolvedValue(mockPermission),
            },
            configurable: true,
        });

        // Mock navigator.mediaDevices
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getUserMedia: jest.fn().mockResolvedValue({
                    getTracks: () => [{
                        stop: jest.fn(),
                    }],
                }),
            },
            configurable: true,
        });
    });

    it('should initialize with PROMPT status', () => {
        const { result } = renderHook(() => useAudioPermission());
        expect(result.current.permissionStatus).toBe(PermissionStatus.PROMPT);
    });

    it('should check permissions on mount', async () => {
        renderHook(() => useAudioPermission());
        expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'microphone' });
    });

    it('should handle successful permission request', async () => {
        const { result } = renderHook(() => useAudioPermission());

        await act(async () => {
            const success = await result.current.requestPermission();
            expect(success).toBe(true);
        });

        expect(result.current.permissionStatus).toBe(PermissionStatus.GRANTED);
        expect(result.current.error).toBeNull();
    });

    it('should handle permission denial', async () => {
        // Mock getUserMedia to reject
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                getUserMedia: jest.fn().mockRejectedValue(new Error('Permission denied')),
            },
            configurable: true,
        });

        const { result } = renderHook(() => useAudioPermission());

        await act(async () => {
            const success = await result.current.requestPermission();
            expect(success).toBe(false);
        });

        expect(result.current.permissionStatus).toBe(PermissionStatus.DENIED);
        expect(result.current.error).toBe('Failed to access microphone. Please check permissions.');
    });

    it('should handle unsupported browsers', async () => {
        // Mock missing mediaDevices API
        Object.defineProperty(navigator, 'mediaDevices', {
            value: undefined,
            configurable: true,
        });

        const { result } = renderHook(() => useAudioPermission());

        expect(result.current.error).toBe('Failed to check microphone permissions.');
        expect(result.current.permissionStatus).toBe(PermissionStatus.DENIED);
    });

    it('should update status when permission state changes', async () => {
        let permissionChangeCallback: (event: { target: { state: PermissionState } }) => void;

        // Mock addEventListener to capture the callback
        mockPermission.addEventListener.mockImplementation((event, callback) => {
            if (event === 'change') {
                permissionChangeCallback = callback;
            }
        });

        const { result } = renderHook(() => useAudioPermission());

        // Simulate permission state change
        act(() => {
            permissionChangeCallback({ target: { state: 'granted' } });
        });

        expect(result.current.permissionStatus).toBe(PermissionStatus.GRANTED);
    });
});
