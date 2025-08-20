import { BrainCircuit, MessageSquare, User, Settings2, Terminal, Key, Share2, Users, Image, FileText, Brackets, GalleryHorizontalEnd, Webhook, ClipboardPaste, Clock, List, PenSquare, FileJson2, FileSearch, LogIn, Cpu, Wrench, Zap, Code, LogOut, Database, FileCode2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeTypeInfo } from './types';
import { AI_PERSONAS } from './personas';

export const NODE_TYPES: Record<string, NodeTypeInfo> = {
  // Inputs Tab
  USER_PROMPT: {
    name: 'User Prompt', type: 'USER_PROMPT', icon: User,
    description: 'Represents the primary input or question from the end-user.',
    inputs: [], outputs: [{ id: 'out', name: 'Prompt Text' }],
    color: 'bg-sky-600', category: 'Inputs',
    defaultData: { text: 'A curious cat is exploring a futuristic city full of neon lights and flying cars.' },
  },
  AI_PERSONA: {
    name: 'AI Persona', type: 'AI_PERSONA', icon: Users,
    description: 'Select a pre-defined AI personality to act as the system context.',
    inputs: [], outputs: [{ id: 'out', name: 'System Context' }],
    color: 'bg-teal-600', category: 'Inputs',
    defaultData: { personaName: AI_PERSONAS[0].name, description: AI_PERSONAS[0].persona.description },
  },
  SYSTEM_CONTEXT: {
    name: 'System Context', type: 'SYSTEM_CONTEXT', icon: Settings2,
    description: 'Provides custom instructions or background context to the AI.',
    inputs: [], outputs: [{ id: 'out', name: 'Context' }],
    color: 'bg-slate-600', category: 'Inputs',
    defaultData: { text: 'You are a helpful and creative assistant. Always respond in a concise and witty manner.' },
  },
  JSON_OBJECT: {
    name: 'JSON Object', type: 'JSON_OBJECT', icon: Key,
    description: 'Defines a JSON object for model configuration or other structured data.',
    inputs: [], outputs: [{ id: 'out', name: 'JSON Object' }],
    color: 'bg-amber-600', category: 'Inputs',
    defaultData: { params: '{\n  "temperature": 0.7\n}' },
  },
  TOPIC_CHOOSER: {
    name: 'Topic Chooser', type: 'TOPIC_CHOOSER', icon: List,
    description: 'Selects or cycles through a list of topics, one per line.',
    inputs: [], outputs: [{ id: 'out', name: 'Topic' }],
    color: 'bg-sky-700', category: 'Inputs',
    defaultData: { topics: 'The future of AI\nSustainable energy sources\nRemote work best practices', mode: 'random', currentIndex: 0, result: '' },
  },
  // AI / Logic Tab
  GEMINI: {
    name: 'Gemini Model', type: 'GEMINI', icon: BrainCircuit,
    description: 'Processes inputs using the Gemini model for general tasks.',
    inputs: [ { id: 'prompt', name: 'User Prompt' }, { id: 'context', name: 'System Context' }, { id: 'params', name: 'Parameters' } ],
    outputs: [{ id: 'out', name: 'Result' }],
    color: 'bg-purple-600', category: 'AI / Logic',
    defaultData: { result: '', isLoading: false, error: null },
  },
  ARTICLE_GENERATOR: {
    name: 'Article Generator', type: 'ARTICLE_GENERATOR', icon: PenSquare,
    description: 'Generates a structured article (title and content) from a topic.',
    inputs: [{ id: 'topic', name: 'Topic' }], outputs: [{ id: 'title', name: 'Title' }, { id: 'content', name: 'Content' }],
    color: 'bg-purple-700', category: 'AI / Logic',
    defaultData: { title: '', content: '', isLoading: false, error: null },
  },
  IMAGE_GENERATOR: {
    name: 'Image Generator', type: 'IMAGE_GENERATOR', icon: Image,
    description: 'Generates an image from a text prompt using Imagen.',
    inputs: [{ id: 'prompt', name: 'Prompt' }], outputs: [{ id: 'out', name: 'Image Data' }],
    color: 'bg-indigo-600', category: 'AI / Logic',
    defaultData: { result: '', isLoading: false, error: null },
  },
  TEXT_SUMMARIZER: {
    name: 'Text Summarizer', type: 'TEXT_SUMMARIZER', icon: FileText,
    description: 'Summarizes a long piece of text using an AI model.',
    inputs: [{ id: 'in', name: 'Text' }], outputs: [{ id: 'out', name: 'Summary' }],
    color: 'bg-cyan-600', category: 'AI / Logic',
    defaultData: { result: '', isLoading: false, error: null },
  },
  // Utilities Tab
  FORMATTER: {
    name: 'Simple Formatter', type: 'FORMATTER', icon: MessageSquare,
    description: 'Appends a fixed string to the input text.',
    inputs: [{ id: 'in', name: 'Text' }], outputs: [{ id: 'out', name: 'Formatted Text' }],
    color: 'bg-emerald-600', category: 'Utilities',
    defaultData: { text: '', suffix: ' - (Formatted)', result: '' },
  },
  WP_POST_FORMATTER: {
    name: 'WordPress Post Formatter', type: 'WP_POST_FORMATTER', icon: FileJson2,
    description: 'Builds the JSON object for the WordPress API.',
    inputs: [{id: 'title', name: 'Title'}, {id: 'content', name: 'Content'}, {id: 'status', name: 'Status'}], outputs: [{ id: 'out', name: 'JSON Object' }],
    color: 'bg-emerald-700', category: 'Utilities',
    defaultData: { status: 'publish', result: '' },
  },
  MARKDOWN_TO_HTML: {
    name: 'Markdown to HTML', type: 'MARKDOWN_TO_HTML', icon: FileCode2,
    description: 'Converts Markdown formatted text into HTML.',
    inputs: [{ id: 'in', name: 'Markdown' }], outputs: [{ id: 'out', name: 'HTML' }],
    color: 'bg-emerald-800', category: 'Utilities',
    defaultData: { out: '' },
  },
  JSON_EXTRACTOR: {
    name: 'JSON Extractor', type: 'JSON_EXTRACTOR', icon: Brackets,
    description: 'Extracts a value from a JSON string using dot notation path.',
    inputs: [{ id: 'json', name: 'JSON String' }, { id: 'path', name: 'Path' }],
    outputs: [{ id: 'out', name: 'Value' }],
    color: 'bg-orange-600', category: 'Utilities',
    defaultData: { path: 'key.nestedKey', result: '' },
  },
  CURL_PARSER: {
    name: 'cURL Parser', type: 'CURL_PARSER', icon: ClipboardPaste,
    description: 'Parses a cURL command into its components.',
    inputs: [],
    outputs: [
      { id: 'url', name: 'URL' },
      { id: 'method', name: 'Method' },
      { id: 'headers', name: 'Headers JSON' },
      { id: 'body', name: 'Body' },
    ],
    color: 'bg-yellow-600', category: 'Utilities',
    defaultData: {
      curlCommand: `curl -X POST https://jsonplaceholder.typicode.com/posts -H "Content-Type: application/json" -d '{"title": "foo","body": "bar","userId": 1}'`,
      url: '', method: '', headers: '', body: '',
    },
  },
  API_REQUEST: {
    name: 'API Request', type: 'API_REQUEST', icon: Webhook,
    description: 'Sends an HTTP request. Note: Subject to browser CORS policy.',
    inputs: [
      { id: 'url', name: 'URL' },
      { id: 'method', name: 'Method' },
      { id: 'headers', name: 'Headers JSON' },
      { id: 'body', name: 'Body' },
    ],
    outputs: [
      { id: 'response', name: 'Response Body' },
      { id: 'status', name: 'Status Code' },
      { id: 'res_headers', name: 'Response Headers' },
    ],
    color: 'bg-rose-700', category: 'Utilities',
    defaultData: {
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      headers: '{\n  "Content-Type": "application/json"\n}',
      body: '',
      response: null, status: null, res_headers: null,
      isLoading: false, error: null,
    },
  },
  SQL_QUERY: {
    name: 'SQL Query', type: 'SQL_QUERY', icon: Database,
    description: 'Executes a SQL query against a database. (Currently Mocked)',
    inputs: [
      { id: 'connectionString', name: 'Connection String' },
      { id: 'query', name: 'SQL Query' },
    ],
    outputs: [
      { id: 'result', name: 'Result' },
      { id: 'error', name: 'Error' },
    ],
    color: 'bg-blue-700', category: 'Utilities',
    defaultData: {
      connectionString: 'mysql://user:password@host:port/database',
      query: `SELECT * FROM posts WHERE status='publish' LIMIT 5`,
      result: null,
      error: null,
      isLoading: false,
    },
  },
  // Automation Tab
  SCHEDULER: {
    name: 'Scheduler', type: 'SCHEDULER', icon: Clock,
    description: 'Triggers the entire orchestration on a recurring interval.',
    inputs: [], outputs: [],
    color: 'bg-green-700', category: 'Automation',
    defaultData: { interval: 3600, isRunning: false },
  },
  // Development Tab
  CODE_EXECUTOR: {
      name: 'Code Executor', type: 'CODE_EXECUTOR', icon: Terminal,
      description: 'Mocks the execution of a code snippet (e.g., Node.js).',
      inputs: [{ id: 'in', name: 'Script' }], outputs: [{ id: 'out', name: 'Console Output' }],
      color: 'bg-gray-600', category: 'Development',
      defaultData: { script: 'console.log("Hello from Node.js!");', result: ''},
  },
  // Output Tab
  OUTPUT: {
    name: 'Final Output', type: 'OUTPUT', icon: Share2,
    description: 'Displays the final text result of the orchestration.',
    inputs: [{ id: 'in', name: 'Result' }], outputs: [],
    color: 'bg-rose-600', category: 'Output',
    defaultData: { text: '' },
  },
  LOG: {
    name: 'Log', type: 'LOG', icon: FileSearch,
    description: 'Displays intermediate data for logging or debugging.',
    inputs: [{ id: 'in', name: 'Data' }], outputs: [],
    color: 'bg-gray-500', category: 'Output',
    defaultData: { text: '' },
  },
  IMAGE_DISPLAY: {
    name: 'Image Display', type: 'IMAGE_DISPLAY', icon: GalleryHorizontalEnd,
    description: 'Displays a generated image.',
    inputs: [{ id: 'in', name: 'Image Data' }], outputs: [],
    color: 'bg-pink-600', category: 'Output',
    defaultData: { image: '' },
  },
};

export const SNAP_GRID_SIZE = 20;
export const NODE_CATEGORIES = ['Inputs', 'AI / Logic', 'Utilities', 'Automation', 'Development', 'Output'];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Inputs': LogIn,
  'AI / Logic': Cpu,
  'Utilities': Wrench,
  'Automation': Zap,
  'Development': Code,
  'Output': LogOut,
};

export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 500;