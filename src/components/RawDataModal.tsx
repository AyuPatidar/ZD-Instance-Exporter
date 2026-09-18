import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  id: string | number;
  rawPayload: any;
}

export const RawDataModal: React.FC<RawDataModalProps> = ({
  isOpen,
  onClose,
  title,
  id,
  rawPayload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(rawPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Raw Zendesk API Object: <span className="font-mono text-blue-600">ID #{id}</span>
              </h3>
              <p className="text-xs text-gray-500">{title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" />
                  Copy JSON
                </>
              )}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-auto flex-1 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
            {jsonString}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Read-only configuration payload received from Zendesk Support API.</span>
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
