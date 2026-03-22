import { describe, it, expect, vi } from 'vitest';
import * as usersRepository from '../../repositories/usersRepository.js';
import { handleSuccessfulSessionCheckout } from '../../services/stripeService.js';

vi.mock('../../repositories/usersRepository.js');

describe('handleSuccessfulSessionCheckout', () => {
    it('sets subscribed to true for the user and returns the updated user', async () => {
        const mockUpdatedUser = { id: 42, username: 'testuser', subscribed: true };
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUpdatedUser);

        const result = await handleSuccessfulSessionCheckout(42);

        expect(usersRepository.updateUser).toHaveBeenCalledWith(42, { subscribed: true });
        expect(result).toEqual(mockUpdatedUser);
    });

    it('propagates repository errors', async () => {
        vi.mocked(usersRepository.updateUser).mockRejectedValue(new Error('DB error'));

        await expect(handleSuccessfulSessionCheckout(42)).rejects.toThrow('DB error');
    });
});
