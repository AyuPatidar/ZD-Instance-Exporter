import React from 'react';
import { ConfigTabKey } from '../types/resources';
import {
  Zap,
  Clock,
  Eye,
  Building2,
  Users,
  FolderTree,
  FileText,
  Sliders,
  Calendar,
  Mail,
  FileSpreadsheet,
  Target,
  Award,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export interface TabInfo {
  key: ConfigTabKey;
  label: string;
  sheetName: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TABS: TabInfo[] = [
  { key: 'triggers', label: 'Triggers', sheetName: 'Triggers', icon: Zap },
  { key: 'automations', label: 'Automations', sheetName: 'Automations', icon: Clock },
  { key: 'views', label: 'Views', sheetName: 'Views', icon: Eye },
  { key: 'organizations', label: 'Organizations', sheetName: 'Organizations', icon: Building2 },
  { key: 'agents', label: 'Agents', sheetName: 'Agents', icon: Users },
  { key: 'groups', label: 'Groups', sheetName: 'Groups', icon: FolderTree },
  { key: 'macros', label: 'Macros', sheetName: 'Macros', icon: FileText },
  { key: 'custom_fields', label: 'Custom Fields', sheetName: 'Custom Fields', icon: Sliders },
  { key: 'business_hours', label: 'Business Hours', sheetName: 'Business Hours', icon: Calendar },
  { key: 'support_addresses', label: 'Support Addresses', sheetName: 'Support Addresses', icon: Mail },
  { key: 'forms', label: 'Forms', sheetName: 'Forms', icon: FileSpreadsheet },
  { key: 'slas', label: 'SLAs', sheetName: 'SLAs', icon: Target },
  { key: 'group_slas', label: 'Group SLAs', sheetName: 'Group SLAs', icon: Award },
];

interface TabNavigationProps {
  activeTab: ConfigTabKey;
  onSelectTab: (tab: ConfigTabKey) => void;
  tabCounts: Partial<Record<ConfigTabKey, number>>;
  tabLoading: Partial<Record<ConfigTabKey, boolean>>;
  tabErrors: Partial<Record<ConfigTabKey, string>>;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onSelectTab,
  tabCounts,
  tabLoading,
  tabErrors,
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex space-x-1 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-200"
          aria-label="Configuration Tabs"
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
            const isLoading = tabLoading[tab.key];
            const hasError = tabErrors[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>

                {/* Badge Status */}
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-1" />
                ) : hasError ? (
                  <span title={hasError}>
                    <AlertTriangle className="w-3 h-3 text-amber-500 ml-1" />
                  </span>
                ) : count !== undefined ? (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                      isActive ? 'bg-blue-200/80 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
