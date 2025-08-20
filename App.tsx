import React, { useState, useCallback, useRef, useEffect } from 'react';
import { marked } from 'marked';
import type { Node as NodeType, Connection, Port, ConnectingInfo, Template } from './types';
import { NODE_TYPES, SNAP_GRID_SIZE, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from './constants';
import { callGeminiAPI, generateImageAPI, callGeminiForArticle } from './services/geminiService';
import { TEMPLATES } from './templates';
import { addTemplate, getAllTemplates } from './services/db';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import Node from './components/Node';
import SettingsPanel from './components/SettingsPanel';

const getPathValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const parseCurlCommand = (command: string): Record<string, string> => {
    const result: Record<string, any> = { method: 'GET', headers: '{}', body: '', url: '' };
    const parts: string[] = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

    const unquote = (s: string) => s.startsWith("'") || s.startsWith('"') ? s.slice(1, -1) : s;

    // Find URL first (usually the first part that is not an option)
    const urlIndex = parts.findIndex(p => !p.startsWith('-') && p.includes('://'));
    if (urlIndex !== -1) {
        result.url = unquote(parts[urlIndex]);
    }
    
    const headers: Record<string, string> = {};

    for (let i = 0; i < parts.length; i++) {
        switch (parts[i]) {
            case '-X':
            case '--request':
                result.method = unquote(parts[++i]).toUpperCase();
                break;
            case '-H':
            case '--header':
                const header = unquote(parts[++i]);
                const [key, ...val] = header.split(':');
                if (key && val.length > 0) {
                    headers[key.trim()] = val.join(':').trim();
                }
                break;
            case '-d':
            case '--data':
            case '--data-raw':
                result.body = unquote(parts[++i]);
                if (result.method === 'GET') result.method = 'POST';
                break;
        }
    }
    result.headers = JSON.stringify(headers, null, 2);
    return result;
}


export default function App() {
  const [nodes, setNodes] = useState<NodeType[]>(TEMPLATES[0].nodes);
  const [connections, setConnections] = useState<Connection[]>(TEMPLATES[0].connections);
  const [allTemplates, setAllTemplates] = useState<Template[]>(TEMPLATES);
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
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    // Cleanup timers on component unmount
    return () => {
        Object.values(timers.current).forEach(clearInterval);
    };
  }, []);

  const loadCustomTemplates = useCallback(async () => {
    try {
        const customTemplates = await getAllTemplates();
        const combined = [...TEMPLATES];
        customTemplates.forEach(custom => {
            const existingIndex = combined.findIndex(t => t.name === custom.name);
            if (existingIndex !== -1) {
                combined[existingIndex] = custom; // Overwrite default with user's version
            } else {
                combined.push(custom);
            }
        });
        setAllTemplates(combined);
    } catch (error) {
        console.error("Could not load custom templates:", error);
        setAllTemplates(TEMPLATES); // Fallback to defaults
    }
  }, []);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

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
    }
  };
  
  const runOrchestration = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const executionNodes: NodeType[] = JSON.parse(JSON.stringify(nodes));
    const nodeMap = new Map(executionNodes.map(n => [n.id, n]));

    // Reset non-input nodes
    executionNodes.forEach(node => {
      const nodeTypeInfo = NODE_TYPES[node.type];
      if (nodeTypeInfo.category !== 'Inputs' && node.type !== 'SCHEDULER') {
        const preservedData: Record<string, any> = {};
        const fieldsToPreserve = ['personaName', 'description', 'path', 'script', 'curlCommand', 'method', 'url', 'headers', 'body', 'topics', 'mode', 'currentIndex', 'status', 'interval', 'isRunning', 'connectionString', 'query'];
        fieldsToPreserve.forEach(field => {
            if (node.data[field] !== undefined) preservedData[field] = node.data[field];
        });
        node.data = { ...nodeTypeInfo.defaultData, ...preservedData };
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
                 let sourceOutput: any;
                 const sourcePortId = conn.startPortId;

                 // Handle multi-output nodes
                 if (sourceNode.data[sourcePortId] !== undefined) {
                    sourceOutput = sourceNode.data[sourcePortId];
                 } else if (sourcePortId === 'out') { // Fallback for single 'out' port
                    switch(sourceNode.type) {
                        case 'USER_PROMPT':
                        case 'SYSTEM_CONTEXT': sourceOutput = sourceNode.data.text; break;
                        case 'JSON_OBJECT': sourceOutput = sourceNode.data.params; break;
                        case 'AI_PERSONA': sourceOutput = sourceNode.data.description; break;
                        case 'TOPIC_CHOOSER': sourceOutput = sourceNode.data.out; break;
                        default: sourceOutput = sourceNode.data.out;
                    }
                 }
                inputData[conn.endPortId] = sourceOutput;
            }
        }
        
        nodeToProcess.data.error = null;
        if ('isLoading' in nodeToProcess.data) nodeToProcess.data.isLoading = true;
        setNodes([...executionNodes]);

        try {
            switch (nodeToProcess.type) {
                case 'USER_PROMPT': nodeToProcess.data.out = nodeToProcess.data.text; break;
                case 'AI_PERSONA': nodeToProcess.data.out = nodeToProcess.data.description; break;
                case 'SYSTEM_CONTEXT': nodeToProcess.data.out = nodeToProcess.data.text; break;
                case 'JSON_OBJECT': nodeToProcess.data.out = nodeToProcess.data.params; break;
                case 'TOPIC_CHOOSER': {
                    const topics = nodeToProcess.data.topics.split('\n').filter(Boolean);
                    if (topics.length > 0) {
                        if (nodeToProcess.data.mode === 'random') {
                            nodeToProcess.data.out = topics[Math.floor(Math.random() * topics.length)];
                        } else { // sequential
                            const currentIndex = nodeToProcess.data.currentIndex || 0;
                            nodeToProcess.data.out = topics[currentIndex];
                            nodeToProcess.data.currentIndex = (currentIndex + 1) % topics.length;
                        }
                    }
                    break;
                }
                case 'FORMATTER': nodeToProcess.data.out = `${inputData.in || ''}${nodeToProcess.data.suffix || ''}`; break;
                case 'MARKDOWN_TO_HTML':
                    nodeToProcess.data.out = marked(inputData.in || '');
                    break;
                case 'CODE_EXECUTOR': nodeToProcess.data.out = `// Mock execution of:\n${nodeToProcess.data.script}\n// --> Console: Hello from Node.js!`; break;
                case 'OUTPUT':
                case 'LOG':
                    const inputVal = inputData.in ?? inputData.Data; // port is 'Data' for Log
                    nodeToProcess.data.text = typeof inputVal === 'object' && inputVal !== null ? JSON.stringify(inputVal, null, 2) : String(inputVal || '');
                    break;
                case 'IMAGE_DISPLAY': nodeToProcess.data.image = inputData.in; break;
                case 'GEMINI':
                    nodeToProcess.data.out = await callGeminiAPI(inputData.prompt || '', inputData.context, inputData.params, globalInstructions);
                    break;
                case 'ARTICLE_GENERATOR':
                    const articleJsonString = await callGeminiForArticle(inputData.topic || '', globalInstructions);
                    const article = JSON.parse(articleJsonString);
                    nodeToProcess.data.title = article.title;
                    nodeToProcess.data.content = article.content;
                    break;
                case 'TEXT_SUMMARIZER':
                    nodeToProcess.data.out = await callGeminiAPI(inputData.in || '', 'You are an expert summarizer. Provide a concise summary of the following text:', undefined, globalInstructions);
                    break;
                case 'IMAGE_GENERATOR':
                    nodeToProcess.data.out = await generateImageAPI(inputData.prompt || '');
                    break;
                case 'WP_POST_FORMATTER':
                    const post = {
                        title: inputData.title || '',
                        content: inputData.content || '',
                        status: inputData.status || nodeToProcess.data.status || 'publish'
                    };
                    nodeToProcess.data.out = JSON.stringify(post, null, 2);
                    break;
                case 'JSON_EXTRACTOR':
                    const jsonInput = inputData.json;
                    const path = inputData.path ?? nodeToProcess.data.path;
                    if(jsonInput && path){
                        const obj = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
                        nodeToProcess.data.out = getPathValue(obj, path);
                    }
                    break;
                case 'CURL_PARSER':
                    const parsed = parseCurlCommand(nodeToProcess.data.curlCommand);
                    Object.assign(nodeToProcess.data, parsed);
                    break;
                case 'API_REQUEST':
                    const url = inputData.url || nodeToProcess.data.url;
                    const method = (inputData.method || nodeToProcess.data.method).toUpperCase();
                    const body = inputData.body || nodeToProcess.data.body;
                    let headers = {};
                    try {
                        const headersInput = inputData.headers || nodeToProcess.data.headers;
                        if (headersInput) headers = JSON.parse(headersInput);
                    } catch {
                        throw new Error("Headers must be a valid JSON object.");
                    }

                    const res = await fetch(url, { method, headers, body: (method !== 'GET' && body) ? body : undefined });
                    nodeToProcess.data.status = res.status;
                    const resHeaders: Record<string, string> = {};
                    res.headers.forEach((value, key) => { resHeaders[key] = value; });
                    nodeToProcess.data.res_headers = JSON.stringify(resHeaders, null, 2);
                    
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const jsonResponse = await res.json();
                        nodeToProcess.data.response = JSON.stringify(jsonResponse, null, 2);
                    } else {
                        nodeToProcess.data.response = await res.text();
                    }
                    
                    if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
                    break;
                case 'SQL_QUERY':
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
                    const connectionString = inputData.connectionString || nodeToProcess.data.connectionString;
                    const query = (inputData.query || nodeToProcess.data.query)?.trim().toLowerCase().replace(/\s+/g, ' ');
                    
                    const exampleQuery = `select * from posts where status='publish' limit 5`;

                    if (!connectionString || !connectionString.startsWith('mysql://')) {
                        throw new Error("Invalid connection string. Must start with mysql://. (Mocked)");
                    }

                    if (query === exampleQuery) {
                        const mockResult = [
                            { id: 1, title: 'AI in 2024', status: 'publish', author_id: 1 },
                            { id: 2, title: 'The Future of Web Dev', status: 'publish', author_id: 2 },
                            { id: 5, title: 'Getting Started with AgentWeaver', status: 'publish', author_id: 1 },
                        ];
                        nodeToProcess.data.result = JSON.stringify(mockResult, null, 2);
                        nodeToProcess.data.error = null;
                        nodeToProcess.data.out = nodeToProcess.data.result; // For chaining
                    } else {
                        throw new Error("This is a mocked node. It only supports the example query: SELECT * FROM posts WHERE status='publish' LIMIT 5");
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

  const startScheduler = (nodeId: string, intervalSeconds: number) => {
    stopScheduler(nodeId); // Ensure no duplicate timers
    const timerId = window.setInterval(() => {
        runOrchestration();
    }, intervalSeconds * 1000);
    timers.current[nodeId] = timerId;
  };

  const stopScheduler = (nodeId: string) => {
      if (timers.current[nodeId]) {
          clearInterval(timers.current[nodeId]);
          delete timers.current[nodeId];
      }
  };

  const toggleScheduler = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newIsRunning = !node.data.isRunning;
    updateNodeData(nodeId, { isRunning: newIsRunning });

    if (newIsRunning) {
        startScheduler(nodeId, node.data.interval);
        runOrchestration(); // Run immediately on start
    } else {
        stopScheduler(nodeId);
    }
  };

  const clearCanvas = () => {
    Object.keys(timers.current).forEach(stopScheduler);
    const blankTemplate = allTemplates.find(t => t.name === 'Blank Canvas');
    if (blankTemplate) {
      loadTemplate(blankTemplate);
    } else {
      setNodes([]);
      setConnections([]);
    }
  };
  
  const loadTemplate = (template: Template) => {
    Object.keys(timers.current).forEach(stopScheduler);
    setNodes(JSON.parse(JSON.stringify(template.nodes)));
    setConnections(JSON.parse(JSON.stringify(template.connections)));
  };

  const handleSaveTemplate = async () => {
    const name = prompt("Enter a name for your template:");
    if (!name || name.trim() === '') {
        alert("Template name cannot be empty.");
        return;
    }

    if (allTemplates.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        if (!confirm(`A template named "${name}" already exists. Do you want to overwrite it?`)) {
            return;
        }
    }

    const description = prompt("Enter a short description:", "A custom saved template.");

    const newTemplate: Template = {
        name: name.trim(),
        description: description || '',
        nodes: JSON.parse(JSON.stringify(nodes)),
        connections: JSON.parse(JSON.stringify(connections)),
    };

    try {
        await addTemplate(newTemplate);
        await loadCustomTemplates(); // Refresh the list from DB
        alert(`Template "${name}" saved successfully!`);
    } catch (error) {
        console.error("Failed to save template:", error);
        alert("Error: Could not save the template.");
    }
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
    
    const getPortTop = (base: number, count: number, index: number) => {
        const totalHeight = (count -1) * 30;
        const startY = base - totalHeight / 2;
        return startY + index * 30;
    }

    const headerHeight = 60; // Approximate height of the header
    const contentPadding = 32; // p-4 * 2
    const basePortY = headerHeight + contentPadding;

    const startY = startNode.y + getPortTop(basePortY, startNodeInfo.outputs.length, startPortIndex) + 8;
    const startX = startNode.x + 288; // node width
    const endY = endNode.y + getPortTop(basePortY, endNodeInfo.inputs.length, endPortIndex) + 8;
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

    const getPortTop = (base: number, count: number, index: number) => {
        const totalHeight = (count -1) * 30;
        const startY = base - totalHeight / 2;
        return startY + index * 30;
    }
    const headerHeight = 60;
    const contentPadding = 32;
    const basePortY = headerHeight + contentPadding;

    const startY = startNode.y + getPortTop(basePortY, startNodeInfo.outputs.length, startPortIndex) + 8;
    const startX = startNode.x + 288;
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
      <main className="flex-1 flex flex-col">
        <Toolbar 
          runOrchestration={runOrchestration} 
          clearCanvas={clearCanvas} 
          isProcessing={isProcessing}
          templates={allTemplates}
          onLoadTemplate={loadTemplate}
          onOpenSettings={() => setIsSettingsPanelOpen(true)}
          onSaveTemplate={handleSaveTemplate}
        />
        <div ref={canvasRef} className="flex-1 bg-gray-800 relative overflow-auto" onDrop={handleDrop} onDragOver={handleDragOver} onMouseUp={handleGlobalMouseUp}
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
                toggleScheduler={toggleScheduler}
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