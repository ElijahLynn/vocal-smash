import { useState, useEffect, useCallback } from 'react';

export enum PermissionStatus {
    GRANTED = 'granted',
    DENIED = 'denied',
    PROMPT = 'prompt',
}

export function useAudioPermission() {
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(PermissionStatus.PROMPT);
    const [error, setError] = useState<string | null>(null);

    const checkPermission = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Audio input is not supported in this browser.');
            }

            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setPermissionStatus(permission.state as PermissionStatus);

            permission.addEventListener('change', () => {
                setPermissionStatus(permission.state as PermissionStatus);
            });
        } catch (err) {
            console.error('Error checking audio permission:', err);
            setError('Failed to check microphone permissions.');
            setPermissionStatus(PermissionStatus.DENIED);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });
            stream.getTracks().forEach(track => track.stop());
            setPermissionStatus(PermissionStatus.GRANTED);
            return true;
        } catch (err) {
            console.error('Error requesting audio permission:', err);
            setError('Failed to access microphone. Please check permissions.');
            setPermissionStatus(PermissionStatus.DENIED);
            return false;
        }
    }, []);

    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    return {
        permissionStatus,
        error,
        requestPermission,
        checkPermission,
        isGranted: permissionStatus === PermissionStatus.GRANTED,
        isDenied: permissionStatus === PermissionStatus.DENIED,
        needsPrompt: permissionStatus === PermissionStatus.PROMPT,
    };
}
