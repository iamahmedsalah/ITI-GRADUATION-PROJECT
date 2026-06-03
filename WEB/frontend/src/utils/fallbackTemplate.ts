import type { RoadmapTemplate } from '../types/roadmap'

export const fallbackTemplate: RoadmapTemplate = {
  _id: 'fallback-backend',
  title: 'Backend Developer',
  slug: 'backend',
  goal: 'Step by step guide to becoming a modern backend developer.',
  description:
    'Learn backend fundamentals, pick a language, understand databases, and build API services.',
  targetLevel: 'beginner',
  tags: ['backend', 'api', 'databases'],
  steps: [
    {
      stepKey: 'introduction',
      title: 'Introduction',
      description:
        'Understand what backend development is and how servers, clients, and APIs work together.',
      order: 0,
      resources: [
        { title: 'What is Backend Development?', url: 'https://roadmap.sh/backend' },
        {
          title: 'How does the Internet work?',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work',
        },
      ],
    },
    {
      stepKey: 'language',
      title: 'Pick a Backend Language',
      description: 'Choose one language and build small projects before moving on.',
      order: 1,
      dependsOn: ['introduction'],
      resources: [
        { title: 'Node.js Docs', url: 'https://nodejs.org/en/docs' },
        { title: 'Go Documentation', url: 'https://go.dev/doc/' },
      ],
    },
    {
      stepKey: 'version-control',
      title: 'Version Control Systems',
      description: 'Learn Git basics and host your repositories on a remote provider.',
      order: 2,
      dependsOn: ['language'],
      resources: [
        {
          title: 'Git Handbook',
          url: 'https://guides.github.com/introduction/git-handbook/',
        },
      ],
    },
    {
      stepKey: 'databases',
      title: 'Relational Databases',
      description: 'Learn tables, relationships, SQL queries, indexes, and migrations.',
      order: 3,
      dependsOn: ['version-control'],
      resources: [
        {
          title: 'PostgreSQL Tutorial',
          url: 'https://www.postgresql.org/docs/current/tutorial.html',
        },
      ],
    },
    {
      stepKey: 'api',
      title: 'API Styles',
      description:
        'Understand REST, JSON APIs, GraphQL, authentication, and error handling.',
      order: 4,
      dependsOn: ['databases'],
      resources: [{ title: 'REST API Tutorial', url: 'https://restfulapi.net/' }],
    },
  ],
}
