
import type { LucideIcon } from 'lucide-react';

export interface Port {
  id: string;
  name: string;
}

export interface NodeTypeInfo {
  name: string;
  type: string;
  icon: LucideIcon;
  description: string;
  inputs: Port[];
  outputs: Port[];
  color: string;
  category: string;
  defaultData: Record<string, any>;
}

export interface Node {
  id: string;
  type: string;
  x: number;
  y: number;
  data: Record<string, any>;
}

export interface Connection {
  id: string;
  startNodeId: string;
  startPortId: string;
  endNodeId: string;
  endPortId: string;
}

export interface ConnectingInfo {
  startNodeId: string;
  startPortId: string;
}
