import { useCallback, useEffect, useState } from 'react';
import { Workbox, messageSW } from 'workbox-window';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        'beforeinstallprompt': BeforeInstallPromptEvent;
    }
}

export function useRegisterSW() {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (
            !('serviceWorker' in navigator) ||
            process.env.NODE_ENV !== 'production'
        ) {
            return;
        }

        const wb = new Workbox('/sw.js');

        // Add an event listener to detect when the service worker has installed
        wb.addEventListener('installed', (event) => {
            if (!event.isUpdate) {
                console.log('Service Worker installed for the first time!');
            }
        });

        // Add an event listener to detect when the registered service worker has updated
        wb.addEventListener('waiting', (event) => {
            setIsUpdateAvailable(true);
            setRegistration(event.sw.registration);
        });

        wb.register().catch((error) => {
            console.error('Service worker registration failed:', error);
        });

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const updateServiceWorker = useCallback(async () => {
        if (!registration?.waiting) {
            return;
        }

        try {
            await messageSW(registration.waiting, { type: 'SKIP_WAITING' });
            setIsUpdateAvailable(false);
            window.location.reload();
        } catch (error) {
            console.error('Failed to update service worker:', error);
        }
    }, [registration]);

    const promptInstall = useCallback(async () => {
        if (!installPrompt) {
            return;
        }

        try {
            await installPrompt.prompt();
            const result = await installPrompt.userChoice;
            if (result.outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } catch (error) {
            console.error('Failed to prompt for install:', error);
        }
    }, [installPrompt]);

    return {
        isUpdateAvailable,
        updateServiceWorker,
        canInstall: !!installPrompt,
        promptInstall,
    };
}
