import React, { useState, useEffect, useCallback, useRef } from 'react';
import { zafClient, isStandaloneDevMode } from './services/zaf/zafClient';
import { ConfigTabKey, ResourceItem } from './types/resources';
import { Header } from './components/Header';
import { TabNavigation, TABS } from './components/TabNavigation';
import { DataTable } from './components/DataTable';
import { RawDataModal } from './components/RawDataModal';
import { ExportProgressModal, ExportStepState } from './components/ExportProgressModal';
import { invalidateLookupCache } from './services/api/lookupService';
import {
  getTriggers,
  getAutomations,
  getViews,
  getOrganizations,
  getAgents,
  getGroups,
  getMacros,
  getCustomFields,
  getBusinessHours,
  getSupportAddresses,
  getForms,
  getSLAs,
  getGroupSLAs,
} from './services/api/configServices';
import { exportSingleTabToXLSX, exportMultipleTabsToXLSX, TabExportData, generateExportFilename } from './services/export/xlsxExporter';

export const App: React.FC = () => {
  // Account & App State
  const [subdomain, setSubdomain] = useState<string>('support');
  const [activeTab, setActiveTab] = useState<ConfigTabKey>('triggers');

  // Datasets Cache
  const [datasets, setDatasets] = useState<Partial<Record<ConfigTabKey, ResourceItem[]>>>({});
  const [loadingMap, setLoadingMap] = useState<Partial<Record<ConfigTabKey, boolean>>>({});
  const [errorMap, setErrorMap] = useState<Partial<Record<ConfigTabKey, string>>>({});

  // Raw JSON Modal State
  const [selectedRawItem, setSelectedRawItem] = useState<ResourceItem | null>(null);

  // Global Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportStepStates, setExportStepStates] = useState<Record<ConfigTabKey, ExportStepState>>(() => {
    const initial: Record<string, ExportStepState> = {};
    for (const tab of TABS) {
      initial[tab.key] = { status: 'pending' };
    }
    return initial as Record<ConfigTabKey, ExportStepState>;
  });
  const [isExportAllRunning, setIsExportAllRunning] = useState<boolean>(false);
  const [isExportCompleted, setIsExportCompleted] = useState<boolean>(false);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);
  const [exportedFilename, setExportedFilename] = useState<string>('');

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Initialize ZAF Context
  useEffect(() => {
    async function initApp() {
      try {
        const context = await zafClient.context();
        if (context?.account?.subdomain) {
          setSubdomain(context.account.subdomain);
        }
      } catch (err) {
        console.warn('[ZAF] Error fetching context:', err);
      }
    }
    initApp();
  }, []);

  // Map Tab Keys to Fetch Functions
  const fetchFunctions = useMemoMap();

  // Load a single tab dataset
  const loadTabDataset = useCallback(
    async (tabKey: ConfigTabKey, force = false) => {
      if (!force && datasets[tabKey]) {
        return datasets[tabKey]!;
      }

      setLoadingMap(prev => ({ ...prev, [tabKey]: true }));
      setErrorMap(prev => ({ ...prev, [tabKey]: undefined }));

      try {
        const fetchFn = fetchFunctions[tabKey];
        const data = await fetchFn();
        setDatasets(prev => ({ ...prev, [tabKey]: data }));
        setLoadingMap(prev => ({ ...prev, [tabKey]: false }));
        return data;
      } catch (err: any) {
        const message = err?.message || `Failed to load ${tabKey}`;
        setErrorMap(prev => ({ ...prev, [tabKey]: message }));
        setLoadingMap(prev => ({ ...prev, [tabKey]: false }));
        throw err;
      }
    },
    [datasets, fetchFunctions]
  );

  // Load active tab whenever tab changes if not yet loaded
  useEffect(() => {
    if (!datasets[activeTab] && !loadingMap[activeTab]) {
      loadTabDataset(activeTab).catch(() => {
        // Handled in state
      });
    }
  }, [activeTab, datasets, loadingMap, loadTabDataset]);

  // Refresh Lookups & Current Tab
  const handleRefreshCache = async () => {
    invalidateLookupCache();
    // Clear current tab dataset and re-fetch
    setDatasets(prev => {
      const next = { ...prev };
      delete next[activeTab];
      return next;
    });
    try {
      await loadTabDataset(activeTab, true);
    } catch {
      // Handled in error state
    }
  };

  // Export Active Tab to XLSX
  const handleExportCurrentTab = () => {
    const currentTabInfo = TABS.find(t => t.key === activeTab);
    const items = datasets[activeTab] || [];
    if (!currentTabInfo || items.length === 0) return;

    const rows = items.map(item => item.exportRow);
    exportSingleTabToXLSX(currentTabInfo.sheetName, rows, subdomain);
  };

  // Export All as Multi-Sheet XLSX
  const handleExportAll = async () => {
    setIsExportModalOpen(true);
    setIsExportAllRunning(true);
    setIsExportCompleted(false);
    setExportWarnings([]);

    // Reset step states
    const initialSteps: Record<ConfigTabKey, ExportStepState> = {} as any;
    for (const tab of TABS) {
      initialSteps[tab.key] = { status: 'pending' };
    }
    setExportStepStates(initialSteps);

    const exportDataList: TabExportData[] = [];
    const warnings: string[] = [];

    for (const tab of TABS) {
      setExportStepStates(prev => ({
        ...prev,
        [tab.key]: { status: 'loading' },
      }));

      try {
        let items = datasets[tab.key];
        if (!items) {
          const fetchFn = fetchFunctions[tab.key];
          items = await fetchFn();
          setDatasets(prev => ({ ...prev, [tab.key]: items }));
        }

        const rows = items.map(item => item.exportRow);
        exportDataList.push({
          tabKey: tab.key,
          sheetName: tab.sheetName,
          data: rows,
        });

        setExportStepStates(prev => ({
          ...prev,
          [tab.key]: { status: 'success', count: items!.length },
        }));
      } catch (err: any) {
        console.warn(`[Export All] Error processing ${tab.label}:`, err);
        const warningMsg = `${tab.label}: ${err?.message || 'Access denied or unavailable'}`;
        warnings.push(warningMsg);

        setExportStepStates(prev => ({
          ...prev,
          [tab.key]: {
            status: 'warning',
            message: err?.status === 403 ? 'Permission denied (403)' : 'Unavailable',
          },
        }));

        // Include blank placeholder sheet so workbook preserves tab layout
        exportDataList.push({
          tabKey: tab.key,
          sheetName: tab.sheetName,
          data: [],
        });
      }
    }

    // Build workbook and trigger download
    const filename = generateExportFilename(subdomain);
    exportMultipleTabsToXLSX(exportDataList, subdomain);

    setExportedFilename(filename);
    setExportWarnings(warnings);
    setIsExportCompleted(true);
    setIsExportAllRunning(false);
  };

  // Tab counts for badge display
  const tabCounts = Object.fromEntries(
    Object.entries(datasets).map(([k, v]) => [k, v ? v.length : undefined])
  );

  const activeTabInfo = TABS.find(t => t.key === activeTab) || TABS[0];
  const activeItems = datasets[activeTab] || [];
  const activeLoading = Boolean(loadingMap[activeTab]);
  const activeError = errorMap[activeTab];

  const totalExportedRecords = Object.values(exportStepStates).reduce(
    (acc, step) => acc + (step.count || 0),
    0
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9F9]">
      {/* Top Header */}
      <Header
        subdomain={subdomain}
        isDevMode={isStandaloneDevMode}
        isExportingAll={isExportAllRunning}
        onRefreshCache={handleRefreshCache}
        onExportAll={handleExportAll}
      />

      {/* 13 Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tabCounts={tabCounts}
        tabLoading={loadingMap}
        tabErrors={errorMap}
      />

      {/* Main Table Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <DataTable
          title={activeTabInfo.label}
          items={activeItems}
          loading={activeLoading}
          error={activeError}
          onRefresh={() => loadTabDataset(activeTab, true)}
          onExportTab={handleExportCurrentTab}
          onViewRaw={setSelectedRawItem}
        />
      </main>

      {/* Raw JSON Inspection Modal */}
      {selectedRawItem && (
        <RawDataModal
          isOpen={Boolean(selectedRawItem)}
          onClose={() => setSelectedRawItem(null)}
          title={activeTabInfo.label}
          id={selectedRawItem.id}
          rawPayload={selectedRawItem.raw}
        />
      )}

      {/* Export All Progress & Summary Modal */}
      <ExportProgressModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        stepStates={exportStepStates}
        isCompleted={isExportCompleted}
        totalRecords={totalExportedRecords}
        warnings={exportWarnings}
        filename={exportedFilename}
      />
    </div>
  );
};

// Helper hook to memoize fetch functions map
function useMemoMap(): Record<ConfigTabKey, () => Promise<ResourceItem[]>> {
  return React.useMemo(
    () => ({
      triggers: getTriggers,
      automations: getAutomations,
      views: getViews,
      organizations: getOrganizations,
      agents: getAgents,
      groups: getGroups,
      macros: getMacros,
      custom_fields: getCustomFields,
      business_hours: getBusinessHours,
      support_addresses: getSupportAddresses,
      forms: getForms,
      slas: getSLAs,
      group_slas: getGroupSLAs,
    }),
    []
  );
}
