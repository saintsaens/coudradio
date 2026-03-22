import * as usersService from "../services/usersService.js";
import { computeTimeSpent } from "../utils/durations.js";
import { upsertListeningTime } from "../repositories/usersRepository.js";

export const updateUserActivity = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { channel } = req.body;
        const lastActivityTime = new Date();
        const lastRecordedActivity = req.user.lastActivity || lastActivityTime;
        const deltaTime = computeTimeSpent(lastRecordedActivity, lastActivityTime);

        req.user.lastActivity = lastActivityTime;
        req.user.timeSpent = (req.user.timeSpent || 0) + deltaTime;

        // TODO: users.time_spent duplicates the SUM of listening_time.time_spent.
        // Consider dropping users.time_spent and computing the total from listening_time instead.
        const [updatedUser] = await Promise.all([
            usersService.updateUser(userId, {
                lastActivityTime,
                timeSpent: req.user.timeSpent
            }),
            channel ? upsertListeningTime(userId, channel, deltaTime) : Promise.resolve(),
        ]);

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({
            message: "User activity updated successfully",
            user: updatedUser
        });
    } catch (err) {
        next(err);
    }
};

export const updateSessionStartTime = async (req, res, next) => {
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
        next(err);
    }
};

export const getListeners = async (req, res, next) => {
    try {
        const counts = await usersService.getListenerCounts();
        return res.status(200).json(counts);
    } catch (err) {
        next(err);
    }
};

export const getUserRank = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await usersService.getUserRankAndTotal(id);
        return res.status(200).json({ rank: result.rank, total: result.total });
    } catch (err) {
        next(err);
    }
};
