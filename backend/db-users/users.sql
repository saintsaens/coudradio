CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    hashed_pw TEXT,
    session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_time TIMESTAMP WITH TIME ZONE NOT NULL,
    time_spent INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user'
);