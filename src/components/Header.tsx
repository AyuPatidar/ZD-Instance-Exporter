import React from 'react';
import { Download, RefreshCw, ShieldCheck, Database, Layers } from 'lucide-react';

interface HeaderProps {
  subdomain: string;
  isDevMode: boolean;
  isExportingAll: boolean;
  onRefreshCache: () => void;
  onExportAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  subdomain,
  isDevMode,
  isExportingAll,
  onRefreshCache,
  onExportAll,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* App Title & Subdomain Badge */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Zendesk Configuration Exporter
              </h1>
              {isDevMode && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  Mock Dev Mode
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center">
                <Database className="w-3.5 h-3.5 mr-1 text-gray-400" />
                Instance: <strong className="ml-1 text-gray-700">{subdomain}.zendesk.com</strong>
              </span>
              <span>•</span>
              <span className="flex items-center text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Authenticated via ZAF
              </span>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefreshCache}
            type="button"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors shadow-2xs"
            title="Clear lookup cache and reload active configuration"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            Refresh Lookups
          </button>

          <button
            onClick={onExportAll}
            disabled={isExportingAll}
            type="button"
            className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isExportingAll ? 'Exporting All...' : 'Export All as XLSX'}
          </button>
        </div>
      </div>
    </header>
  );
};
