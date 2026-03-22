import * as usersService from "../services/usersService.js";
import { computeTimeSpent } from "../utils/durations.js";

export const updateUserActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const lastActivityTime = new Date();
        const lastRecordedActivity = req.user.lastActivity || lastActivityTime;
        const deltaTime = computeTimeSpent(lastRecordedActivity, lastActivityTime);

        req.user.lastActivity = lastActivityTime;
        req.user.timeSpent = (req.user.timeSpent || 0) + deltaTime;

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
};

export const updateSessionStartTime = async (req, res) => {
    try {
        const userId = req.user.id;
        const lastActivityTime = new Date();
        const sessionStartTime = lastActivityTime;

        req.user.lastActivity = lastActivityTime;
        req.user.sessionStartTime = sessionStartTime;

        const updatedUser = await usersService.updateUser(userId, { sessionStartTime, lastActivityTime });
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ message: "User activity updated successfully", user: updatedUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
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