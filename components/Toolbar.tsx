import React, { useState, useRef, useEffect } from 'react';
import { Play, Trash2, ChevronDown, Settings, Save } from 'lucide-react';
import type { Template } from '../types';

interface ToolbarProps {
  runOrchestration: () => void;
  clearCanvas: () => void;
  isProcessing: boolean;
  templates: Template[];
  onLoadTemplate: (template: Template) => void;
  onOpenSettings: () => void;
  onSaveTemplate: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ runOrchestration, clearCanvas, isProcessing, templates, onLoadTemplate, onOpenSettings, onSaveTemplate }) => {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTemplatesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTemplateSelect = (template: Template) => {
    onLoadTemplate(template);
    setIsTemplatesOpen(false);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-2 flex items-center justify-between shadow-md flex-shrink-0">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors shadow-sm font-semibold"
          aria-haspopup="true"
          aria-expanded={isTemplatesOpen}
        >
          Templates <ChevronDown size={16} className={`transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
        </button>
        {isTemplatesOpen && (
          <div className="absolute top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            <ul className="py-1">
              {templates.map((template) => (
                <li key={template.name}>
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left px-4 py-2 hover:bg-purple-600 text-slate-200"
                  >
                    <strong className="block font-semibold">{template.name}</strong>
                    <span className="text-xs text-slate-400">{template.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={runOrchestration} aria-label="Run Orchestration" title="Run Orchestration"
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <Play size={16} /> Run
            </>
          )}
        </button>
        <button onClick={onSaveTemplate} aria-label="Save as Template" title="Save as Template"
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">
          <Save size={16} /> Save
        </button>
        <button onClick={clearCanvas} aria-label="Clear Canvas" title="Clear Canvas"
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">
          <Trash2 size={16} /> Clear
        </button>
         <button onClick={onOpenSettings} aria-label="Open Settings" title="Custom Instructions"
          disabled={isProcessing}
          className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors shadow-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
