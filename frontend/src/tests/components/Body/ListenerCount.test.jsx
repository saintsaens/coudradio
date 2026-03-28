import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore } from '../../testUtils.jsx';
import ListenerCount from '../../../components/Body/ListenerCount.jsx';

const render = (authenticated, anonymous) =>
    renderWithStore(<ListenerCount />, {
        preloadedState: {
            listeners: { authenticated, anonymous },
        },
    });

describe('ListenerCount', () => {
    it('renders nothing when both counts are 0', () => {
        const { container } = render(0, 0);
        expect(container.firstChild).toBeNull();
    });

    it('shows singular listener with breakdown', () => {
        render(1, 0);
        expect(screen.getByText(/1 listener/)).toBeInTheDocument();
        expect(screen.getByText(/1 connected/)).toBeInTheDocument();
    });

    it('shows total with connected count, no anonymous', () => {
        render(2, 3);
        expect(screen.getByText(/5 listeners/)).toBeInTheDocument();
        expect(screen.getByText(/2 connected/)).toBeInTheDocument();
        expect(screen.queryByText(/anonymous/)).toBeNull();
    });

    it('shows 0 connected when authenticated is 0', () => {
        render(0, 5);
        expect(screen.getByText(/5 listeners/)).toBeInTheDocument();
        expect(screen.getByText(/0 connected/)).toBeInTheDocument();
    });

    it('shows total with connected count when anonymous is 0', () => {
        render(4, 0);
        expect(screen.getByText(/4 listeners/)).toBeInTheDocument();
        expect(screen.getByText(/4 connected/)).toBeInTheDocument();
    });
});
