import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import Title from '../../../components/Body/Title.jsx';

describe('Title', () => {
    it('renders nothing when isMuted is true', () => {
        const { container } = renderWithStore(
            <Title channelName="lofi" />,
            { preloadedState: { audioPlayer: { isMuted: true } } }
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders the channel name when unmuted', () => {
        renderWithStore(
            <Title channelName="lofi" />,
            { preloadedState: { audioPlayer: { isMuted: false } } }
        );
        expect(screen.getByText('lofi')).toBeInTheDocument();
    });

    it('replaces hyphens with spaces in the channel name', () => {
        renderWithStore(
            <Title channelName="lo-fi-music" />,
            { preloadedState: { audioPlayer: { isMuted: false } } }
        );
        expect(screen.getByText('lo fi music')).toBeInTheDocument();
    });
});
