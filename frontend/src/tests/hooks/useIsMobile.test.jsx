import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useIsMobile from '../../hooks/useIsMobile.js';

const originalUserAgent = navigator.userAgent;

afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
    });
});

const setUserAgent = (ua) => {
    Object.defineProperty(navigator, 'userAgent', {
        value: ua,
        configurable: true,
    });
};

describe('useIsMobile', () => {
    it('returns true for an iPhone user agent', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('returns false for a desktop Windows user agent', () => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('returns false for a desktop Mac user agent', () => {
        setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('returns true for an Android user agent', () => {
        setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36');
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });
});
