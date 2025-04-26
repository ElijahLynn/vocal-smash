/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Natural notes color palette
                natural: {
                    primary: '#4F46E5', // Indigo for natural notes
                    hover: '#4338CA',
                    active: '#3730A3',
                },
                // Accidental notes color palette
                accidental: {
                    primary: '#6B7280', // Gray for accidental notes
                    hover: '#4B5563',
                    active: '#374151',
                },
                // Pitch detection feedback colors
                pitch: {
                    perfect: '#22C55E', // Green when perfectly in tune
                    sharp: '#EF4444',   // Red when sharp
                    flat: '#3B82F6',    // Blue when flat
                }
            },
            animation: {
                'pitch-pulse': 'pitch-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'pitch-pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
