import sqlite3 from 'sqlite3';
sqlite3.verbose();

const db = new sqlite3.Database('./flashcards.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    question TEXT,
    answer TEXT,
    subject TEXT
  )`);
});

export default db;
