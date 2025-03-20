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
        SELECT id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email
        FROM ${tableName}
        WHERE id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

export const updateUser = async (id, { username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email }) => {
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
            email = COALESCE($8, email)
        WHERE id = $9
        RETURNING id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email;
    `;
    const { rows } = await db.query(query, [username, hashedPw, role, sessionStartTime, lastActivityTime, timeSpent, subscribed, email, id]);
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

export const deleteUser = async (id) => {
    const query = `
        DELETE FROM ${tableName}
        WHERE id = $1
        RETURNING id, username, role, session_start_time, last_activity_time, time_spent, subscribed, email;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
};