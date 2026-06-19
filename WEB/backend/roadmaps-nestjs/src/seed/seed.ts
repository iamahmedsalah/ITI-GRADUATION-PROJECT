import * as dotenv from 'dotenv';
import * as path from 'path';
import mongoose, { Schema } from 'mongoose';

// Load .env from various potential paths
const envPaths = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];
for (const p of envPaths) {
  dotenv.config({ path: p });
}


const mongoUri = process.env.MONGODB_URI || process.env.DB_URL_FALLBACK || process.env.DB_URL;

console.log('Connecting to MongoDB at:', mongoUri);

// Define Schemas inline to keep seed independent
const RoadmapSchema = new Schema({
  name: { type: String, required: true },
}, { collection: 'roadmaps', timestamps: true });

const PositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { _id: false });

const ResourceSchema = new Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
}, { _id: false });

const TopicSchema = new Schema({
  topicId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ['topic', 'subtopic'] },
  roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  position: { type: PositionSchema, required: true },
  resources: { type: [ResourceSchema], default: [] },
  parentTopicId: { type: String },
  path: { type: [String], default: [] },
}, { collection: 'topics', timestamps: true });

const RoadmapModel = mongoose.model('Roadmap', RoadmapSchema);
const TopicModel = mongoose.model('Topic', TopicSchema);

async function run() {
  await mongoose.connect(mongoUri, {
    dbName: 'iti_Grad_Project',
  });
  console.log('Connected to database: iti_Grad_Project');

  // Clear existing
  await RoadmapModel.deleteMany({});
  await TopicModel.deleteMany({});
  console.log('Cleared existing roadmaps and topics collections.');

  // Create Frontend Roadmap
  const frontendRoadmap = await RoadmapModel.create({
    name: 'Frontend Developer Roadmap (NestJS)',
  });
  console.log('Created Roadmap:', frontendRoadmap.name, 'with ID:', frontendRoadmap._id);

  // Topics
  const topics = [
    {
      topicId: 'internet',
      name: 'The Internet',
      label: 'Internet',
      description: 'How does the internet work, HTTP/HTTPS, hosting, browsers.',
      type: 'topic',
      roadmapId: frontendRoadmap._id,
      position: { x: 400, y: 100 },
      resources: [
        { type: 'article', title: 'How does the Internet Work', link: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work' },
      ],
      path: ['internet'],
    },
    {
      topicId: 'html',
      name: 'HTML Basics',
      label: 'HTML',
      description: 'Learn the fundamentals of HTML5 structure, semantic tags, and forms.',
      type: 'topic',
      roadmapId: frontendRoadmap._id,
      position: { x: 250, y: 250 },
      resources: [
        { type: 'docs', title: 'MDN HTML Basics', link: 'https://developer.mozilla.org/en-US/docs/Learn/HTML' },
      ],
      parentTopicId: 'internet',
      path: ['internet', 'html'],
    },
    {
      topicId: 'css',
      name: 'CSS Basics',
      label: 'CSS',
      description: 'Learn styling web pages, box model, Flexbox, CSS Grid.',
      type: 'topic',
      roadmapId: frontendRoadmap._id,
      position: { x: 550, y: 250 },
      resources: [
        { type: 'docs', title: 'MDN CSS Basics', link: 'https://developer.mozilla.org/en-US/docs/Learn/CSS' },
      ],
      parentTopicId: 'internet',
      path: ['internet', 'css'],
    },
    {
      topicId: 'javascript',
      name: 'JavaScript Basics',
      label: 'JavaScript',
      description: 'Learn variables, functions, DOM manipulation, fetch API.',
      type: 'topic',
      roadmapId: frontendRoadmap._id,
      position: { x: 400, y: 400 },
      resources: [
        { type: 'docs', title: 'MDN JS Basics', link: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript' },
      ],
      parentTopicId: 'internet',
      path: ['internet', 'javascript'],
    },
    {
      topicId: 'react',
      name: 'React.js',
      label: 'React',
      description: 'Modern component architecture, state, hooks, and props.',
      type: 'topic',
      roadmapId: frontendRoadmap._id,
      position: { x: 400, y: 550 },
      resources: [
        { type: 'docs', title: 'React Documentation', link: 'https://react.dev' },
      ],
      parentTopicId: 'javascript',
      path: ['internet', 'javascript', 'react'],
    },
  ];

  await TopicModel.insertMany(topics);
  console.log('Seeded', topics.length, 'topics for Frontend Developer Roadmap.');

  // Create Backend Roadmap
  const backendRoadmap = await RoadmapModel.create({
    name: 'Backend Developer Roadmap (NestJS)',
  });
  console.log('Created Roadmap:', backendRoadmap.name, 'with ID:', backendRoadmap._id);

  const backendTopics = [
    {
      topicId: 'backend-basics',
      name: 'Backend Basics',
      label: 'Backend Basics',
      description: 'Learn client-server architecture, APIs, HTTP methods.',
      type: 'topic',
      roadmapId: backendRoadmap._id,
      position: { x: 300, y: 100 },
      path: ['backend-basics'],
    },
    {
      topicId: 'nodejs',
      name: 'Node.js',
      label: 'Node.js',
      description: 'JavaScript runtime, NPM, modules, file system, event loop.',
      type: 'topic',
      roadmapId: backendRoadmap._id,
      position: { x: 300, y: 250 },
      parentTopicId: 'backend-basics',
      path: ['backend-basics', 'nodejs'],
    },
    {
      topicId: 'expressjs',
      name: 'Express.js',
      label: 'Express',
      description: 'Routing, middleware, controllers, error handling in Express.',
      type: 'topic',
      roadmapId: backendRoadmap._id,
      position: { x: 150, y: 400 },
      parentTopicId: 'nodejs',
      path: ['backend-basics', 'nodejs', 'expressjs'],
    },
    {
      topicId: 'databases',
      name: 'Databases',
      label: 'Databases',
      description: 'Relational (SQL) and Non-Relational (NoSQL) databases.',
      type: 'topic',
      roadmapId: backendRoadmap._id,
      position: { x: 450, y: 400 },
      parentTopicId: 'nodejs',
      path: ['backend-basics', 'nodejs', 'databases'],
    },
  ];

  await TopicModel.insertMany(backendTopics);
  console.log('Seeded', backendTopics.length, 'topics for Backend Developer Roadmap.');

  await mongoose.disconnect();
  console.log('Seeded database successfully!');
}

run().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
