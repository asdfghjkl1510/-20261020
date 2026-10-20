import React, { useState } from 'react';
import { X, Globe, CheckCircle2, AlertCircle, RefreshCw, Database, ExternalLink, HelpCircle } from 'lucide-react';
import { fetchLotteryData, saveApiUrl } from '../services/lotteryService';
import { Prize, Participant } from '../types/lottery';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiUrl: string;
  onUpdateData: (url: string, prizes: Prize[], participants: Participant[]) => void;
  onResetToDefault: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  currentApiUrl,
  onUpdateData,
  onResetToDefault
}) => {
  const [urlInput, setUrlInput] = useState(currentApiUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Sync if currentApiUrl changes
  React.useEffect(() => {
    setUrlInput(currentApiUrl);
  }, [currentApiUrl]);

  if (!isOpen) return null;

  const handleTestAndConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = urlInput.trim();
    if (!targetUrl) {
      setStatusMessage({ type: 'error', text: '請輸入 Google Apps Script API 網址' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: '正在嘗試連線並讀取資料...' });

    const result = await fetchLotteryData(targetUrl);
    setIsLoading(false);

    if (result.success && result.data) {
      saveApiUrl(targetUrl);
      setStatusMessage({ type: 'success', text: result.message });
      onUpdateData(targetUrl, result.data.prizes, result.data.participants);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleClearUrl = () => {
    saveApiUrl('');
    setUrlInput('');
    onResetToDefault();
    setStatusMessage({ type: 'info', text: '已清除自訂 API，已切換回預設範例名單。' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Apps Script (GAS) API 設定</h2>
              <p className="text-xs text-slate-500">在網頁上直接填寫唯讀 JSON API 網址即可立刻同步名冊</p>
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          <form onSubmit={handleTestAndConnect} className="space-y-4">
            <div>
              <label htmlFor="apiUrlInput" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Google Apps Script Web App 網址 (API_URL)
              </label>
              <div className="relative">
                <input
                  id="apiUrlInput"
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-3.5 pr-20 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono text-slate-800"
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => setUrlInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
                  >
                    清空
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span>提示：網址必須以</span>
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">/exec</code>
                <span>結尾，且部署存取權限需設為「所有人 (Anyone)」</span>
              </p>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
                )}
                <div className="leading-relaxed break-all">
                  {statusMessage.text}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading || !urlInput.trim()}
                className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>連線中...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>連線並更新名冊 (Update API)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearUrl}
                className="w-full sm:w-auto py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>還原範例名單</span>
              </button>
            </div>
          </form>

          {/* Quick Help Collapsible */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>如何發布 Google Apps Script 唯讀 API？(步驟指南)</span>
            </button>

            {showGuide && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-2 border border-slate-200/70">
                <p className="font-semibold text-slate-800">GAS 唯讀 API 部署 4 步：</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                  <li>在 Google Sheet 點擊「擴充功能」&gt;「Apps Script」</li>
                  <li>貼上標準 JSON 輸出程式碼，回傳包含 <code className="bg-white px-1 py-0.5 rounded font-mono text-indigo-700 border border-slate-200">participants</code> 與 <code className="bg-white px-1 py-0.5 rounded font-mono text-indigo-700 border border-slate-200">prizes</code> 的物件</li>
                  <li>點擊右上角「部署 (Deploy)」&gt;「新增部署作業 (New deployment)」&gt; 類型選擇「網頁應用程式 (Web app)」</li>
                  <li>執行身分選「我」，<strong>誰可以存取選「所有人 (Anyone)」</strong>，複製產生的 <code className="bg-white px-1 py-0.5 rounded font-mono text-indigo-700 border border-slate-200">/exec</code> 網址貼於上方即可！</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>支援即時本地記憶體 (localStorage) 自動保存</span>
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
