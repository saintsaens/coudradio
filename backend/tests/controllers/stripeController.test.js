import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stripeService from '../../services/stripeService.js';
import stripe from '../../stripe/index.js';
import { webhook } from '../../controllers/stripeController.js';

vi.mock('../../services/stripeService.js');
vi.mock('../../stripe/index.js', () => ({
    default: {
        webhooks: { constructEvent: vi.fn() },
    },
}));

describe('webhook', () => {
    let req, res;

    beforeEach(() => {
        delete process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
        req = { body: {}, headers: {} };
        res = {
            send: vi.fn(),
            sendStatus: vi.fn(),
        };
    });

    it('handles checkout.session.completed without a signing secret', async () => {
        req.body = {
            type: 'checkout.session.completed',
            data: { object: { client_reference_id: '42' } },
        };

        await webhook(req, res);

        expect(stripeService.handleSuccessfulSessionCheckout).toHaveBeenCalledWith('42');
        expect(res.send).toHaveBeenCalled();
    });

    it('constructs the event when a signing secret is present and the signature is valid', async () => {
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'test-secret';
        const constructedEvent = { type: 'payment_intent.succeeded', data: { object: {} } };
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(constructedEvent);
        req.headers['stripe-signature'] = 'valid-sig';
        req.body = 'raw-body';

        await webhook(req, res);

        expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith('raw-body', 'valid-sig', 'test-secret');
        expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 when signature verification fails', async () => {
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'test-secret';
        vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
            throw new Error('Invalid signature');
        });
        req.headers['stripe-signature'] = 'bad-sig';

        await webhook(req, res);

        expect(res.sendStatus).toHaveBeenCalledWith(400);
    });

    it('sends 200 for unknown event types without calling handleSuccessfulSessionCheckout', async () => {
        req.body = { type: 'refund.created', data: { object: {} } };

        await webhook(req, res);

        expect(stripeService.handleSuccessfulSessionCheckout).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
    });
});
