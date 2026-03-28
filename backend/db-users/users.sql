CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    hashed_pw TEXT,
    session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_time TIMESTAMP WITH TIME ZONE NOT NULL,
    time_spent INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    subscribed BOOLEAN DEFAULT false,
    email TEXT NOT NULL,
    stripe_customer_id TEXT
);

CREATE TABLE listening_time (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    time_spent INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, channel)
);