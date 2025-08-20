import type { Node, Connection, Template } from './types';
import { NODE_TYPES } from './constants';
import { AI_PERSONAS } from './personas';

export const TEMPLATES: Template[] = [
  {
    name: 'Blank Canvas',
    description: 'Start a new orchestration from a clean slate.',
    nodes: [],
    connections: [],
  },
  {
    name: 'WordPress Auto-Poster',
    description: 'A full workflow to automatically generate and post articles to WordPress.',
    nodes: [
      { id: 'wp-1', type: 'TOPIC_CHOOSER', x: 40, y: 180, data: { ...NODE_TYPES.TOPIC_CHOOSER.defaultData, topics: 'The Impact of AI on Modern Art\nQuantum Computing Explained Simply\nBenefits of a Mediterranean Diet\nTop 5 JavaScript Frameworks in 2024' }},
      { id: 'wp-2', type: 'ARTICLE_GENERATOR', x: 400, y: 180, data: { ...NODE_TYPES.ARTICLE_GENERATOR.defaultData }},
      { id: 'wp-md-converter', type: 'MARKDOWN_TO_HTML', x: 760, y: 180, data: { ...NODE_TYPES.MARKDOWN_TO_HTML.defaultData }},
      { id: 'wp-3', type: 'WP_POST_FORMATTER', x: 1120, y: 180, data: { ...NODE_TYPES.WP_POST_FORMATTER.defaultData }},
      { id: 'wp-4', type: 'API_REQUEST', x: 1480, y: 180, data: { ...NODE_TYPES.API_REQUEST.defaultData, method: 'POST', url: 'https://YOUR_WORDPRESS_SITE/wp-json/wp/v2/posts', headers: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer YOUR_JWT_TOKEN"\n}' }},
      { id: 'wp-5', type: 'LOG', x: 1840, y: 180, data: { ...NODE_TYPES.LOG.defaultData }},
      { id: 'wp-6', type: 'SCHEDULER', x: 40, y: 40, data: { ...NODE_TYPES.SCHEDULER.defaultData, interval: 3600 }}
    ],
    connections: [
      { id: 'conn-wp-1-2', startNodeId: 'wp-1', startPortId: 'out', endNodeId: 'wp-2', endPortId: 'topic' },
      { id: 'conn-wp-2a-3', startNodeId: 'wp-2', startPortId: 'title', endNodeId: 'wp-3', endPortId: 'title' },
      { id: 'conn-wp-2-md', startNodeId: 'wp-2', startPortId: 'content', endNodeId: 'wp-md-converter', endPortId: 'in' },
      { id: 'conn-md-3', startNodeId: 'wp-md-converter', startPortId: 'out', endNodeId: 'wp-3', endPortId: 'content' },
      { id: 'conn-wp-3-4', startNodeId: 'wp-3', startPortId: 'out', endNodeId: 'wp-4', endPortId: 'body' },
      { id: 'conn-wp-4-5', startNodeId: 'wp-4', startPortId: 'response', endNodeId: 'wp-5', endPortId: 'in' },
    ]
  },
  {
    name: 'Basic Chatbot',
    description: 'A simple conversational AI using a persona.',
    nodes: [
      { id: 'node-1', type: 'USER_PROMPT', x: 50, y: 50, data: { ...NODE_TYPES.USER_PROMPT.defaultData } },
      { id: 'node-2', type: 'OUTPUT', x: 850, y: 150, data: { ...NODE_TYPES.OUTPUT.defaultData } },
      { id: 'node-3', type: 'AI_PERSONA', x: 50, y: 250, data: { ...NODE_TYPES.AI_PERSONA.defaultData } },
      { id: 'node-4', type: 'GEMINI', x: 450, y: 150, data: { ...NODE_TYPES.GEMINI.defaultData } },
    ],
    connections: [
      { id: 'conn-1-4-prompt', startNodeId: 'node-1', startPortId: 'out', endNodeId: 'node-4', endPortId: 'prompt' },
      { id: 'conn-3-4-context', startNodeId: 'node-3', startPortId: 'out', endNodeId: 'node-4', endPortId: 'context' },
      { id: 'conn-4-2-in', startNodeId: 'node-4', startPortId: 'out', endNodeId: 'node-2', endPortId: 'in' },
    ],
  },
  {
    name: 'Image Generation Workflow',
    description: 'Generate an image from a prompt and display it.',
    nodes: [
        { id: 'img-1', type: 'USER_PROMPT', x: 50, y: 150, data: { text: 'A majestic lion wearing a crown, cinematic lighting' } },
        { id: 'img-2', type: 'IMAGE_GENERATOR', x: 450, y: 150, data: { ...NODE_TYPES.IMAGE_GENERATOR.defaultData } },
        { id: 'img-3', type: 'IMAGE_DISPLAY', x: 850, y: 150, data: { ...NODE_TYPES.IMAGE_DISPLAY.defaultData } },
    ],
    connections: [
        { id: 'conn-img-1-2', startNodeId: 'img-1', startPortId: 'out', endNodeId: 'img-2', endPortId: 'prompt' },
        { id: 'conn-img-2-3', startNodeId: 'img-2', startPortId: 'out', endNodeId: 'img-3', endPortId: 'in' },
    ],
  },
  {
      name: 'Text Summarizer',
      description: 'Provide text to an AI to receive a concise summary.',
      nodes: [
        { id: 'sum-1', type: 'USER_PROMPT', x: 50, y: 150, data: { text: 'The industrial revolution was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States, in the period from about 1760 to some time between 1820 and 1840. This transition included going from hand production methods to machines, new chemical manufacturing and iron production processes, the increasing use of steam power and water power, the development of machine tools and the rise of the mechanized factory system.' } },
        { id: 'sum-2', type: 'TEXT_SUMMARIZER', x: 450, y: 150, data: { ...NODE_TYPES.TEXT_SUMMARIZER.defaultData } },
        { id: 'sum-3', type: 'OUTPUT', x: 850, y: 150, data: { ...NODE_TYPES.OUTPUT.defaultData } },
      ],
      connections: [
        { id: 'conn-sum-1-2', startNodeId: 'sum-1', startPortId: 'out', endNodeId: 'sum-2', endPortId: 'in' },
        { id: 'conn-sum-2-3', startNodeId: 'sum-2', startPortId: 'out', endNodeId: 'sum-3', endPortId: 'in' },
      ],
  },
  {
    name: 'API Fetch & Parse',
    description: 'Use a cURL command to fetch data from an API and extract a value.',
    nodes: [
        { id: 'api-1', type: 'CURL_PARSER', x: 40, y: 150, data: { ...NODE_TYPES.CURL_PARSER.defaultData, curlCommand: `curl https://jsonplaceholder.typicode.com/posts/1` } },
        { id: 'api-2', type: 'API_REQUEST', x: 450, y: 150, data: { ...NODE_TYPES.API_REQUEST.defaultData } },
        { id: 'api-3', type: 'JSON_EXTRACTOR', x: 860, y: 150, data: { ...NODE_TYPES.JSON_EXTRACTOR.defaultData, path: 'title' } },
        { id: 'api-4', type: 'OUTPUT', x: 1270, y: 150, data: { ...NODE_TYPES.OUTPUT.defaultData } },
    ],
    connections: [
        { id: 'conn-api-1-2-url', startNodeId: 'api-1', startPortId: 'url', endNodeId: 'api-2', endPortId: 'url' },
        { id: 'conn-api-1-2-method', startNodeId: 'api-1', startPortId: 'method', endNodeId: 'api-2', endPortId: 'method' },
        { id: 'conn-api-2-3-json', startNodeId: 'api-2', startPortId: 'response', endNodeId: 'api-3', endPortId: 'json' },
        { id: 'conn-api-3-4-in', startNodeId: 'api-3', startPortId: 'out', endNodeId: 'api-4', endPortId: 'in' },
    ],
  },
  {
    name: 'SQL Query Example',
    description: 'Demonstrates how to use the SQL Query node to fetch data (mocked).',
    nodes: [
        { id: 'sql-1', type: 'SQL_QUERY', x: 450, y: 150, data: { ...NODE_TYPES.SQL_QUERY.defaultData } },
        { id: 'sql-2', type: 'LOG', x: 850, y: 100, data: { ...NODE_TYPES.LOG.defaultData, text: 'Result will appear here...' } },
        { id: 'sql-3', type: 'LOG', x: 850, y: 250, data: { ...NODE_TYPES.LOG.defaultData, text: 'Errors will appear here...' } },
    ],
    connections: [
        { id: 'conn-sql-1-2-result', startNodeId: 'sql-1', startPortId: 'result', endNodeId: 'sql-2', endPortId: 'in' },
        { id: 'conn-sql-1-3-error', startNodeId: 'sql-1', startPortId: 'error', endNodeId: 'sql-3', endPortId: 'in' },
    ],
  }
];