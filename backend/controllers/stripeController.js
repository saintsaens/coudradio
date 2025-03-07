import { handleSuccessfulSessionCheckout } from "../services/stripeService.js";
import stripe from "../stripe/index.js";

export const webhook = async (request, response) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;
    let event = request.body;

    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.client_reference_id;
            console.log(`User ${userId} paid successfully!`);
            handleSuccessfulSessionCheckout(request, userId);
            break;
        default:
            // Unexpected event type
            console.log(`Unhandled event type ${event.type}.`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
};
