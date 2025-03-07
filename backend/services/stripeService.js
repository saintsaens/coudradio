import * as usersRepository from "../repositories/usersRepository.js"

export const handleSuccessfulSessionCheckout = async (req, userId) => {
    const subscribed = true;

    // Update user’s subscribed status in the session
    req.user.subscribed = subscribed;

    // Update user's subscribed status in the database (persist the change)
    const result = await usersRepository.updateUser(userId, { subscribed });

    return result;
};
