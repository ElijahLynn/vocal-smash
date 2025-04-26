import React from 'react';
import { render, screen } from '@testing-library/react';
import { PitchHistory } from '../../src/ui/components/PitchHistory';

describe('PitchHistory', () => {
    const mockHistory = [
        {
            frequency: 440,
            note: 'A',
            octave: 4,
            cents: 0,
            confidence: 0.95,
        },
        {
            frequency: 442,
            note: 'A',
            octave: 4,
            cents: 10,
            confidence: 0.95,
        },
        {
            frequency: 438,
            note: 'A',
            octave: 4,
            cents: -10,
            confidence: 0.95,
        },
    ];

    it('should render the pitch history graph', () => {
        render(<PitchHistory history={mockHistory} />);
        expect(screen.getByText('+50¢')).toBeInTheDocument();
        expect(screen.getByText('0¢')).toBeInTheDocument();
        expect(screen.getByText('-50¢')).toBeInTheDocument();
    });

    it('should render the correct number of history points', () => {
        const { container } = render(<PitchHistory history={mockHistory} />);
        const historyPoints = container.querySelectorAll('.absolute.w-1.rounded-full');
        expect(historyPoints).toHaveLength(mockHistory.length);
    });

    it('should render an empty graph when history is empty', () => {
        const { container } = render(<PitchHistory history={[]} />);
        const historyPoints = container.querySelectorAll('.absolute.w-1.rounded-full');
        expect(historyPoints).toHaveLength(0);
    });

    it('should apply the correct color classes based on cents deviation', () => {
        const { container } = render(<PitchHistory history={mockHistory} />);
        const historyPoints = container.querySelectorAll('.absolute.w-1.rounded-full');

        // Perfect pitch point (0 cents)
        expect(historyPoints[0]).toHaveClass('bg-pitch-perfect');

        // Sharp point (10 cents)
        expect(historyPoints[1]).toHaveClass('bg-pitch-sharp');

        // Flat point (-10 cents)
        expect(historyPoints[2]).toHaveClass('bg-pitch-flat');
    });
});
