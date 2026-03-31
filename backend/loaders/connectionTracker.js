const connections = new Map(); // Tracks IPs and their last connection time
const INTERVAL = 30 * 60 * 1000;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export const getRecentConnectionCount = () => {
    const now = Date.now();
    let count = 0;
    for (const [, timestamp] of connections) {
        if (now - timestamp < ACTIVE_WINDOW_MS) count++;
    }
    return count;
};

export const connectionTracker = (app) => {
    // Middleware to track connections
    app.use((req, res, next) => {
        const ip = req.ip; // Get the IP address of the request
        const now = Date.now();

        // Update or add the IP in the Map
        connections.set(ip, now);

        for (const [key, timestamp] of connections) {
            if (now - timestamp > INTERVAL * 2) {
                connections.delete(key);
            }
        }

        next();
    });

    // Periodically log the number of unique connections and the IPs
    setInterval(() => {
        console.log(`Unique connections in the past 30 minutes: ${connections.size}`);

        for (const [ip] of connections) {
            console.log(`IP: ${ip}`);
        }
    }, INTERVAL);
};