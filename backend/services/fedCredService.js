import * as usersService from "./usersService.js"
import * as fedCredRepository from "../repositories/fedCredRepository.js"

export const createGoogleCredential = async (profile) => {
    if (!profile?.name?.givenName) {
        throw new Error("Invalid Google profile: Missing given name");
    }
    if (!profile?.emails?.[0]?.value) {
        throw new Error("Invalid Google profile: Missing email");
    }
    const username = profile.name.givenName;
    const email = profile.emails[0].value;

    let newUser;
    try {
        newUser = await usersService.createUserWithoutPassword(username, email);
        if (!newUser) {
            throw new Error(`User creation failed for ${username}`);
        }
    } catch (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }

    // Then store federated credentials
    const userId = newUser.id;
    const provider = "Google";
    const subject = profile.id;
    try {
        const result = await fedCredRepository.createFederatedCredential(userId, provider, subject);
        return result;
    } catch (error) {
        throw new Error(`Failed to store federated credentials: ${error.message}`);
    }
};

export const getGoogleCredential = async (profile) => {
    const provider = "Google"
    const subject = profile.id;
    const result = await fedCredRepository.getFederatedCredential(provider, subject);

    return result;
};
