CREATE TABLE federated_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    CONSTRAINT federated_credentials_provider_subject_key UNIQUE (provider, subject),
    CONSTRAINT federated_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
