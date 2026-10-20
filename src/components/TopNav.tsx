import React from 'react';
import { Settings, Volume2, VolumeX, Maximize2, Minimize2, Trophy, History, Users, Sparkles } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface TopNavProps {
  onOpenConfig: () => void;
  onOpenWinners: () => void;
  onOpenAuditLogs: () => void;
  onOpenGenerator: () => void;
  totalParticipants: number;
  remainingCandidates: number;
  confirmedWinnersCount: number;
  claimedCount: number;
  hasCustomApi: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenConfig,
  onOpenWinners,
  onOpenAuditLogs,
  onOpenGenerator,
  totalParticipants,
  remainingCandidates,
  confirmedWinnersCount,
  claimedCount,
  hasCustomApi
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
            抽
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              CAMPUS DRAW
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              校園活動無伺服器抽獎系統
            </span>
          </div>
        </div>

        {/* Zone 2: Clean unboxed stats */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>名冊 <strong className="text-slate-900 font-mono-num">{totalParticipants}</strong> 人</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>待抽 <strong className="text-indigo-600 font-mono-num">{remainingCandidates}</strong> 人</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>正式中獎 <strong className="text-slate-900 font-mono-num">{confirmedWinnersCount}</strong> 人</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-600 font-medium">已領取 {claimedCount} 人</span>
          </div>
        </div>

        {/* Zone 3: Staff Management Controls & Essential Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Regenerate default data */}
          <button
            type="button"
            onClick={onOpenGenerator}
            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
            title="重新生成或自訂預設獎項與名冊"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>生成預設資料</span>
          </button>

          {/* Winners & Claim Management */}
          <button
            type="button"
            onClick={onOpenWinners}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="查看正式中獎名冊與領獎簽核"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">中獎名錄</span>
            <span>({confirmedWinnersCount})</span>
          </button>

          {/* Audit History */}
          <button
            type="button"
            onClick={onOpenAuditLogs}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            title="查看抽獎、確認與重抽審計日誌"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">審計歷史</span>
          </button>

          {/* API Config Button */}
          <button
            type="button"
            onClick={onOpenConfig}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs cursor-pointer ${
              hasCustomApi
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            title="設定或更換 Google Apps Script API 網址"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API</span>
            <span>設定</span>
            {hasCustomApi && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="已連接自訂 API" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={soundOn ? '靜音' : '開啟音效'}
            aria-label="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex cursor-pointer"
            title={isFullscreen ? '退出全螢幕' : '全螢幕模式'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
