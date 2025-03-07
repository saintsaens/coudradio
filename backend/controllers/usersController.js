import * as usersService from "../services/usersService.js";
import { computeTimeSpent } from "../utils/durations.js";

export const createUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const newUser = await usersService.createUser(username, password);
        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role, sessionStartTime, lastActivity } = req.body;

    if (!username && !password && !role && !sessionStartTime && !lastActivity) {
        return res.status(400).json({ error: "At least one field must be provided" });
    }

    try {
        const updatedUser = await usersService.updateUser(id, { username, password, role, sessionStartTime, lastActivity });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUserActivity = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            // Get user data from the current session
            const userId = req.user.id;
            const sessionStartTime = req.user.sessionStartTime;

            // Compute new values for activity and time spent
            const lastActivityTime = new Date();
            const newTimeSpent = computeTimeSpent(sessionStartTime, lastActivityTime);

            // Update session data
            req.user.lastActivity = lastActivityTime;
            const totalTimeSpent = req.user.timeSpent + newTimeSpent;
            req.user.timeSpent = totalTimeSpent;

            // Update database as well (persist the change)
            const updatedUser = await usersService.updateUser(userId, { lastActivityTime, timeSpent: totalTimeSpent});
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.status(200).json({ message: "User activity updated successfully", user: updatedUser });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    else {
        return res.status(401).json({ err: "Not logged in" });
    }
};

export const updateSessionStartTime = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userId = req.user.id;

            // Compute new valeus for session start time and last activity
            const lastActivityTime = new Date();
            const sessionStartTime = lastActivityTime;
            
            // Update session data
            req.user.lastActivity = lastActivityTime;
            req.user.sessionStartTime = sessionStartTime;
            
            // Update database as well (persist the change)
            const updatedUser = usersService.updateUser(userId, { sessionStartTime, lastActivityTime });
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json({ message: "User activity updated successfully", user: updatedUser });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    else {
        return res.status(401).json({ err: "Not logged in" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await usersService.deleteUser(id);

        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await usersService.getUserById(id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
