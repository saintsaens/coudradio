import { handleSuccessfulSessionCheckout, handleSubscriptionCancellation } from "../services/stripeService.js";
import stripe from "../stripe/index.js";

export const webhook = async (request, response) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
    if (!endpointSecret) {
        console.error('STRIPE_WEBHOOK_SIGNING_SECRET is not set');
        return response.sendStatus(500);
    }

    const signature = request.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.body, signature, endpointSecret);
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.client_reference_id;
            const stripeCustomerId = session.customer;
            console.log(`User ${userId} paid successfully!`);
            await handleSuccessfulSessionCheckout(userId, stripeCustomerId);
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const stripeCustomerId = subscription.customer;
            console.log(`Subscription cancelled for Stripe customer ${stripeCustomerId}`);
            await handleSubscriptionCancellation(stripeCustomerId);
            break;
        }
        default:
            // Unexpected event type
            console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
};
