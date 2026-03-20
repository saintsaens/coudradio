import bcrypt from "bcrypt";
import * as usersRepository from "../repositories/usersRepository.js"
import { getRecentConnectionCount } from "../loaders/connectionTracker.js"

const saltRounds = 10;

export const createUser = async (username, password, email) => {
    if (!username || !password || !email) {
        throw new Error("Username, password and email are required");
    }

    const hashedPw = await bcrypt.hash(password, saltRounds);
    const role = "user";
    const sessionStartTime = new Date();
    const lastActivityTime = sessionStartTime;
    const timeSpent = 0;
    const subscribed = false;
    
    const result = await usersRepository.createUser(
        username,
        hashedPw,
        role,
        sessionStartTime,
        lastActivityTime,
        timeSpent,
        subscribed,
        email
    );
    
    return result;
};

export const createUserWithoutPassword = async (username, email) => {
    if (!username || !email) {
        throw new Error("Username and email are required");
    }
    
    const hashedPw = null;
    const role = "user";
    const sessionStartTime = new Date();
    const lastActivityTime = sessionStartTime;
    const timeSpent = 0;
    const subscribed = false;
    
    const result = await usersRepository.createUser(
        username,
        hashedPw,
        role,
        sessionStartTime,
        lastActivityTime,
        timeSpent,
        subscribed,
        email
    );

    return result;
};

export const getUserById = async (id) => {
    const result = await usersRepository.getUserById(id);

    return result;
};

export const updateUser = async (id, { username, password, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email }) => {
    const hashedPw = password ? await bcrypt.hash(password, saltRounds) : null;
    const result = await usersRepository.updateUser(id, { username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email });

    return result;
};

export const addTimeSpent = async (id, timeToAdd) => {
    const result = await usersRepository.addTimeSpent(id, timeToAdd);

    return result;
};

export const deleteUser = async (id) => {
    const result = await usersRepository.deleteUser(id);

    return result;
};

export const getListenerCounts = async () => {
    const authenticated = await usersRepository.getActiveAuthenticatedCount();
    const total = getRecentConnectionCount();
    const anonymous = Math.max(0, total - authenticated);
    return { authenticated, anonymous };
};

export const getUserRankAndTotal = async (id) => {
    const result = await usersRepository.getUserRankAndTotal(id);
    if (!result) {
        throw new Error("User not found");
    }
    return result;
};