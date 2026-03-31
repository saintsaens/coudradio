import * as usersRepository from "../repositories/usersRepository.js"

export const handleSuccessfulSessionCheckout = async (userId, stripeCustomerId) => {
    const result = await usersRepository.updateUser(userId, { subscribed: true, stripeCustomerId });
    return result;
};

export const handleSubscriptionCancellation = async (stripeCustomerId) => {
    const user = await usersRepository.getUserByStripeCustomerId(stripeCustomerId);
    if (!user) {
        console.warn(`No user found for Stripe customer ${stripeCustomerId}`);
        return null;
    }
    const result = await usersRepository.updateUser(user.id, { subscribed: false });
    return result;
};
