import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Node as NodeType, Connection, Port, ConnectingInfo } from './types';
import { NODE_TYPES, SNAP_GRID_SIZE, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from './constants';
import { callGeminiAPI, generateImageAPI } from './services/geminiService';
import { TEMPLATES, Template } from './templates';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import Node from './components/Node';
import SettingsPanel from './components/SettingsPanel';

const getPathValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export default function App() {
  const [nodes, setNodes] = useState<NodeType[]>(TEMPLATES[0].nodes);
  const [connections, setConnections] = useState<Connection[]>(TEMPLATES[0].connections);
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number; } | null>(null);
  const [connecting, setConnecting] = useState<ConnectingInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [aiSupervisorInstruction, setAiSupervisorInstruction] = useState(`You are an AI Supervisor. Your primary role is to ensure that all AI-generated content is accurate, helpful, and adheres to the highest standards of quality. Review and refine outputs to be concise, relevant, and directly address the user's request. Add a touch of creativity and insight where appropriate, but always prioritize factual correctness and clarity.`);
  const [systemOrchestratorInstruction, setSystemOrchestratorInstruction] = useState(`You are the System Orchestrator. Your function is to process chained requests logically and efficiently. When receiving inputs from previous steps, synthesize them intelligently. Ensure the final output is a coherent and well-structured response that reflects the entire workflow, not just the final step. Maintain context and consistency throughout the process.`);
  const isResizing = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getCanvasRelativePosition = useCallback((event: MouseEvent | React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }, []);
  
  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (isResizing.current) {
        const newWidth = event.clientX;
        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
            setSidebarWidth(newWidth);
        }
        return;
    }

    const pos = getCanvasRelativePosition(event);
    setMousePosition(pos);
    if (draggingNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNode.id
            ? { ...node, x: Math.round((pos.x - draggingNode.offsetX) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE, y: Math.round((pos.y - draggingNode.offsetY) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE }
            : node
        )
      );
    }
  }, [draggingNode, getCanvasRelativePosition]);

  const handleGlobalMouseUp = useCallback(() => {
    isResizing.current = false;
    setDraggingNode(null);
    setConnecting(null); // Also cancel connecting line on mouse up anywhere
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);


  const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
  };

  const addNode = (nodeType: string, x: number, y: number) => {
    const defaultData = NODE_TYPES[nodeType]?.defaultData;
    if (!defaultData) return;
    const newNode: NodeType = {
      id: `node-${Date.now()}`,
      type: nodeType,
      x: Math.round(x / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
      y: Math.round(y / SNAP_GRID_SIZE) * SNAP_GRID_SIZE,
      data: { ...defaultData },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (typeof nodeType === 'string' && NODE_TYPES[nodeType]) {
        const pos = getCanvasRelativePosition(event);
        addNode(nodeType, pos.x, pos.y);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
  };

  const updateNodeData = useCallback((nodeId: string, newData: Record<string, any>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  }, []);

  const handleOutputPortMouseDown = (nodeId: string, portId: string) => {
    setConnecting({ startNodeId: nodeId, startPortId: portId });
  };

  const handleInputPortMouseUp = (nodeId: string, portId: string) => {
    if (connecting && connecting.startNodeId !== nodeId) {
      const newConnection: Connection = {
          id: `conn-${connecting.startNodeId}-${nodeId}-${portId}`,
          startNodeId: connecting.startNodeId,
          startPortId: connecting.startPortId,
          endNodeId: nodeId,
          endPortId: portId,
      };
      // Prevent connecting to an already connected input port
      if (!connections.some(c => c.endNodeId === newConnection.endNodeId && c.endPortId === newConnection.endPortId)) {
          setConnections((prev) => [...prev, newConnection]);
      }
      // The global mouse up handler will fire next and clear the connecting state.
    }
  };
  
  const runOrchestration = async () => {
    setIsProcessing(true);

    const executionNodes: NodeType[] = JSON.parse(JSON.stringify(nodes));
    const nodeMap = new Map(executionNodes.map(n => [n.id, n]));

    // Reset non-input nodes
    executionNodes.forEach(node => {
      const nodeTypeInfo = NODE_TYPES[node.type];
      if (nodeTypeInfo.inputs.length > 0) {
        const preservedData = { personaName: node.data.personaName, description: node.data.description, path: node.data.path };
        node.data = { ...nodeTypeInfo.defaultData, ...preservedData }; // Keep some data
        delete node.data.result;
        delete node.data.error;
        if('isLoading' in node.data) node.data.isLoading = false;
        if(node.type === 'OUTPUT') node.data.text = '';
        if(node.type === 'IMAGE_DISPLAY') node.data.image = '';
      }
    });
    setNodes([...executionNodes]);

    const adj = new Map(executionNodes.map(n => [n.id, [] as string[]]));
    const inDegree = new Map(executionNodes.map(n => [n.id, 0]));

    for (const conn of connections) {
        adj.get(conn.startNodeId)?.push(conn.endNodeId);
        inDegree.set(conn.endNodeId, (inDegree.get(conn.endNodeId) || 0) + 1);
    }

    const queue = executionNodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    const executionOrder: string[] = [];

    while (queue.length > 0) {
        const u = queue.shift()!;
        executionOrder.push(u);
        adj.get(u)?.forEach(v => {
            const newDegree = (inDegree.get(v) || 1) - 1;
            inDegree.set(v, newDegree);
            if (newDegree === 0) {
                queue.push(v);
            }
        });
    }

    const globalInstructions = { ai: aiSupervisorInstruction, system: systemOrchestratorInstruction };

    for (const nodeId of executionOrder) {
        const nodeToProcess = nodeMap.get(nodeId)!;
        
        const incomingConnections = connections.filter(c => c.endNodeId === nodeToProcess.id);
        const inputData: Record<string, any> = {};

        for (const conn of incomingConnections) {
            const sourceNode = nodeMap.get(conn.startNodeId);
            if (sourceNode) {
                const sourceOutput = sourceNode.data.result ?? sourceNode.data.text ?? sourceNode.data.params ?? sourceNode.data.description;
                inputData[conn.endPortId] = sourceOutput;
            }
        }
        
        nodeToProcess.data.error = null;
        if ('isLoading' in nodeToProcess.data) nodeToProcess.data.isLoading = true;
        setNodes([...executionNodes]);

        try {
            switch (nodeToProcess.type) {
                case 'AI_PERSONA': nodeToProcess.data.result = nodeToProcess.data.description; break;
                case 'FORMATTER': nodeToProcess.data.result = `${inputData.in || ''}${nodeToProcess.data.suffix || ''}`; break;
                case 'CODE_EXECUTOR': nodeToProcess.data.result = `// Mock execution of:\n${nodeToProcess.data.script}\n// --> Console: Hello from Node.js!`; break;
                case 'OUTPUT':
                    const inputVal = inputData.in;
                    nodeToProcess.data.text = typeof inputVal === 'object' && inputVal !== null ? JSON.stringify(inputVal, null, 2) : String(inputVal || '');
                    break;
                case 'IMAGE_DISPLAY': nodeToProcess.data.image = inputData.in; break;
                case 'GEMINI':
                    nodeToProcess.data.result = await callGeminiAPI(inputData.prompt || '', inputData.context, inputData.params, globalInstructions);
                    break;
                case 'TEXT_SUMMARIZER':
                    nodeToProcess.data.result = await callGeminiAPI(inputData.in || '', 'You are an expert summarizer. Provide a concise summary of the following text:', undefined, globalInstructions);
                    break;
                case 'IMAGE_GENERATOR':
                    nodeToProcess.data.result = await generateImageAPI(inputData.prompt || '');
                    break;
                case 'JSON_EXTRACTOR':
                    const jsonInput = inputData.json;
                    const path = inputData.path ?? nodeToProcess.data.path;
                    if(typeof jsonInput === 'string' && path){
                        const obj = JSON.parse(jsonInput);
                        nodeToProcess.data.result = getPathValue(obj, path);
                    } else if (typeof jsonInput === 'object' && path) {
                         nodeToProcess.data.result = getPathValue(jsonInput, path);
                    }
                    break;
            }
        } catch (error) {
            nodeToProcess.data.error = error instanceof Error ? error.message : 'Processing failed.';
        }
        
        if ('isLoading' in nodeToProcess.data) nodeToProcess.data.isLoading = false;
        setNodes([...executionNodes]);
    }

    setIsProcessing(false);
  };

  const clearCanvas = () => {
    loadTemplate(TEMPLATES[0]);
  }
  
  const loadTemplate = (template: Template) => {
    setNodes(JSON.parse(JSON.stringify(template.nodes)));
    setConnections(JSON.parse(JSON.stringify(template.connections)));
    setConnecting(null);
  };

  const renderConnection = ({ id, startNodeId, endNodeId, startPortId, endPortId }: Connection) => {
    const startNode = nodes.find((n) => n.id === startNodeId);
    const endNode = nodes.find((n) => n.id === endNodeId);
    if (!startNode || !endNode) return null;
    
    const startNodeInfo = NODE_TYPES[startNode.type];
    const endNodeInfo = NODE_TYPES[endNode.type];
    const startPortIndex = startNodeInfo.outputs.findIndex(p => p.id === startPortId);
    const endPortIndex = endNodeInfo.inputs.findIndex(p => p.id === endPortId);

    if(startPortIndex === -1 || endPortIndex === -1) return null;

    const startY = startNode.y + 95 + (startPortIndex * 30) + 8; // +8 for port height/2
    const startX = startNode.x + 256; // node width
    const endY = endNode.y + 95 + (endPortIndex * 30) + 8; // +8 for port height/2
    const endX = endNode.x;
    
    const d = `M ${startX},${startY} C ${startX + 80},${startY} ${endX - 80},${endY} ${endX},${endY}`;
    return <path key={id} d={d} stroke="#52525b" strokeWidth="2" fill="none" className="transition-all" />;
  };

  const renderConnectingLine = () => {
    if (!connecting) return null;
    const startNode = nodes.find((n) => n.id === connecting.startNodeId);
    if (!startNode) return null;

    const startNodeInfo = NODE_TYPES[startNode.type];
    const startPortIndex = startNodeInfo.outputs.findIndex(p => p.id === connecting.startPortId);
    if(startPortIndex === -1) return null;

    const startY = startNode.y + 95 + (startPortIndex * 30) + 8;
    const startX = startNode.x + 256;
    const { x: endX, y: endY } = mousePosition;
    const d = `M ${startX},${startY} C ${startX + 80},${startY} ${endX - 80},${endY} ${endX},${endY}`;
    return <path d={d} stroke="#f43f5e" strokeWidth="2" fill="none" strokeDasharray="5,5" />;
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: NodeType) => {
    const pos = getCanvasRelativePosition(e);
    setDraggingNode({ id: node.id, offsetX: pos.x - node.x, offsetY: pos.y - node.y });
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-slate-300 font-sans overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} width={sidebarWidth} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      {!isSidebarCollapsed && <div className="resize-handle w-1.5 cursor-col-resize bg-gray-950 hover:bg-purple-600 transition-colors" onMouseDown={handleResizeMouseDown}></div>}
      <main className="flex-1 flex flex-col" onMouseUp={handleGlobalMouseUp}>
        <Toolbar 
          runOrchestration={runOrchestration} 
          clearCanvas={clearCanvas} 
          isProcessing={isProcessing}
          templates={TEMPLATES}
          onLoadTemplate={loadTemplate}
          onOpenSettings={() => setIsSettingsPanelOpen(true)}
        />
        <div ref={canvasRef} className="flex-1 bg-gray-800 relative overflow-auto" onDrop={handleDrop} onDragOver={handleDragOver}
          style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 0)', backgroundSize: `${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px` }}
          aria-label="Orchestration Canvas">
          <svg className="absolute w-full h-full pointer-events-none" aria-hidden="true">
            {connections.map(renderConnection)}
            {renderConnectingLine()}
          </svg>
          {nodes.map((node) => (
            <Node key={node.id} node={node} 
                onDragStart={(e) => handleNodeDragStart(e, node)}
                updateNodeData={updateNodeData} 
                onOutputPortMouseDown={handleOutputPortMouseDown}
                onInputPortMouseUp={handleInputPortMouseUp}
                connecting={connecting}
            />
          ))}
        </div>
      </main>
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        aiSupervisorInstruction={aiSupervisorInstruction}
        setAiSupervisorInstruction={setAiSupervisorInstruction}
        systemOrchestratorInstruction={systemOrchestratorInstruction}
        setSystemOrchestratorInstruction={setSystemOrchestratorInstruction}
      />
    </div>
  );
}