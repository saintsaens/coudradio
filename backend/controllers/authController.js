import * as usersService from "../services/usersService.js";
import passport from "passport";

const frontendURL = process.env.FRONTEND_URL;

export const login = passport.authenticate('google');

export const redirectBack = passport.authenticate("google", {
    successRedirect: `${frontendURL}/?auth=success`,
    failureRedirect: `${frontendURL}/?auth=failure`
});

export const logout = async (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: 'Logout successful' });
    });
};

export const getUserProfile = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    try {
        const [user, timeSpent] = await Promise.all([
            usersService.getUserById(req.user.id),
            usersService.getTotalListeningTime(req.user.id),
        ]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        req.user.subscribed = user.subscribed;

        res.json({
            id: req.user.id,
            username: req.user.username,
            sessionStartTime: req.user.sessionStartTime,
            lastActivity: req.user.lastActivity,
            timeSpent,
            subscribed: req.user.subscribed,
            email: req.user.email
        });
    } catch (err) {
        next(err);
    }
};
