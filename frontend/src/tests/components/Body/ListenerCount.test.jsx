import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import ListenerCount from '../../../components/Body/ListenerCount.jsx';

const render = (isMuted, authenticated, anonymous) =>
    renderWithStore(<ListenerCount />, {
        preloadedState: {
            audioPlayer: { isMuted },
            listeners: { authenticated, anonymous },
        },
    });

describe('ListenerCount', () => {
    it('renders nothing when isMuted is true', () => {
        const { container } = render(true, 5, 3);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when both counts are 0', () => {
        const { container } = render(false, 0, 0);
        expect(container.firstChild).toBeNull();
    });

    it('shows singular listener when authenticated is 1', () => {
        render(false, 1, 0);
        expect(screen.getByText('1 listener')).toBeInTheDocument();
    });

    it('shows plural listeners and anonymous when both non-zero', () => {
        render(false, 2, 3);
        expect(screen.getByText('2 listeners • 3 anonymous')).toBeInTheDocument();
    });

    it('shows only anonymous when authenticated is 0', () => {
        render(false, 0, 5);
        expect(screen.getByText('5 anonymous')).toBeInTheDocument();
    });

    it('shows only listeners count when anonymous is 0', () => {
        render(false, 4, 0);
        expect(screen.getByText('4 listeners')).toBeInTheDocument();
    });
});
