import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = Fastify({ logger: true });


const dbPromise = open({
  filename: path.join(__dirname, 'flashcards.db'),
  driver: sqlite3.Database,
});


const initDb = async () => {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      subject TEXT NOT NULL
    )
  `);
};


function inferSubject(text) {
  const rules = {
    physics: ['force', 'acceleration', 'gravity', 'newton'],
    chemistry: ['molecule', 'atom', 'reaction', 'acid', 'base'],
    biology: ['cell', 'photosynthesis', 'organism', 'dna'],
    math: ['equation', 'algebra', 'geometry', 'calculus'],
    history: ['war', 'empire', 'revolution', 'ancient'],
  };

  const lowerText = text.toLowerCase();
  for (const [subject, keywords] of Object.entries(rules)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }

  return 'General';
}


await app.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'Smart Flashcard API',
      description: 'API for flashcard submission and retrieval with subject classification',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  },
});
await app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  staticCSP: true,
});

// Routes

// POST /flashcard
app.post('/flashcard', {
  schema: {
    body: {
      type: 'object',
      required: ['student_id', 'question', 'answer'],
      properties: {
        student_id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          subject: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { student_id, question, answer } = request.body;
  const subject = inferSubject(question + ' ' + answer);

  const db = await dbPromise;
  await db.run(
    `INSERT INTO flashcards (student_id, question, answer, subject) VALUES (?, ?, ?, ?)`,
    [student_id, question, answer, subject]
  );

  reply.send({ message: 'Flashcard added successfully', subject });
});

// GET /get-subject?student_id=stu001&limit=5
app.get('/get-subject', {
  schema: {
    querystring: {
      type: 'object',
      required: ['student_id'],
      properties: {
        student_id: { type: 'string' },
        limit: { type: 'integer', default: 5 },
      },
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            subject: { type: 'string' },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  const { student_id, limit } = request.query;
  const db = await dbPromise;
  const flashcards = await db.all(
    `SELECT question, answer, subject FROM flashcards WHERE student_id = ?`,
    [student_id]
  );

  const shuffled = flashcards
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  reply.send(shuffled);
});

// Start server
initDb().then(() => {
  app.listen({ port: 3000 }, err => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
});
