import type { Node, Connection } from './types';
import { NODE_TYPES } from './constants';
import { AI_PERSONAS } from './personas';

export interface Template {
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
}

export const TEMPLATES: Template[] = [
  {
    name: 'Basic Chatbot',
    description: 'A simple conversational AI using a persona.',
    nodes: [
      { id: 'node-1', type: 'USER_PROMPT', x: 50, y: 50, data: { ...NODE_TYPES.USER_PROMPT.defaultData } },
      { id: 'node-2', type: 'OUTPUT', x: 1050, y: 150, data: { ...NODE_TYPES.OUTPUT.defaultData } },
      { id: 'node-3', type: 'AI_PERSONA', x: 50, y: 250, data: { ...NODE_TYPES.AI_PERSONA.defaultData } },
      { id: 'node-4', type: 'GEMINI', x: 550, y: 150, data: { ...NODE_TYPES.GEMINI.defaultData } },
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
];
