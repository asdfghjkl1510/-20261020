import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, RotateCcw, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { PendingCandidate, PrivacySettings } from '../types/lottery';
import { maskStudentId, maskStudentName } from '../utils/privacy';

interface WinnerCelebrationModalProps {
  pendingCandidate: PendingCandidate | null;
  onConfirm: () => void;
  onReroll: (reason: string) => void;
  onClose: () => void;
  privacySettings: PrivacySettings;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  pendingCandidate,
  onConfirm,
  onReroll,
  onClose,
  privacySettings
}) => {
  const [showRerollReason, setShowRerollReason] = useState(false);
  const [rerollReason, setRerollReason] = useState('唱名三次不在現場');

  useEffect(() => {
    setShowRerollReason(false);
  }, [pendingCandidate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!pendingCandidate) return;
      if (e.key === 'Enter' && !showRerollReason) {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingCandidate, showRerollReason, onConfirm]);

  if (!pendingCandidate) return null;

  const { participant, prize, drawnAt } = pendingCandidate;

  const handleConfirmReroll = () => {
    onReroll(rerollReason);
    setShowRerollReason(false);
  };

  const renderedId = privacySettings.maskStudentId ? maskStudentId(participant.id) : participant.id;
  const renderedName = privacySettings.maskStudentName ? maskStudentName(participant.name) : participant.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col items-center text-center p-8 sm:p-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Trophy Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-amber-900 shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        {/* Won Prize Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>抽出獎項：{prize.name}</span>
        </div>

        {/* Pending Notice */}
        <div className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>待確認候選者 · 請確認同學在場並審核資格</span>
        </div>

        {/* Candidate Info Box (PII protected) */}
        <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-6 mb-5">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-wider mb-3">
            {renderedName}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
              {participant.department || '校園名冊'} {participant.grade}
            </span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs font-mono tabular-nums text-slate-800 flex items-center gap-1">
              {privacySettings.maskStudentId && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
              <span>學號：{renderedId}</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            抽出時間：{drawnAt}
          </div>
        </div>

        {/* Reroll Reason Picker if active */}
        {showRerollReason ? (
          <div className="w-full bg-amber-50/70 border border-amber-200 rounded-2xl p-4 mb-5 text-left space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>請選擇或輸入作廢重抽原因（將記入審計日誌）：</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {['唱名三次不在現場', '資格不符 / 已畢業', '自願放棄領取', '資料填寫錯誤'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRerollReason(reason)}
                  className={`py-1.5 px-2.5 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                    rerollReason === reason
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={rerollReason}
              onChange={(e) => setRerollReason(e.target.value)}
              placeholder="或輸入自訂重抽原因..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-800"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmReroll}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                確認作廢並重抽
              </button>
              <button
                type="button"
                onClick={() => setShowRerollReason(false)}
                className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          /* Normal Action Buttons: Confirm vs Reroll */
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRerollReason(true)}
              className="w-full sm:w-1/2 py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              <span>作廢重抽 (Reroll)</span>
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:w-1/2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>確認中獎 (Enter)</span>
            </button>
          </div>
        )}

        <div className="text-[11px] text-slate-400 mt-4">
          提示：點擊「確認中獎」後才會扣減獎品配額並寫入正式名冊；作廢重抽不影響獎品名額
        </div>
      </div>
    </div>
  );
};
