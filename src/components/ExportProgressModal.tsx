import React from 'react';
import { ConfigTabKey } from '../types/resources';
import { TABS } from './TabNavigation';
import { CheckCircle2, AlertTriangle, Loader2, Download, X, FileSpreadsheet } from 'lucide-react';

export interface ExportStepState {
  status: 'pending' | 'loading' | 'success' | 'warning' | 'error';
  count?: number;
  message?: string;
}

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepStates: Record<ConfigTabKey, ExportStepState>;
  isCompleted: boolean;
  totalRecords: number;
  warnings: string[];
  filename?: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
  stepStates,
  isCompleted,
  totalRecords,
  warnings,
  filename,
}) => {
  if (!isOpen) return null;

  const completedSteps = Object.values(stepStates).filter(
    s => s.status === 'success' || s.status === 'warning' || s.status === 'error'
  ).length;
  const progressPercent = Math.round((completedSteps / TABS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {isCompleted ? 'Configuration Export Completed' : 'Exporting All Configurations'}
              </h3>
              <p className="text-xs text-gray-500">
                {isCompleted
                  ? `${completedSteps} of 13 configuration types processed`
                  : 'Retrieving datasets via ZAF Client and building multi-sheet XLSX'}
              </p>
            </div>
          </div>
          {isCompleted && (
            <button
              onClick={onClose}
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted && warnings.length > 0
                ? 'bg-amber-500'
                : isCompleted
                ? 'bg-emerald-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="p-6 max-h-80 overflow-y-auto divide-y divide-gray-100">
          {TABS.map(tab => {
            const step = stepStates[tab.key] || { status: 'pending' };
            const Icon = tab.icon;

            return (
              <div key={tab.key} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-800">{tab.label}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {step.status === 'pending' && (
                    <span className="text-gray-400 font-mono text-[11px]">Waiting...</span>
                  )}
                  {step.status === 'loading' && (
                    <span className="inline-flex items-center text-blue-600 font-medium">
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Fetching...
                    </span>
                  )}
                  {step.status === 'success' && (
                    <span className="inline-flex items-center text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      {step.count ?? 0} {step.count === 1 ? 'record' : 'records'}
                    </span>
                  )}
                  {(step.status === 'warning' || step.status === 'error') && (
                    <span className="inline-flex items-center text-amber-700 font-medium" title={step.message}>
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      {step.message || 'Unavailable'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warnings Banner if partial failures occurred */}
        {warnings.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-900">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Completed with warnings:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {isCompleted ? (
              <span>
                Total records: <strong className="text-gray-800">{totalRecords}</strong>
              </span>
            ) : (
              <span>Please do not close this window while the export is running...</span>
            )}
          </div>

          {isCompleted && (
            <div className="flex items-center space-x-2">
              {filename && (
                <span className="text-[11px] font-mono text-gray-500 truncate max-w-xs" title={filename}>
                  {filename}
                </span>
              )}
              <button
                onClick={onClose}
                type="button"
                className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
