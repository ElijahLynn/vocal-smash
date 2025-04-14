// DOM Elements
const visualizer = document.getElementById('visualizer');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

// Verify required DOM elements are found
if (!visualizer || !startButton || !stopButton) {
    console.error('Missing required DOM elements:', {
        visualizer, startButton, stopButton
    });
    throw new Error('Required DOM elements not found');
}

let source = null;
let stream = null;

function stop() {
    if (source) {
        source.disconnect();
        source = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.textContent = 'Start Listening';
}

async function start() {
    try {
        startButton.disabled = true;
        stopButton.disabled = false;
        startButton.textContent = 'Starting...';

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

        // Connect to visualizer's audio input
        source.connect(visualizer.audio_input);

        // Set visualization parameters for focused note display
        visualizer.setAttribute('data-waterfall', '20');    // Less waterfall for clearer current note
        visualizer.setAttribute('data-brightness', '45');   // Higher brightness for more contrast
        visualizer.setAttribute('data-bar', '10');         // Lower background frequencies
        visualizer.setAttribute('data-bass', '-45');       // Further reduce bass frequencies
        visualizer.setAttribute('data-speed', '4');        // Faster updates
        visualizer.setAttribute('data-scale-x', '15');     // Show fewer octaves (about 2-3)
        visualizer.setAttribute('data-scale-y', '100');    // Full height

        startButton.textContent = 'Listening...';
    } catch (error) {
        console.error('Error:', error);
        stop();
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
