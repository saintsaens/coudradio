import GoogleStrategy from "passport-google-oauth20";
import passport from "passport";
import { createGoogleCredential, getGoogleCredential } from "../services/fedCredService.js";
import { getUserById } from "../services/usersService.js";

const passportLoader = (app) => {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/auth/oauth2/redirect/google`,
        scope: ["profile", "email"]
    }, async function verify(accessToken, refreshToken, profile, cb) {
        try {
            if (!profile || !profile.id) {
                throw new Error("Google profile is undefined or missing ID");
            }

            // Check if federated credentials exist
            const credentials = await getGoogleCredential(profile)

            if (!credentials) {
                // User does not exist, create one
                const { id, username, subject, provider } = await createGoogleCredential(profile);
                return cb(null, { id, username, subject, provider });
            } else {
                // User exists, fetch their info
                const userId = credentials.user_id
                const existingUser = await getUserById(userId);

                if (!existingUser) {
                    console.log("User not found in users table.");
                    return cb(null, false);
                }
                return cb(null, { 
                    id: existingUser.id,
                    username: existingUser.username,
                    sessionStartTime: existingUser.session_start_time,
                    lastActivity: existingUser.last_activity_time,
                    timeSpent: existingUser.time_spent,
                });
            }
        } catch (err) {
            console.error("Error in Google authentication:", err);
            return cb(err);
        }
    }));

    passport.serializeUser((user, cb) => {
        process.nextTick(() => {
            cb(null, {
                id: user.id,
                username: user.username,
                sessionStartTime: user.sessionStartTime,
                lastActivity: user.lastActivity,
                timeSpent: user.timeSpent,
            });
        });
    });

    passport.deserializeUser((user, cb) => {
        process.nextTick(() => {
            return cb(null, user);
        });
    });
};

export default passportLoader;
