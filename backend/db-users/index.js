import pg from 'pg'
const { Pool } = pg

const poolConfig = () => ({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'prod' ? { rejectUnauthorized: false } : false,
});

const pool = new Pool(poolConfig());

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database successfully!');
});

export const query = (text, params) => {
  return pool.query(text, params)
}

export default {
  query
};
