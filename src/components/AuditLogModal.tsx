import React, { useState } from 'react';
import { X, History, Download, Search, ShieldCheck, RefreshCw, CheckCircle, RotateCcw, PackageCheck, AlertTriangle } from 'lucide-react';
import { AuditLogEntry, AuditAction } from '../types/lottery';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const text = `${log.title} ${log.description} ${log.participantName || ''} ${log.participantId || ''} ${log.prizeName || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CONFIRM_WINNER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            確認中獎
          </span>
        );
      case 'REROLL_CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            作廢重抽
          </span>
        );
      case 'DRAW_CANDIDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3 text-indigo-600" />
            抽出候選
          </span>
        );
      case 'MARK_CLAIMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PackageCheck className="w-3 h-3 text-blue-600" />
            獎品已領取
          </span>
        );
      case 'MARK_UNCLAIMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            取消領取
          </span>
        );
      case 'RESET_WINNERS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            重設名冊
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
            系統記錄
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const bom = '\uFEFF';
    const header = '時間戳記,動作類型,事件標題,詳細說明,獎項名稱,同學姓名,學號\n';
    const rows = logs
      .map((log) => `"${log.timestamp}","${log.action}","${log.title}","${log.description}","${log.prizeName || ''}","${log.participantName || ''}","${log.participantId || ''}"`)
      .join('\n');
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `抽獎審計日誌_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">抽獎審計歷史紀錄 (Audit Trail)</h2>
              <p className="text-xs text-slate-500">主辦方可完整追查抽獎、確認、重抽、領獎之所有變更軌跡</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋姓名、學號或事由..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">全部動作</option>
              <option value="CONFIRM_WINNER">確認中獎</option>
              <option value="REROLL_CANDIDATE">作廢重抽</option>
              <option value="DRAW_CANDIDATE">抽出候選</option>
              <option value="MARK_CLAIMED">獎品已領取</option>
              <option value="MARK_UNCLAIMED">取消領取</option>
              <option value="RESET_WINNERS">重設名單</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>匯出審計日誌 (CSV)</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {logs.length === 0 ? '目前尚無審計日誌紀錄' : '查無符合條件的紀錄'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white hover:border-slate-200 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-slate-900 text-xs">
                      {log.title}
                    </span>
                    {log.prizeName && (
                      <span className="text-xs text-indigo-600 font-medium">
                        [{log.prizeName}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {log.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>共累積 <strong className="font-mono-num text-slate-800">{logs.length}</strong> 筆狀態變更紀錄，受本機安全持久化保護</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
