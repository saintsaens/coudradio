import { describe, it, expect, vi } from 'vitest';
import * as usersRepository from '../../repositories/usersRepository.js';
import { handleSuccessfulSessionCheckout, handleSubscriptionCancellation } from '../../services/stripeService.js';

vi.mock('../../repositories/usersRepository.js');

describe('handleSuccessfulSessionCheckout', () => {
    it('sets subscribed to true and stores the Stripe customer ID', async () => {
        const mockUpdatedUser = { id: 42, username: 'testuser', subscribed: true, stripe_customer_id: 'cus_123' };
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUpdatedUser);

        const result = await handleSuccessfulSessionCheckout(42, 'cus_123');

        expect(usersRepository.updateUser).toHaveBeenCalledWith(42, { subscribed: true, stripeCustomerId: 'cus_123' });
        expect(result).toEqual(mockUpdatedUser);
    });

    it('propagates repository errors', async () => {
        vi.mocked(usersRepository.updateUser).mockRejectedValue(new Error('DB error'));

        await expect(handleSuccessfulSessionCheckout(42, 'cus_123')).rejects.toThrow('DB error');
    });
});

describe('handleSubscriptionCancellation', () => {
    it('sets subscribed to false for the matching user', async () => {
        const mockUser = { id: 7, username: 'bob', subscribed: true, stripe_customer_id: 'cus_abc' };
        const mockUpdatedUser = { ...mockUser, subscribed: false };
        vi.mocked(usersRepository.getUserByStripeCustomerId).mockResolvedValue(mockUser);
        vi.mocked(usersRepository.updateUser).mockResolvedValue(mockUpdatedUser);

        const result = await handleSubscriptionCancellation('cus_abc');

        expect(usersRepository.getUserByStripeCustomerId).toHaveBeenCalledWith('cus_abc');
        expect(usersRepository.updateUser).toHaveBeenCalledWith(7, { subscribed: false });
        expect(result).toEqual(mockUpdatedUser);
    });

    it('returns null when no user matches the Stripe customer ID', async () => {
        vi.mocked(usersRepository.getUserByStripeCustomerId).mockResolvedValue(null);

        const result = await handleSubscriptionCancellation('cus_unknown');

        expect(usersRepository.updateUser).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('propagates repository errors', async () => {
        vi.mocked(usersRepository.getUserByStripeCustomerId).mockRejectedValue(new Error('DB error'));

        await expect(handleSubscriptionCancellation('cus_abc')).rejects.toThrow('DB error');
    });
});
