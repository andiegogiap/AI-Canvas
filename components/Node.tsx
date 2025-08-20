import React from 'react';
import { NODE_TYPES } from '../constants';
import type { Node as NodeType, Port, ConnectingInfo } from '../types';
import { AI_PERSONAS } from '../personas';
import { Play, Square } from 'lucide-react';

interface NodeProps {
  node: NodeType;
  onDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  updateNodeData: (nodeId: string, newData: Record<string, any>) => void;
  onOutputPortMouseDown: (nodeId: string, portId: string) => void;
  onInputPortMouseUp: (nodeId: string, portId: string) => void;
  connecting: ConnectingInfo | null;
  toggleScheduler?: (nodeId: string) => void;
}

const Node: React.FC<NodeProps> = ({ node, onDragStart, updateNodeData, onOutputPortMouseDown, onInputPortMouseUp, connecting, toggleScheduler }) => {
  const nodeInfo = NODE_TYPES[node.type];
  if (!nodeInfo) return null;

  const NodeIcon = nodeInfo.icon;
  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    updateNodeData(node.id, { [name]: isNumber ? parseInt(value, 10) : value });
  };
  
  const getPortTop = (base: number, count: number, index: number) => {
    const totalHeight = (count -1) * 30;
    const startY = base - totalHeight / 2;
    return startY + index * 30;
  }

  const renderNodeContent = () => {
      const data = node.data;
      const baseTextAreaClass = "w-full p-2 border rounded-md bg-gray-700 text-slate-200 border-gray-600 focus:border-purple-500 focus:ring-purple-500 focus:outline-none";
      const baseInputClass = "w-full p-2 border rounded-md bg-gray-700 text-slate-200 border-gray-600 focus:border-purple-500 focus:ring-purple-500 focus:outline-none";
      const preBlockClass = "p-2 mt-2 bg-gray-900/50 rounded-md border border-gray-700 text-xs whitespace-pre-wrap break-all";
      const loadingSpinner = <div className="flex items-center gap-2 text-purple-400"><svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</div>;
      const errorDisplay = (error: string) => <div className="p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">{error}</div>;

      switch(node.type) {
          case 'USER_PROMPT': case 'SYSTEM_CONTEXT':
              return <textarea name="text" value={data.text} onChange={handleDataChange} className={`${baseTextAreaClass} h-28 resize-none`} aria-label={`${nodeInfo.name} content`} />;
          case 'JSON_OBJECT':
              return <textarea name="params" value={data.params} onChange={handleDataChange} className={`${baseTextAreaClass} h-28 resize-none font-mono text-xs`} aria-label="JSON Object" />;
          case 'AI_PERSONA': {
                const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const selectedPersona = AI_PERSONAS.find(p => p.name === e.target.value);
                    if (selectedPersona) {
                        updateNodeData(node.id, {
                            personaName: selectedPersona.name,
                            description: selectedPersona.persona.description,
                        });
                    }
                };
                return (
                    <div className="space-y-2">
                        <select name="persona" value={data.personaName} onChange={handlePersonaChange} className={`${baseTextAreaClass} appearance-none`} aria-label="Select AI Persona">
                            {AI_PERSONAS.map(p => <option key={p.name} value={p.name}>{p.name} - {p.role}</option>)}
                        </select>
                        <p className="p-2 text-xs bg-gray-900/50 rounded-md border border-gray-700 text-gray-400 min-h-[6em]">
                            {data.description}
                        </p>
                    </div>
                );
            }
          case 'TOPIC_CHOOSER':
            return (
                <div className="space-y-2">
                    <textarea name="topics" value={data.topics} onChange={handleDataChange} className={`${baseTextAreaClass} h-24 resize-none`} aria-label="List of topics" />
                    <select name="mode" value={data.mode} onChange={handleDataChange} className={`${baseInputClass}`}>
                        <option value="random">Random</option>
                        <option value="sequential">Sequential</option>
                    </select>
                </div>
            );
          case 'WP_POST_FORMATTER':
            return (
                <div className="space-y-2">
                     <label htmlFor={`status-${node.id}`} className="text-xs text-gray-400">Default Status</label>
                    <input id={`status-${node.id}`} name="status" type="text" value={data.status} onChange={handleDataChange} className={`${baseInputClass}`} />
                    {data.out && <pre className={`${preBlockClass} text-emerald-300`}>{data.out}</pre>}
                </div>
            );
          case 'SCHEDULER':
              return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <input name="interval" type="number" value={data.interval} onChange={handleDataChange} className={`${baseInputClass} w-2/3`} />
                        <span className="text-gray-400 text-sm">seconds</span>
                    </div>
                    <button onClick={() => toggleScheduler?.(node.id)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors shadow-sm font-semibold ${data.isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {data.isRunning ? <><Square size={16}/> Stop</> : <><Play size={16}/> Start</>}
                    </button>
                </div>
              );
          case 'CODE_EXECUTOR':
              return (
                  <>
                    <label htmlFor={`script-${node.id}`} className="text-xs text-gray-400">Script</label>
                    <textarea id={`script-${node.id}`} name="script" value={data.script} onChange={handleDataChange} className={`${baseTextAreaClass} h-24 resize-none font-mono text-xs`} />
                    {data.result && <pre className={`${preBlockClass} text-green-400`}>{data.result}</pre>}
                  </>
              );
          case 'GEMINI':
          case 'TEXT_SUMMARIZER':
              return (
                  <div className="min-h-[50px] space-y-2">
                      {data.isLoading && loadingSpinner}
                      {data.error && errorDisplay(data.error)}
                      {data.out && <div className="p-2 bg-purple-900/50 rounded-md border border-purple-800 text-purple-300 text-sm break-words whitespace-pre-wrap">{data.out}</div>}
                  </div>
              );
          case 'ARTICLE_GENERATOR':
              return (
                <div className="min-h-[50px] space-y-2">
                    {data.isLoading && loadingSpinner}
                    {data.error && errorDisplay(data.error)}
                    {data.title && <div className="p-2 bg-purple-900/50 rounded-md border border-purple-800"><strong className="text-purple-300 block">Title:</strong><span className="text-purple-400 text-sm">{data.title}</span></div>}
                    {data.content && <div className="p-2 bg-purple-900/50 rounded-md border border-purple-800"><strong className="text-purple-300 block">Content:</strong><span className="text-purple-400 text-sm line-clamp-2">{data.content}</span></div>}
                </div>
              );
          case 'IMAGE_GENERATOR':
              return (
                 <div className="min-h-[50px] space-y-2 flex justify-center items-center">
                    {data.isLoading && loadingSpinner}
                    {data.error && errorDisplay(data.error)}
                    {data.out && <img src={data.out} alt="Generated image" className="rounded-md max-w-full h-auto" />}
                 </div>
              );
          case 'JSON_EXTRACTOR':
              return (
                  <div className="space-y-2">
                      <label htmlFor={`path-${node.id}`} className="text-xs text-gray-400">Path (e.g. data.name)</label>
                      <input id={`path-${node.id}`} name="path" type="text" value={data.path} onChange={handleDataChange} className={`${baseInputClass} font-mono text-xs`} />
                      {data.out && <pre className={`${preBlockClass} text-orange-300`}>{JSON.stringify(data.out, null, 2)}</pre>}
                  </div>
              );
          case 'CURL_PARSER':
              return (
                  <div className="space-y-2">
                      <label htmlFor={`curl-${node.id}`} className="text-xs text-gray-400">cURL Command</label>
                      <textarea id={`curl-${node.id}`} name="curlCommand" value={data.curlCommand} onChange={handleDataChange} className={`${baseTextAreaClass} h-28 resize-none font-mono text-xs`} />
                      {(data.url || data.method) &&
                        <div className="space-y-1">
                          {data.method && <pre className={`${preBlockClass} text-yellow-300`}>Method: {data.method}</pre>}
                          {data.url && <pre className={`${preBlockClass} text-yellow-300`}>URL: {data.url}</pre>}
                          {data.headers && <pre className={`${preBlockClass} text-yellow-300`}>Headers: {data.headers}</pre>}
                          {data.body && <pre className={`${preBlockClass} text-yellow-300`}>Body: {data.body}</pre>}
                        </div>
                      }
                  </div>
              );
          case 'API_REQUEST':
              return (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <select name="method" value={data.method} onChange={handleDataChange} className={`${baseInputClass} col-span-1`}>
                          <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                        </select>
                        <input name="url" type="text" value={data.url} onChange={handleDataChange} placeholder="URL" className={`${baseInputClass} col-span-2`} />
                    </div>
                    <textarea name="headers" value={data.headers} onChange={handleDataChange} placeholder="Headers (JSON)" className={`${baseTextAreaClass} h-20 resize-none font-mono text-xs`}></textarea>
                    <textarea name="body" value={data.body} onChange={handleDataChange} placeholder="Body" className={`${baseTextAreaClass} h-20 resize-none font-mono text-xs`}></textarea>
                    
                    {data.isLoading && loadingSpinner}
                    {data.error && errorDisplay(data.error)}
                    {data.status && <pre className={`${preBlockClass} text-rose-300`}>Status: {data.status}</pre>}
                    {data.res_headers && <pre className={`${preBlockClass} text-rose-300`}>Headers: {data.res_headers}</pre>}
                    {data.response && <pre className={`${preBlockClass} text-rose-300`}>{data.response}</pre>}
                </div>
              );
          case 'SQL_QUERY':
              return (
                <div className="space-y-2">
                    <label htmlFor={`connstr-${node.id}`} className="text-xs text-gray-400">Connection String</label>
                    <textarea id={`connstr-${node.id}`} name="connectionString" value={data.connectionString} onChange={handleDataChange} className={`${baseTextAreaClass} h-20 resize-none font-mono text-xs`} />
                    <label htmlFor={`query-${node.id}`} className="text-xs text-gray-400">SQL Query</label>
                    <textarea id={`query-${node.id}`} name="query" value={data.query} onChange={handleDataChange} className={`${baseTextAreaClass} h-24 resize-none font-mono text-xs`} />
                    
                    {data.isLoading && loadingSpinner}
                    {data.error && errorDisplay(data.error)}
                    {data.result && <pre className={`${preBlockClass} text-blue-300`}>{data.result}</pre>}
                </div>
              );
          case 'FORMATTER':
              return <div className="p-2 mt-2 bg-emerald-900/50 rounded-md border border-emerald-800 text-emerald-300 break-words min-h-[50px]">{data.result || <em className="text-gray-400">(not run)</em>}</div>;
          case 'MARKDOWN_TO_HTML':
              return <pre className="p-2 mt-2 bg-emerald-900/50 rounded-md border border-emerald-800 text-emerald-300 break-words whitespace-pre-wrap min-h-[50px]">{data.out || <em className="text-gray-400">(not run)</em>}</pre>;
          case 'OUTPUT':
          case 'LOG':
              return <pre className="p-2 bg-gray-700 rounded-md border border-gray-600 min-h-[50px] break-words whitespace-pre-wrap text-slate-200">{data.text || <em className="text-gray-400">(no result)</em>}</pre>;
          case 'IMAGE_DISPLAY':
              return (
                <div className="min-h-[50px] bg-gray-700 rounded-md border border-gray-600 flex justify-center items-center">
                    {data.image ? <img src={data.image} alt="Final output" className="rounded-md max-w-full h-auto" /> : <em className="text-gray-400">(no image)</em>}
                </div>
              );
          default: return null;
      }
  }

  const headerHeight = 60; // Approximate height of the header
  const contentPadding = 32; // p-4 * 2
  const basePortY = headerHeight + contentPadding;

  return (
    <div className="absolute bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-72 transition-shadow hover:shadow-2xl hover:shadow-purple-900/20"
      style={{ left: node.x, top: node.y, transform: `translateZ(0)` }} onMouseDown={(e) => e.stopPropagation()} role="group" aria-labelledby={`node-title-${node.id}`}>
      <div id={`node-title-${node.id}`} className={`flex items-center gap-3 p-3 rounded-t-xl ${nodeInfo.color} text-white cursor-move`}
        onMouseDown={onDragStart} aria-label={`${nodeInfo.name} node. Draggable.`}>
        <NodeIcon size={20} aria-hidden="true" />
        <h3 className="font-bold">{nodeInfo.name}</h3>
      </div>
      <div className="p-4 text-sm text-slate-400" role="form" aria-label="Node configuration">
        <p className="mb-3 text-xs">{nodeInfo.description}</p>
        {renderNodeContent()}
      </div>
      
      {nodeInfo.inputs.map((port, i) => (
        <div key={port.id} 
          onMouseUp={(e) => { e.stopPropagation(); onInputPortMouseUp(node.id, port.id); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute w-4 h-4 bg-gray-700 border-2 rounded-full -left-2 cursor-crosshair transition-colors ${!!connecting ? 'border-fuchsia-500 hover:bg-fuchsia-400' : 'border-gray-500 hover:bg-gray-400'}`}
          style={{ top: `${getPortTop(basePortY, nodeInfo.inputs.length, i)}px` }} role="button" aria-label={`Input port: ${port.name}`} title={`Input: ${port.name}`} />
      ))}
      {nodeInfo.outputs.map((port, i) => (
        <div key={port.id} 
          onMouseDown={(e) => { e.stopPropagation(); onOutputPortMouseDown(node.id, port.id); }}
          className={`absolute w-4 h-4 bg-gray-700 border-2 rounded-full -right-2 cursor-crosshair transition-colors ${connecting?.startNodeId === node.id ? 'bg-fuchsia-500 border-fuchsia-400' : 'border-gray-500 hover:bg-gray-400'}`}
          style={{ top: `${getPortTop(basePortY, nodeInfo.outputs.length, i)}px` }} role="button" aria-label={`Output port: ${port.name}`} title={`Output: ${port.name}`} />
      ))}
    </div>
  );
};

export default Node;