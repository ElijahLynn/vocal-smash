// DOM Elements
const visualizer = document.getElementById('visualizer');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const volumeMeterFill = document.getElementById('volumeMeterFill');
const volumeMeterText = document.getElementById('volumeMeterText');

// Waterfall Controls
const waterfallHeight = document.getElementById('waterfallHeight');
const waterfallSpeed = document.getElementById('waterfallSpeed');
const scaleY = document.getElementById('scaleY');
const presetEffect = document.getElementById('presetEffect');

// Verify required DOM elements are found
if (!visualizer || !startButton || !stopButton || !volumeMeterFill || !volumeMeterText) {
    console.error('Missing required DOM elements:', {
        visualizer, startButton, stopButton, volumeMeterFill, volumeMeterText
    });
    throw new Error('Required DOM elements not found');
}

let source = null;
let stream = null;
let analyser = null;
let animationFrame = null;

// Waterfall presets
const presets = {
    minimal: {
        waterfall: 0,
        speed: 1,
        scaleY: 100,
        brightness: 40,
        bar: 25,
        bass: -25
    },
    matrix: {
        waterfall: 80,
        speed: 8,
        scaleY: 70,
        brightness: 35,
        bar: 5,
        bass: -40
    },
    smooth: {
        waterfall: 40,
        speed: 2,
        scaleY: 100,
        brightness: 30,
        bar: 15,
        bass: -35
    },
    reactive: {
        waterfall: 15,
        speed: 6,
        scaleY: 90,
        brightness: 50,
        bar: 20,
        bass: -30
    }
};

// Default settings - use minimal preset as default
const defaultSettings = { ...presets.minimal };

// Load settings from localStorage or use defaults
let currentSettings = loadSettings();

// Load settings from localStorage
function loadSettings() {
    // Always return minimal preset for now
    return { ...presets.minimal };
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem('vocalSmashSettings', JSON.stringify(currentSettings));
    } catch (error) {
        console.warn('Error saving settings:', error);
    }
}

// Update value displays
function updateValueDisplay(input) {
    const display = input.parentElement.querySelector('.value-display');
    if (display) {
        const suffix = input.id === 'waterfallSpeed' ? 'x' : '%';
        display.textContent = `${input.value}${suffix}`;
    }
}

// Apply waterfall settings
function applyWaterfallSettings(settings, updateInputs = true) {
    // Update current settings
    Object.assign(currentSettings, settings);

    // Only update input values if requested
    if (updateInputs) {
        waterfallHeight.value = settings.waterfall;
        waterfallSpeed.value = settings.speed;
        scaleY.value = settings.scaleY;

        // Update displays
        updateValueDisplay(waterfallHeight);
        updateValueDisplay(waterfallSpeed);
        updateValueDisplay(scaleY);
    }

    // Always apply to visualizer
    visualizer.setAttribute('data-waterfall', settings.waterfall);
    visualizer.setAttribute('data-speed', settings.speed);
    visualizer.setAttribute('data-scale-y', settings.scaleY);
    visualizer.setAttribute('data-brightness', settings.brightness);
    visualizer.setAttribute('data-bar', settings.bar);
    visualizer.setAttribute('data-bass', settings.bass);

    // Save settings
    saveSettings();
}

// Event listeners for controls
waterfallHeight.addEventListener('input', (e) => {
    currentSettings.waterfall = parseInt(e.target.value);
    visualizer.setAttribute('data-waterfall', e.target.value);
    updateValueDisplay(e.target);
    saveSettings();
});

waterfallSpeed.addEventListener('input', (e) => {
    currentSettings.speed = parseInt(e.target.value);
    visualizer.setAttribute('data-speed', e.target.value);
    updateValueDisplay(e.target);
    saveSettings();
});

scaleY.addEventListener('input', (e) => {
    currentSettings.scaleY = parseInt(e.target.value);
    visualizer.setAttribute('data-scale-y', e.target.value);
    updateValueDisplay(e.target);
    saveSettings();
});

presetEffect.addEventListener('change', (e) => {
    const preset = presets[e.target.value];
    if (preset) {
        applyWaterfallSettings(preset);
    }
});

function stop() {
    if (source) {
        source.disconnect();
        source = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    // Reset volume meter
    volumeMeterFill.style.width = '0%';
    volumeMeterText.textContent = '-∞ dB';

    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.textContent = 'Start Listening';
}

function updateVolumeMeter() {
    if (!analyser || !source) return;

    const dataArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate RMS value
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);

    // Convert to dB
    const db = 20 * Math.log10(Math.max(rms, 1e-10));

    // Map dB to percentage (typical range: -60dB to 0dB)
    const percent = Math.max(0, Math.min(100, (db + 60) * 1.67));

    // Update volume meter
    volumeMeterFill.style.width = `${percent}%`;
    volumeMeterText.textContent = `${db.toFixed(1)} dB`;

    // Continue animation
    animationFrame = requestAnimationFrame(updateVolumeMeter);
}

async function start() {
    try {
        startButton.disabled = true;
        stopButton.disabled = false;
        startButton.textContent = 'Starting...';

        // ensure audio context is running
        if (!visualizer.audio_context) {
            throw new Error('Audio context not initialized');
        }

        if (visualizer.audio_context.state === 'suspended') {
            await visualizer.audio_context.resume();
        }

        // Get microphone stream with disabled audio processing
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                channelCount: 1
            }
        });

        // Create media stream source using visualizer's audio context
        source = visualizer.audio_context.createMediaStreamSource(stream);

        // Create analyzer node for volume meter
        analyser = visualizer.audio_context.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        // Connect to visualizer's audio input
        source.connect(visualizer.audio_input);

        // Apply current settings without updating input values
        applyWaterfallSettings(currentSettings, false);

        // Start volume meter animation
        updateVolumeMeter();

        startButton.textContent = 'Listening...';
    } catch (error) {
        console.error('Error:', error);
        stop();

        // Show more helpful error message for permission denials
        if (error.name === 'NotAllowedError') {
            startButton.textContent = 'Microphone access denied';
        } else {
            startButton.textContent = 'Error - Try again';
        }
    }
}

// Wait for user interaction
startButton.addEventListener('click', () => {
    start().catch(error => {
        console.error('Error:', error);
        stop();
    });
});

stopButton.addEventListener('click', stop);

// Initialize displays and apply saved settings
updateValueDisplay(waterfallHeight);
updateValueDisplay(waterfallSpeed);
updateValueDisplay(scaleY);
applyWaterfallSettings(currentSettings);
