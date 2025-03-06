import * as usersRepository from "../repositories/usersRepository.js"

export const handleSuccessfulSessionCheckout = async (userId) => {
    const subscribed = true;
    const result = await usersRepository.updateUser(userId, { subscribed });

    return result;
};
