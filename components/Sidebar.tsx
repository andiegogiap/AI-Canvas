
import React, { useState } from 'react';
import { BrainCircuit, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NODE_TYPES, NODE_CATEGORIES } from '../constants';

interface SidebarProps {
  isCollapsed: boolean;
  width: number;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, width, onToggleCollapse }) => {
    const [activeTab, setActiveTab] = useState(NODE_CATEGORIES[0]);

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
      <aside style={{width: isCollapsed ? 0 : width, transition: 'width 0.3s ease-in-out'}} className="bg-gray-900 border-r border-gray-700 flex flex-col relative flex-shrink-0">
        <button onClick={onToggleCollapse} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-purple-600 text-white p-1 rounded-full" title={isCollapsed ? "Open sidebar" : "Collapse sidebar"}>
            {isCollapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
        </button>
        <div className={`flex flex-col h-full transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-gradient-to-br from-purple-600 to-sky-600 rounded-lg text-white"><BrainCircuit size={24} /></div>
                   <h1 className="text-xl font-bold text-slate-100">AI Orchestration</h1>
                </div>
            </div>
            <div className="flex-shrink-0 border-b border-gray-700">
                <nav className="flex -mb-px">
                    {NODE_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveTab(cat)}
                            className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === cat ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:bg-gray-800'}`}
                            aria-current={activeTab === cat ? 'page' : undefined}>
                            {cat}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col gap-3">
                {Object.values(NODE_TYPES).filter(n => n.category === activeTab).map((nodeInfo) => (
                  <div key={nodeInfo.type} draggable onDragStart={(e) => handleDragStart(e, nodeInfo.type)}
                    className="p-3 border border-gray-700 rounded-lg shadow-sm hover:shadow-lg hover:border-purple-500 cursor-grab transition-all bg-gray-800"
                    aria-label={`Draggable node: ${nodeInfo.name}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${nodeInfo.color} text-white`}><nodeInfo.icon size={20} /></div>
                      <span className="font-semibold text-slate-200">{nodeInfo.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </aside>
    );
};

export default Sidebar;
