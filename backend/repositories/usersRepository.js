import db from '../db-users/index.js';

const tableName = `users`;

export const createUser = async (username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email) => {
    if ([username, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email].some(arg => arg === undefined || arg === null)) {
        throw new Error("Missing required argument in createUser");
    }

    const query = `
        INSERT INTO ${tableName} (username, hashed_pw, role, session_start_time, last_activity_time, time_spent, subscribed, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email;
    `;
    const { rows } = await db.query(query, [username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email]);
    return rows[0];
};

export const getUserById = async (id) => {
    const query = `
        SELECT id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email, stripe_customer_id
        FROM ${tableName}
        WHERE id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

export const getUserByStripeCustomerId = async (stripeCustomerId) => {
    const query = `
        SELECT id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email, stripe_customer_id
        FROM ${tableName}
        WHERE stripe_customer_id = $1;
    `;
    const { rows } = await db.query(query, [stripeCustomerId]);
    return rows[0];
};

export const updateUser = async (id, { username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email, stripeCustomerId }) => {
    const query = `
        UPDATE ${tableName}
        SET
            username = COALESCE($1, username),
            hashed_pw = COALESCE($2, hashed_pw),
            role = COALESCE($3, role),
            session_start_time = COALESCE($4, session_start_time),
            last_activity_time = COALESCE($5, last_activity_time),
            time_spent = COALESCE($6, time_spent),
            subscribed = COALESCE($7, subscribed),
            email = COALESCE($8, email),
            stripe_customer_id = COALESCE($9, stripe_customer_id)
        WHERE id = $10
        RETURNING id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email, stripe_customer_id;
    `;
    const { rows } = await db.query(query, [username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email, stripeCustomerId, id]);
    return rows[0];
};

export const addTimeSpent = async (id, timeToAdd) => {
    const query = `
        UPDATE ${tableName}
        SET time_spent = COALESCE(time_spent, 0) + $1
        WHERE id = $2
        RETURNING id, username, role, session_start_time, last_activity_time, time_spent;
    `;
    const { rows } = await db.query(query, [timeToAdd, id]);
    return rows[0];
};

export const getActiveAuthenticatedCount = async () => {
    const query = `
        SELECT COUNT(*) AS count
        FROM ${tableName}
        WHERE last_activity_time > NOW() - INTERVAL '2 minutes';
    `;
    const { rows } = await db.query(query);
    return parseInt(rows[0].count, 10);
};

export const getListeningTimesByUser = async (userId) => {
    const query = `
        SELECT channel, time_spent AS "timeSpent"
        FROM listening_time
        WHERE user_id = $1
        ORDER BY time_spent DESC;
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
};

export const getTotalListeningTime = async (userId) => {
    const query = `
        SELECT COALESCE(SUM(time_spent), 0) AS total
        FROM listening_time
        WHERE user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    return parseInt(rows[0].total, 10);
};

export const upsertListeningTime = async (userId, channel, delta) => {
    const query = `
        INSERT INTO listening_time (user_id, channel, time_spent)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, channel)
        DO UPDATE SET time_spent = listening_time.time_spent + EXCLUDED.time_spent;
    `;
    await db.query(query, [userId, channel, delta]);
};

export const getUserRankAndTotal = async (id) => {
    // Rank by total time in listening_time (the source of truth) rather than the
    // now-frozen users.time_spent column. LEFT JOIN so users with no listening
    // time still rank (at 0).
    const query = `
        WITH totals AS (
            SELECT u.id, COALESCE(SUM(lt.time_spent), 0) AS time_spent
            FROM ${tableName} u
            LEFT JOIN listening_time lt ON lt.user_id = u.id
            GROUP BY u.id
        ),
        ranked AS (
            SELECT id,
                   RANK() OVER (ORDER BY time_spent DESC) AS rank
            FROM totals
        )
        SELECT r.rank, t.total
        FROM ranked r
        CROSS JOIN (SELECT COUNT(*) AS total FROM ${tableName}) t
        WHERE r.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};
