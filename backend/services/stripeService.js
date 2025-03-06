import * as usersRepository from "../repositories/usersRepository.js"

export const handleSuccessfulSessionCheckout = async (userId) => {
    // Check if user exists in db
    // If not, throw error
    // If user exists, update user role to subscriber
    const result = await usersRepository.updateUser(id, { role });

    return result;
};