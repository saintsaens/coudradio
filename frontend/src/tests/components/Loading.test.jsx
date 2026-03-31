import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Loading from '../../components/Loading.jsx';
import { renderWithStore } from '../testUtils.jsx';

describe('Loading', () => {
    it('renders a progress bar', () => {
        renderWithStore(<Loading />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('reflects loadingProgress from the store', () => {
        renderWithStore(<Loading />, { preloadedState: { audioPlayer: { loadingProgress: 60 } } });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    });
});
