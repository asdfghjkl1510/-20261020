import React, { useState } from 'react';
import { X, Trophy, Download, Copy, Trash2, Check, Search, CheckCircle2, Clock, Filter, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { WinnerRecord, Prize } from '../types/lottery';
import { maskStudentId, maskStudentName } from '../utils/privacy';

interface WinnersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: WinnerRecord[];
  prizes: Prize[];
  onToggleClaim: (winnerId: string) => void;
  onResetWinners: () => void;
}

export const WinnersListModal: React.FC<WinnersListModalProps> = ({
  isOpen,
  onClose,
  winners,
  prizes,
  onToggleClaim,
  onResetWinners
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrizeFilter, setSelectedPrizeFilter] = useState<string>('ALL');
  const [claimFilter, setClaimFilter] = useState<'ALL' | 'UNCLAIMED' | 'CLAIMED'>('ALL');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [revealFullId, setRevealFullId] = useState(false);
  const [maskExportPii, setMaskExportPii] = useState(false);

  if (!isOpen) return null;

  // Filter records
  const filteredWinners = winners.filter((w) => {
    const matchesSearch = `${w.participant.name} ${w.participant.id} ${w.participant.department} ${w.prizeName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesPrize = selectedPrizeFilter === 'ALL' || w.prizeId === selectedPrizeFilter || w.prizeName === selectedPrizeFilter;

    const matchesClaim =
      claimFilter === 'ALL' ||
      (claimFilter === 'CLAIMED' && w.claimed) ||
      (claimFilter === 'UNCLAIMED' && !w.claimed);

    return matchesSearch && matchesPrize && matchesClaim;
  });

  const claimedCount = winners.filter((w) => w.claimed).length;
  const unclaimedCount = winners.length - claimedCount;

  const handleCopyText = () => {
    if (filteredWinners.length === 0) return;
    const header = '獎項\t姓名\t學號\t系級\t中獎時間\t領獎狀態\t領獎時間';
    const rows = filteredWinners.map((w) => {
      const idToDisplay = maskExportPii ? maskStudentId(w.participant.id) : w.participant.id;
      const nameToDisplay = maskExportPii ? maskStudentName(w.participant.name) : w.participant.name;
      return `${w.prizeName}\t${nameToDisplay}\t${idToDisplay}\t${w.participant.department} ${w.participant.grade}\t${w.wonAt}\t${w.claimed ? '已領取' : '未領取'}\t${w.claimedAt || '-'}`;
    });
    const content = [header, ...rows].join('\n');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = (targetPrizeOnly: boolean) => {
    const listToExport = targetPrizeOnly ? filteredWinners : winners;
    if (listToExport.length === 0) return;

    const bom = '\uFEFF';
    const header = '獎項名稱,得獎者姓名,學號,系所年級,中獎時間,領獎狀態,領取時間\n';
    const rows = listToExport
      .map((w) => {
        const idToExport = maskExportPii ? maskStudentId(w.participant.id) : w.participant.id;
        const nameToExport = maskExportPii ? maskStudentName(w.participant.name) : w.participant.name;
        return `"${w.prizeName}","${nameToExport}","${idToExport}","${w.participant.department} ${w.participant.grade}","${w.wonAt}","${w.claimed ? '已領取' : '尚未領取'}","${w.claimedAt || ''}"`;
      })
      .join('\n');

    const suffix = maskExportPii ? '_個資保護版' : '_完整版';
    const prizeSuffix = targetPrizeOnly && selectedPrizeFilter !== 'ALL'
      ? `_${selectedPrizeFilter}`
      : '';

    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `校園抽獎得獎名單${prizeSuffix}${suffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">正式得獎名錄與領獎簽核</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>正式得獎 <strong className="font-mono-num text-slate-900">{winners.length}</strong> 人</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 font-medium">已領取 {claimedCount} 人</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 font-medium">尚未領取 {unclaimedCount} 人</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Full vs Masked ID in staff view */}
            <button
              type="button"
              onClick={() => setRevealFullId(!revealFullId)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="切換是否顯示完整學號以利發獎核驗"
            >
              {revealFullId ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{revealFullId ? '遮蔽學號' : '顯示完整學號'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar with Prize filter, Search, Claim Status */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-between">
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋姓名、學號或系級..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Prize Filter Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>獎項：</span>
              </div>
              <select
                value={selectedPrizeFilter}
                onChange={(e) => setSelectedPrizeFilter(e.target.value)}
                className="w-full sm:w-44 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">全部獎項 ({winners.length})</option>
                {prizes.map((p) => {
                  const count = winners.filter((w) => w.prizeId === p.id || w.prizeName === p.name).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Claim Status Filter */}
            <select
              value={claimFilter}
              onChange={(e) => setClaimFilter(e.target.value as 'ALL' | 'UNCLAIMED' | 'CLAIMED')}
              className="w-full sm:w-32 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">所有領取狀態</option>
              <option value="UNCLAIMED">尚未領取 ({unclaimedCount})</option>
              <option value="CLAIMED">已領取 ({claimedCount})</option>
            </select>
          </div>

          {/* Action Row & Masking Option for Export */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                篩選結果：共 {filteredWinners.length} 筆正式中獎人
              </span>

              {/* Checkbox for masked export (public bulletin board mode) */}
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maskExportPii}
                  onChange={(e) => setMaskExportPii(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  匯出/複製時遮蔽個資 (校園公開公告版)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                disabled={filteredWinners.length === 0}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? '已複製' : '複製篩選結果'}</span>
              </button>

              {selectedPrizeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleDownloadCsv(true)}
                  disabled={filteredWinners.length === 0}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>匯出指定獎項 CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDownloadCsv(false)}
                disabled={winners.length === 0}
                className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>匯出全體名單 CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {filteredWinners.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {winners.length === 0
                ? '目前尚未有確認得獎的記錄（抽獎後點擊「確認中獎」才會列入正式名單）'
                : '查無符合條件的得獎者'}
            </div>
          ) : (
            filteredWinners.map((record, index) => {
              const displayId = revealFullId ? record.participant.id : maskStudentId(record.participant.id);
              return (
                <div 
                  key={record.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                    record.claimed 
                      ? 'bg-slate-50/50 border-slate-200' 
                      : 'bg-white border-amber-200/70 shadow-2xs'
                  }`}
                >
                  {/* Left: Participant Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 ${
                      record.claimed ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {record.participant.name}
                        </span>
                        <span className="text-xs text-slate-600">
                          {record.participant.department} {record.participant.grade}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {record.prizeName}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          {!revealFullId && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                          學號：{displayId}
                        </span>
                        <span>·</span>
                        <span>中獎：{record.wonAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Claim Action and Status */}
                  <div className="flex items-center gap-3 shrink-0 justify-end">
                    {record.claimed ? (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            已領取
                          </span>
                          {record.claimedAt && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {record.claimedAt} 簽領
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleClaim(record.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="取消領取註記"
                        >
                          取消領取
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleClaim(record.id)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>標記已領取</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          {showConfirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-600 font-medium">確定要清除所有得獎記錄？</span>
              <button
                type="button"
                onClick={() => {
                  onResetWinners();
                  setShowConfirmReset(false);
                }}
                className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
              >
                確認重設
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              disabled={winners.length === 0}
              className="text-slate-500 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空得獎名冊</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
