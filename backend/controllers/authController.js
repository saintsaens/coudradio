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

export const getUserProfile = (req, res) => {
    console.log("Session Data:", req.session);
    console.log("Cookies:", req.headers.cookie);

    if (req.isAuthenticated()) {
        res.json({
            id: req.user.id,
            username: req.user.username,
            sessionStartTime: req.user.sessionStartTime,
            lastActivity: req.user.lastActivity,
            timeSpent: req.user.timeSpent,
        });
    } else {
        res.status(401).json({ error: "User not authenticated" });
    }
};
