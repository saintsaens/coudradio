import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../../components/Loading.jsx';

describe('Loading', () => {
    it('shows channel name when provided', () => {
        render(<Loading channelName="lofi" />);
        expect(screen.getByText('Connecting to lofi…')).toBeInTheDocument();
    });

    it('shows generic message when channelName is undefined', () => {
        render(<Loading />);
        expect(screen.getByText('Connecting…')).toBeInTheDocument();
    });

    it('shows generic message when channelName is null', () => {
        render(<Loading channelName={null} />);
        expect(screen.getByText('Connecting…')).toBeInTheDocument();
    });
});
