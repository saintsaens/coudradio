import bcrypt from "bcrypt";
import * as usersRepository from "../repositories/usersRepository.js"

const saltRounds = 10;

export const createUser = async (username, password) => {
    if (!username || !password) {
        throw new Error("Username and password are required");
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
        subscribed
    );
    
    return result;
};

export const createUserWithoutPassword = async (username) => {
    if (!username) {
        throw new Error("Username is required");
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
        subscribed
    );

    return result;
};

export const getUserById = async (id) => {
    const result = await usersRepository.getUserById(id);

    return result;
};

export const updateUser = async (id, { username, password, role, sessionStartTime, lastActivityTime, timeSpent, subscribed }) => {
    const hashedPw = password ? await bcrypt.hash(password, saltRounds) : null;
    const result = await usersRepository.updateUser(id, { username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed });

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
