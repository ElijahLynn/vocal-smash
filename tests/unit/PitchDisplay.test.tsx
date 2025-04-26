import React from 'react';
import { render, screen } from '@testing-library/react';
import { PitchDisplay } from '../../src/ui/components/PitchDisplay';

describe('PitchDisplay', () => {
    const mockPitchData = {
        frequency: 440,
        note: 'A',
        octave: 4,
        cents: 0,
        confidence: 0.95,
    };

    it('should display the correct note and octave', () => {
        render(<PitchDisplay pitchData={mockPitchData} isRecording={true} />);
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should show "Listening..." when recording but no pitch detected', () => {
        render(<PitchDisplay pitchData={null} isRecording={true} />);
        expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    it('should show "Press Start to begin" when not recording', () => {
        render(<PitchDisplay pitchData={null} isRecording={false} />);
        expect(screen.getByText('Press Start to begin')).toBeInTheDocument();
    });

    it('should display frequency and cents information', () => {
        render(<PitchDisplay pitchData={mockPitchData} isRecording={true} />);
        expect(screen.getByText('440.0 Hz')).toBeInTheDocument();
        expect(screen.getByText('0 cents')).toBeInTheDocument();
    });

    it('should show sharp indicator when cents are positive', () => {
        const sharpPitch = { ...mockPitchData, cents: 10 };
        render(<PitchDisplay pitchData={sharpPitch} isRecording={true} />);
        expect(screen.getByText('+10 cents')).toBeInTheDocument();
    });

    it('should show flat indicator when cents are negative', () => {
        const flatPitch = { ...mockPitchData, cents: -10 };
        render(<PitchDisplay pitchData={flatPitch} isRecording={true} />);
        expect(screen.getByText('-10 cents')).toBeInTheDocument();
    });
});
