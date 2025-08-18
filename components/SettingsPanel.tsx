import React from 'react';
import { X, Bot, Wrench } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  aiSupervisorInstruction: string;
  setAiSupervisorInstruction: (value: string) => void;
  systemOrchestratorInstruction: string;
  setSystemOrchestratorInstruction: (value: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  aiSupervisorInstruction,
  setAiSupervisorInstruction,
  systemOrchestratorInstruction,
  setSystemOrchestratorInstruction,
}) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full bg-gray-900 border-l border-gray-700 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '400px' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-panel-title"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="settings-panel-title" className="text-xl font-bold text-slate-100">
            Custom Instructions
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close settings panel"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <label htmlFor="ai-supervisor" className="flex items-center gap-2 text-lg font-semibold text-purple-400 mb-2">
                <Bot size={20} />
                AI Supervisor
              </label>
              <p className="text-sm text-gray-400 mb-3">
                Global instructions for all AI models. This acts as a high-level persona or meta-prompt for generating content.
              </p>
              <textarea
                id="ai-supervisor"
                value={aiSupervisorInstruction}
                onChange={(e) => setAiSupervisorInstruction(e.target.value)}
                className="w-full h-40 p-2 border rounded-md bg-gray-800 text-slate-200 border-gray-600 focus:border-purple-500 focus:ring-purple-500 focus:outline-none resize-none font-mono text-xs"
                aria-describedby="ai-supervisor-description"
              />
            </div>
            <div>
              <label htmlFor="system-orchestrator" className="flex items-center gap-2 text-lg font-semibold text-teal-400 mb-2">
                <Wrench size={20} />
                System Orchestrator
              </label>
              <p className="text-sm text-gray-400 mb-3">
                Instructions on how AI should behave within the system context, such as chaining prompts and synthesizing information from multiple steps.
              </p>
              <textarea
                id="system-orchestrator"
                value={systemOrchestratorInstruction}
                onChange={(e) => setSystemOrchestratorInstruction(e.target.value)}
                className="w-full h-40 p-2 border rounded-md bg-gray-800 text-slate-200 border-gray-600 focus:border-teal-500 focus:ring-teal-500 focus:outline-none resize-none font-mono text-xs"
                aria-describedby="system-orchestrator-description"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
