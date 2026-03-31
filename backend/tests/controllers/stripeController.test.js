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
        vi.clearAllMocks();
        req = { body: {}, headers: {} };
        res = {
            send: vi.fn(),
            sendStatus: vi.fn(),
        };
    });

    it('returns 500 when STRIPE_WEBHOOK_SIGNING_SECRET is not set', async () => {
        await webhook(req, res);

        expect(res.sendStatus).toHaveBeenCalledWith(500);
        expect(stripeService.handleSuccessfulSessionCheckout).not.toHaveBeenCalled();
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

    it('sends 200 for unknown event types without calling any service', async () => {
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'test-secret';
        const constructedEvent = { type: 'refund.created', data: { object: {} } };
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(constructedEvent);
        req.headers['stripe-signature'] = 'valid-sig';
        req.body = 'raw-body';

        await webhook(req, res);

        expect(stripeService.handleSuccessfulSessionCheckout).not.toHaveBeenCalled();
        expect(stripeService.handleSubscriptionCancellation).not.toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
    });

    it('calls handleSuccessfulSessionCheckout with userId and stripeCustomerId on checkout.session.completed', async () => {
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'test-secret';
        const constructedEvent = {
            type: 'checkout.session.completed',
            data: { object: { client_reference_id: '7', customer: 'cus_123' } },
        };
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(constructedEvent);
        vi.mocked(stripeService.handleSuccessfulSessionCheckout).mockResolvedValue({});
        req.headers['stripe-signature'] = 'valid-sig';

        await webhook(req, res);

        expect(stripeService.handleSuccessfulSessionCheckout).toHaveBeenCalledWith('7', 'cus_123');
        expect(res.send).toHaveBeenCalled();
    });

    it('calls handleSubscriptionCancellation with stripeCustomerId on customer.subscription.deleted', async () => {
        process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'test-secret';
        const constructedEvent = {
            type: 'customer.subscription.deleted',
            data: { object: { customer: 'cus_abc' } },
        };
        vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(constructedEvent);
        vi.mocked(stripeService.handleSubscriptionCancellation).mockResolvedValue({});
        req.headers['stripe-signature'] = 'valid-sig';

        await webhook(req, res);

        expect(stripeService.handleSubscriptionCancellation).toHaveBeenCalledWith('cus_abc');
        expect(res.send).toHaveBeenCalled();
    });
});
