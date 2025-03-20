import * as usersRepository from "../repositories/usersRepository.js"

export const handleSuccessfulSessionCheckout = async (userId) => {
    const subscribed = true;

    // Update user's subscribed status in the database (persist the change)
    const result = await usersRepository.updateUser(userId, { subscribed });

    return result;
};
