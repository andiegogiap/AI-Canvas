import React from 'react';
import { NODE_TYPES } from '../constants';
import type { Node as NodeType, Port, ConnectingInfo } from '../types';
import { AI_PERSONAS } from '../personas';

interface NodeProps {
  node: NodeType;
  onDragStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  updateNodeData: (nodeId: string, newData: Record<string, any>) => void;
  onOutputPortMouseDown: (nodeId: string, portId: string) => void;
  onInputPortMouseUp: (nodeId: string, portId: string) => void;
  connecting: ConnectingInfo | null;
}

const Node: React.FC<NodeProps> = ({ node, onDragStart, updateNodeData, onOutputPortMouseDown, onInputPortMouseUp, connecting }) => {
  const nodeInfo = NODE_TYPES[node.type];
  if (!nodeInfo) return null;

  const NodeIcon = nodeInfo.icon;
  const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    updateNodeData(node.id, { [e.target.name]: e.target.value });
  };

  const renderNodeContent = () => {
      const data = node.data;
      const baseTextAreaClass = "w-full p-2 border rounded-md bg-gray-700 text-slate-200 border-gray-600 focus:border-purple-500 focus:ring-purple-500 focus:outline-none";
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
          case 'CODE_EXECUTOR':
              return (
                  <>
                    <label htmlFor={`script-${node.id}`} className="text-xs text-gray-400">Script</label>
                    <textarea id={`script-${node.id}`} name="script" value={data.script} onChange={handleDataChange} className={`${baseTextAreaClass} h-24 resize-none font-mono text-xs`} />
                    {data.result && <pre className="p-2 mt-2 bg-gray-900 text-green-400 rounded-md text-xs whitespace-pre-wrap">{data.result}</pre>}
                  </>
              );
          case 'GEMINI':
          case 'TEXT_SUMMARIZER':
              return (
                  <div className="min-h-[50px] space-y-2">
                      {data.isLoading && loadingSpinner}
                      {data.error && errorDisplay(data.error)}
                      {data.result && <div className="p-2 bg-purple-900/50 rounded-md border border-purple-800 text-purple-300 text-sm break-words whitespace-pre-wrap">{data.result}</div>}
                  </div>
              );
          case 'IMAGE_GENERATOR':
              return (
                 <div className="min-h-[50px] space-y-2 flex justify-center items-center">
                    {data.isLoading && loadingSpinner}
                    {data.error && errorDisplay(data.error)}
                    {data.result && <img src={data.result} alt="Generated image" className="rounded-md max-w-full h-auto" />}
                 </div>
              );
          case 'JSON_EXTRACTOR':
              return (
                  <div className="space-y-2">
                      <label htmlFor={`path-${node.id}`} className="text-xs text-gray-400">Path (e.g. data.name)</label>
                      <input id={`path-${node.id}`} name="path" type="text" value={data.path} onChange={handleDataChange} className={`${baseTextAreaClass} font-mono text-xs`} />
                      {data.result && <pre className="p-2 mt-2 bg-orange-900/50 rounded-md border border-orange-800 text-orange-300 text-xs whitespace-pre-wrap">{JSON.stringify(data.result, null, 2)}</pre>}
                  </div>
              );
          case 'FORMATTER':
              return <div className="p-2 mt-2 bg-emerald-900/50 rounded-md border border-emerald-800 text-emerald-300 break-words min-h-[50px]">{data.result || <em className="text-gray-400">(not run)</em>}</div>;
          case 'OUTPUT':
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

  return (
    <div className="absolute bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-64 transition-shadow hover:shadow-2xl hover:shadow-purple-900/20"
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
          style={{ top: `${95 + i * 30}px` }} role="button" aria-label={`Input port: ${port.name}`} title={`Input: ${port.name}`} />
      ))}
      {nodeInfo.outputs.map((port, i) => (
        <div key={port.id} 
          onMouseDown={(e) => { e.stopPropagation(); onOutputPortMouseDown(node.id, port.id); }}
          className={`absolute w-4 h-4 bg-gray-700 border-2 rounded-full -right-2 cursor-crosshair transition-colors ${connecting?.startNodeId === node.id ? 'bg-fuchsia-500 border-fuchsia-400' : 'border-gray-500 hover:bg-gray-400'}`}
          style={{ top: `${95 + i * 30}px` }} role="button" aria-label={`Output port: ${port.name}`} title={`Output: ${port.name}`} />
      ))}
    </div>
  );
};

export default Node;