import * as usersService from "../services/usersService.js";
import { computeTimeSpent } from "../utils/durations.js";

export const updateUserActivity = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            // Get user data from the current session
            const userId = req.user.id;

            // Use lastActivity as the reference point
            const lastActivityTime = new Date();
            const lastRecordedActivity = req.user.lastActivity || lastActivityTime; // Fallback to now if undefined

            // Compute only the delta since last activity
            const deltaTime = computeTimeSpent(lastRecordedActivity, lastActivityTime);

            // Update session data
            req.user.lastActivity = lastActivityTime;
            req.user.timeSpent = (req.user.timeSpent || 0) + deltaTime;


            // Persist changes to database
            const updatedUser = await usersService.updateUser(userId, {
                lastActivityTime,
                timeSpent: req.user.timeSpent
            });

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.status(200).json({
                message: "User activity updated successfully",
                user: updatedUser
            });
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
            const updatedUser = await usersService.updateUser(userId, { sessionStartTime, lastActivityTime });
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

export const getListeners = async (req, res) => {
    try {
        const counts = await usersService.getListenerCounts();
        return res.status(200).json(counts);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserRank = async (req, res) => {
    const { id } = req.params;

    try {
        // const userId = req.user.id;
        const result = await usersService.getUserRankAndTotal(id);

        return res.status(200).json({
            rank: result.rank,
            total: result.total
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};