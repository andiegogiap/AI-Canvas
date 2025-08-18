import { BrainCircuit, MessageSquare, User, Settings2, Terminal, Key, Share2, Users, Image, FileText, Brackets, GalleryHorizontalEnd } from 'lucide-react';
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
  // AI / Logic Tab
  GEMINI: {
    name: 'Gemini Model', type: 'GEMINI', icon: BrainCircuit,
    description: 'Processes inputs using the Gemini model for general tasks.',
    inputs: [ { id: 'prompt', name: 'User Prompt' }, { id: 'context', name: 'System Context' }, { id: 'params', name: 'Parameters' } ],
    outputs: [{ id: 'out', name: 'Result' }],
    color: 'bg-purple-600', category: 'AI / Logic',
    defaultData: { result: '', isLoading: false, error: null },
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
  JSON_EXTRACTOR: {
    name: 'JSON Extractor', type: 'JSON_EXTRACTOR', icon: Brackets,
    description: 'Extracts a value from a JSON string using dot notation path.',
    inputs: [{ id: 'json', name: 'JSON String' }, { id: 'path', name: 'Path' }],
    outputs: [{ id: 'out', name: 'Value' }],
    color: 'bg-orange-600', category: 'Utilities',
    defaultData: { path: 'key.nestedKey', result: '' },
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
  IMAGE_DISPLAY: {
    name: 'Image Display', type: 'IMAGE_DISPLAY', icon: GalleryHorizontalEnd,
    description: 'Displays a generated image.',
    inputs: [{ id: 'in', name: 'Image Data' }], outputs: [],
    color: 'bg-pink-600', category: 'Output',
    defaultData: { image: '' },
  },
};

export const SNAP_GRID_SIZE = 20;
export const NODE_CATEGORIES = ['Inputs', 'AI / Logic', 'Utilities', 'Development', 'Output'];
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 500;