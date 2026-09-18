import React, { useState, useMemo } from 'react';
import { ResourceItem } from '../types/resources';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  FileX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataTableProps<TRaw = any, TExport = any> {
  title: string;
  items: ResourceItem<TRaw, TExport>[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onExportTab: () => void;
  onViewRaw: (item: ResourceItem<TRaw, TExport>) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  items,
  loading,
  error,
  onRefresh,
  onExportTab,
  onViewRaw,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Extract columns dynamically from the first exportRow
  const columns = useMemo(() => {
    if (items.length === 0) return [];
    return Object.keys(items[0].exportRow);
  }, [items]);

  // Filter items by client-side search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();

    return items.filter(item => {
      const row = item.exportRow as Record<string, any>;
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [items, searchTerm]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortColumn) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aVal = (a.exportRow as Record<string, any>)[sortColumn];
      const bVal = (b.exportRow as Record<string, any>)[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numeric comparison (handles numbers and numeric strings)
      const numA = typeof aVal === 'number' ? aVal : Number(aVal);
      const numB = typeof bVal === 'number' ? bVal : Number(bVal);
      if (
        !isNaN(numA) &&
        !isNaN(numB) &&
        aVal !== '' &&
        bVal !== '' &&
        typeof aVal !== 'boolean' &&
        typeof bVal !== 'boolean'
      ) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Boolean comparison
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc' ? (aVal ? 1 : -1) : (bVal ? 1 : -1);
      }

      // String comparison
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredItems, sortColumn, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col flex-1 bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200">
            {items.length} {items.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="flex items-center space-x-2.5 flex-1 max-w-md justify-end">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            type="button"
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors disabled:opacity-50"
            title="Reload this resource"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export Current Tab Button */}
          <button
            onClick={onExportTab}
            disabled={loading || items.length === 0}
            type="button"
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
            Export Tab XLSX
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 space-y-3">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-gray-700">Loading {title.toLowerCase()} from Zendesk API...</p>
            <p className="text-xs text-gray-400">Resolving cross-references and formatting configuration</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load {title}</h3>
            <p className="text-xs text-gray-600 max-w-md mb-4 leading-relaxed">{error}</p>
            <button
              onClick={onRefresh}
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
            <FileX className="w-10 h-10 stroke-1 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No {title.toLowerCase()} found</p>
            <p className="text-xs text-gray-400">There are no records configured for this resource in Zendesk.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-1">
            <Search className="w-8 h-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No matching results</p>
            <p className="text-xs text-gray-400">Try adjusting your search query "{searchTerm}"</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Sticky Header */}
              <thead className="bg-[#F8F9F9] text-gray-700 font-semibold border-b border-gray-200 sticky top-0 z-10 select-none shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center text-gray-400">#</th>
                  {columns.map(col => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:bg-gray-200/70 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col}</span>
                        {sortColumn === col ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 w-20 text-center">Raw JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 bg-white">
                {paginatedItems.map((item, idx) => {
                  const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                  const row = item.exportRow as Record<string, any>;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors odd:bg-white even:bg-gray-50/50 group"
                    >
                      <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {rowIndex}
                      </td>
                      {columns.map(col => {
                        const cellVal = row[col];
                        return (
                          <td
                            key={col}
                            className="py-2.5 px-3 align-top max-w-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed"
                          >
                            {renderCellContent(col, cellVal)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center align-top">
                        <button
                          onClick={() => onViewRaw(item)}
                          type="button"
                          className="inline-flex items-center px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-100/60 rounded border border-gray-200 transition-colors"
                          title="View raw API object"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          JSON
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <span>
              Showing{' '}
              <strong className="text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-gray-900">
                {Math.min(currentPage * pageSize, filteredItems.length)}
              </strong>{' '}
              of <strong className="text-gray-900">{filteredItems.length}</strong> records
              {searchTerm && ` (filtered from ${items.length})`}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for rendering boolean pills, numeric IDs, or standard strings
function renderCellContent(colName: string, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-300">—</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          value ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}
      >
        {value ? 'True' : 'False'}
      </span>
    );
  }

  if (colName === 'ID' && typeof value === 'number') {
    return <span className="font-mono text-gray-600 font-medium">{value}</span>;
  }

  if (colName === 'Active') {
    const isAct = Boolean(value);
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          isAct ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {isAct ? 'Active' : 'Inactive'}
      </span>
    );
  }

  if (typeof value === 'object') {
    return <span className="font-mono text-[11px] text-gray-500">{JSON.stringify(value)}</span>;
  }

  return String(value);
}
