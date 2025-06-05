import db from './db.js';
import { inferSubject } from './subjectClassifier.js';

export async function flashcardRoutes(fastify, options) {
 
  fastify.post('/flashcard', async (req, reply) => {
    const { student_id, question, answer } = req.body;
    const subject = inferSubject(question + ' ' + answer);

    db.run(
      `INSERT INTO flashcards (student_id, question, answer, subject) VALUES (?, ?, ?, ?)`,
      [student_id, question, answer, subject],
      function (err) {
        if (err) {
          reply.code(500).send({ error: 'Failed to add flashcard' });
        } else {
          reply.send({ message: 'Flashcard added successfully', subject });
        }
      }
    );
  });

  
  fastify.get('/get-subject', async (req, reply) => {
    const { student_id, limit } = req.query;

    db.all(
      `SELECT * FROM flashcards WHERE student_id = ?`,
      [student_id],
      (err, rows) => {
        if (err) {
          reply.code(500).send({ error: 'Failed to retrieve flashcards' });
        } else {
         
          const subjectMap = new Map();
          rows.forEach((row) => {
            if (!subjectMap.has(row.subject)) subjectMap.set(row.subject, []);
            subjectMap.get(row.subject).push(row);
          });

          const mixed = [];
          while (mixed.length < limit && subjectMap.size > 0) {
            for (const [subject, cards] of subjectMap) {
              if (cards.length === 0) {
                subjectMap.delete(subject);
                continue;
              }
              mixed.push(cards.pop());
              if (mixed.length >= limit) break;
            }
          }

          reply.send(mixed);
        }
      }
    );
  });
}
