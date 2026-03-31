import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Unavailable from '../../components/Unavailable.jsx';

const desktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const originalUserAgent = navigator.userAgent;

const setUserAgent = (ua) => {
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
};

afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
    vi.restoreAllMocks();
});

describe('Unavailable — desktop', () => {
    it('renders R: retry text', () => {
        setUserAgent(desktopUA);
        render(<Unavailable onRetry={vi.fn()} />);
        expect(screen.getByText('R: retry')).toBeInTheDocument();
    });

    it('calls onRetry when R key is pressed', () => {
        setUserAgent(desktopUA);
        const onRetry = vi.fn();
        render(<Unavailable onRetry={onRetry} />);
        fireEvent.keyDown(document, { key: 'r' });
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('does not call onRetry for other keys', () => {
        setUserAgent(desktopUA);
        const onRetry = vi.fn();
        render(<Unavailable onRetry={onRetry} />);
        fireEvent.keyDown(document, { key: 'x' });
        expect(onRetry).not.toHaveBeenCalled();
    });

    it('does not crash when onRetry is undefined', () => {
        setUserAgent(desktopUA);
        render(<Unavailable />);
        expect(() => fireEvent.keyDown(document, { key: 'r' })).not.toThrow();
    });
});

describe('Unavailable — mobile', () => {
    it('renders Tap to retry text', () => {
        setUserAgent(mobileUA);
        render(<Unavailable onRetry={vi.fn()} />);
        expect(screen.getByText('Tap to retry')).toBeInTheDocument();
    });

    it('calls onRetry when the overlay is clicked', () => {
        setUserAgent(mobileUA);
        const onRetry = vi.fn();
        render(<Unavailable onRetry={onRetry} />);
        // Click on the overlay element (the FullOverlay)
        fireEvent.click(screen.getByText('Tap to retry').closest('[style*="position: fixed"], div'));
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
