import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Gift, Check } from 'lucide-react';
import { Prize, Participant } from '../types/lottery';
import { PHYSICAL_PRIZES, DEFAULT_PARTICIPANTS, generateRandomParticipants } from '../data/mockData';

interface DataGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataset: (prizes: Prize[], participants: Participant[], resetWinners: boolean) => void;
}

export const DataGeneratorModal: React.FC<DataGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyDataset
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'PHYSICAL' | 'RANDOM'>('PHYSICAL');
  const [randomCount, setRandomCount] = useState<number>(30);
  const [resetWinners, setResetWinners] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleApply = () => {
    let targetPrizes: Prize[] = PHYSICAL_PRIZES;
    let targetParticipants: Participant[] = [];

    if (selectedPreset === 'PHYSICAL') {
      targetParticipants = DEFAULT_PARTICIPANTS;
    } else {
      targetParticipants = generateRandomParticipants(randomCount);
    }

    onApplyDataset(targetPrizes, targetParticipants, resetWinners);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">重新生成與載入預設資料</h2>
              <p className="text-xs text-slate-500">快速重製獎項配額與名冊，隨時開啟全新一輪抽獎</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            請選擇欲生成的預設資料組合：
          </label>

          {/* Preset Cards */}
          <div className="space-y-3">
            {/* Preset 1: Physical Campus Prizes */}
            <div
              onClick={() => setSelectedPreset('PHYSICAL')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedPreset === 'PHYSICAL'
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">校園盛典實體大獎 (iPad、AirPods、禮券)</span>
                  {selectedPreset === 'PHYSICAL' && <Check className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apple iPad、AirPods 4、羅技靜音人體工學鍵鼠組、小米快充行動電源、誠品書店禮券 1,000 元、全家商品卡（共 6 種實體獎項 · 16 個配額）。
                </p>
              </div>
            </div>

            {/* Preset 2: Random generator */}
            <div
              onClick={() => setSelectedPreset('RANDOM')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                selectedPreset === 'RANDOM'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/10'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">隨機動態生成全新名冊</span>
                  {selectedPreset === 'RANDOM' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  隨機生成跨系所多元同學名單，搭配校園大獎。
                </p>

                {selectedPreset === 'RANDOM' && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-emerald-200/60">
                    <span className="text-xs text-slate-600 font-medium">生成人數：</span>
                    {[20, 30, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRandomCount(num);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                          randomCount === num
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {num} 人
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reset checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={resetWinners}
                onChange={(e) => setResetWinners(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">同時清除已抽出的得獎紀錄，讓獎品名額全數回滿</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>確認生成並載入</span>
          </button>
        </div>
      </div>
    </div>
  );
};
