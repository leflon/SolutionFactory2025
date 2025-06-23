import Database from 'better-sqlite3';
const db = new Database('data/db.sqlite');

export default db;

/* Export data fetching/formatting/insertion logic here if it becomes too complex to be in other components. */
