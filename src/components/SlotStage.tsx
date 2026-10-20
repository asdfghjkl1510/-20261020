import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Award, ChevronLeft, ChevronRight, Zap, Film, Clock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Participant, Prize, LotteryStatus, PendingCandidate, WinnerRecord, AnimationMode, PrivacySettings } from '../types/lottery';
import { playTickSound, playFanfareSound } from '../utils/audio';
import { maskStudentId, maskStudentName } from '../utils/privacy';

interface SlotStageProps {
  prizes: Prize[];
  participants: Participant[];
  winners: WinnerRecord[];
  onCandidateDrawn: (candidate: PendingCandidate) => void;
  selectedPrizeIndex: number;
  onSelectPrizeIndex: (index: number) => void;
  animationMode: AnimationMode;
  onToggleAnimationMode: (mode: AnimationMode) => void;
  privacySettings: PrivacySettings;
  onTogglePrivacy: (settings: PrivacySettings) => void;
}

export const SlotStage: React.FC<SlotStageProps> = ({
  prizes,
  participants,
  winners,
  onCandidateDrawn,
  selectedPrizeIndex,
  onSelectPrizeIndex,
  animationMode,
  onToggleAnimationMode,
  privacySettings,
  onTogglePrivacy
}) => {
  // Filter out students who have already won confirmed prizes
  const wonParticipantIds = new Set(winners.map((w) => w.participant.id));
  const remainingCandidates = participants.filter((p) => !wonParticipantIds.has(p.id));

  // Current prize and its remaining quota
  const currentPrize = prizes[selectedPrizeIndex] || prizes[0] || {
    id: 'default_prize',
    name: '活動專題大獎',
    quota: 1,
    order: 1
  };

  const wonForThisPrize = winners.filter((w) => w.prizeId === currentPrize.id).length;
  const quotaRemaining = Math.max(0, currentPrize.quota - wonForThisPrize);

  // Lottery rolling state
  const [status, setStatus] = useState<LotteryStatus>('IDLE');
  const [displayedCandidate, setDisplayedCandidate] = useState<Participant | null>(
    remainingCandidates[0] || participants[0] || null
  );
  const [isDecelerating, setIsDecelerating] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(0);
  const [showPrivacyPopover, setShowPrivacyPopover] = useState(false);

  // Synchronous refs to prevent stale closure bugs
  const statusRef = useRef<LotteryStatus>('IDLE');
  const isDeceleratingRef = useRef<boolean>(false);
  const candidatePoolRef = useRef<Participant[]>(remainingCandidates);
  const currentPrizeRef = useRef<Prize>(currentPrize);
  const animationModeRef = useRef<AnimationMode>(animationMode);
  const onCandidateDrawnRef = useRef(onCandidateDrawn);

  // Timer refs
  const rollIntervalRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isDeceleratingRef.current = isDecelerating;
  }, [isDecelerating]);

  useEffect(() => {
    candidatePoolRef.current = remainingCandidates;
    if (!displayedCandidate && remainingCandidates.length > 0) {
      setDisplayedCandidate(remainingCandidates[0]);
    }
  }, [remainingCandidates, displayedCandidate]);

  useEffect(() => {
    currentPrizeRef.current = currentPrize;
    animationModeRef.current = animationMode;
    onCandidateDrawnRef.current = onCandidateDrawn;
  }, [currentPrize, animationMode, onCandidateDrawn]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, []);

  // Roll ticker handler
  const rollNext = useCallback(() => {
    const pool = candidatePoolRef.current;
    if (pool.length === 0) return;
    const randomIdx = Math.floor(Math.random() * pool.length);
    setDisplayedCandidate(pool[randomIdx]);
    playTickSound();
  }, []);

  // Stop rolling and lock in candidate with deceleration
  const handleStopRolling = useCallback(() => {
    if (statusRef.current !== 'ROLLING' || isDeceleratingRef.current) return;

    isDeceleratingRef.current = true;
    setIsDecelerating(true);

    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(0);

    const pool = candidatePoolRef.current;
    if (pool.length === 0) {
      statusRef.current = 'IDLE';
      isDeceleratingRef.current = false;
      setStatus('IDLE');
      setIsDecelerating(false);
      return;
    }

    const winnerIndex = Math.floor(Math.random() * pool.length);
    const lockedCandidate = pool[winnerIndex];

    const isFast = animationModeRef.current === 'FAST';
    let delay = isFast ? 40 : 60;
    let step = 0;
    const maxSteps = isFast ? 4 : 12;

    const decelerate = () => {
      step++;
      if (step < maxSteps) {
        const tempIdx = Math.floor(Math.random() * pool.length);
        setDisplayedCandidate(pool[tempIdx]);
        playTickSound();

        delay += isFast ? 35 : 25;
        stopTimeoutRef.current = window.setTimeout(decelerate, delay);
      } else {
        setDisplayedCandidate(lockedCandidate);
        statusRef.current = 'IDLE';
        isDeceleratingRef.current = false;
        setStatus('IDLE');
        setIsDecelerating(false);

        playFanfareSound();

        const candidate: PendingCandidate = {
          prize: currentPrizeRef.current,
          participant: lockedCandidate,
          drawnAt: new Date().toLocaleTimeString('zh-TW', { hour12: false })
        };
        onCandidateDrawnRef.current(candidate);
      }
    };

    stopTimeoutRef.current = window.setTimeout(decelerate, delay);
  }, []);

  const handleStopRollingRef = useRef(handleStopRolling);
  useEffect(() => {
    handleStopRollingRef.current = handleStopRolling;
  }, [handleStopRolling]);

  // Start rolling animation with automatic stop timer
  const handleStartRolling = useCallback(() => {
    if (remainingCandidates.length === 0) return;
    if (quotaRemaining <= 0) return;
    if (statusRef.current === 'ROLLING' || isDeceleratingRef.current) return;

    statusRef.current = 'ROLLING';
    isDeceleratingRef.current = false;
    setStatus('ROLLING');
    setIsDecelerating(false);

    const isFast = animationModeRef.current === 'FAST';
    const speed = isFast ? 30 : 40;
    rollIntervalRef.current = window.setInterval(rollNext, speed);

    const autoDurationMs = isFast ? 1000 : 3200;
    setCountdownRemaining(isFast ? 1.0 : 3.2);

    const startTime = Date.now();
    countdownIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (autoDurationMs - elapsed) / 1000);
      setCountdownRemaining(Number(remaining.toFixed(1)));
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 100);

    autoStopTimeoutRef.current = window.setTimeout(() => {
      handleStopRollingRef.current();
    }, autoDurationMs);
  }, [remainingCandidates.length, quotaRemaining, rollNext]);

  // Spacebar hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (statusRef.current === 'IDLE') {
          if (candidatePoolRef.current.length > 0 && quotaRemaining > 0) {
            handleStartRolling();
          }
        } else if (statusRef.current === 'ROLLING' && !isDeceleratingRef.current) {
          handleStopRolling();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quotaRemaining, handleStartRolling, handleStopRolling]);

  // Prize Navigation
  const handlePrevPrize = () => {
    if (prizes.length <= 1 || status === 'ROLLING') return;
    onSelectPrizeIndex(selectedPrizeIndex > 0 ? selectedPrizeIndex - 1 : prizes.length - 1);
  };

  const handleNextPrize = () => {
    if (prizes.length <= 1 || status === 'ROLLING') return;
    onSelectPrizeIndex(selectedPrizeIndex < prizes.length - 1 ? selectedPrizeIndex + 1 : 0);
  };

  // PII Formatted display values
  const getRenderedId = (id: string) => {
    return privacySettings.maskStudentId ? maskStudentId(id) : id;
  };

  const getRenderedName = (name: string) => {
    return privacySettings.maskStudentName ? maskStudentName(name) : name;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* 1. Public Stage Controls: Prize Selector, Quota, Animation Mode, Privacy Toggle */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Prize Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevPrize}
            disabled={status === 'ROLLING' || prizes.length <= 1}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="上一個獎項"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">當前抽取獎項</div>
              <div className="text-base font-bold text-slate-900 leading-tight">
                {currentPrize.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextPrize}
            disabled={status === 'ROLLING' || prizes.length <= 1}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="下一個獎項"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Stage Bar: Privacy, Animation Mode, Quota */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Privacy Protection Button & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPrivacyPopover(!showPrivacyPopover)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                privacySettings.maskStudentId || privacySettings.maskStudentName
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="投影個資遮蔽保護設定"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>個資遮蔽保護</span>
            </button>

            {showPrivacyPopover && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-30 text-xs space-y-2.5 animate-in fade-in">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>投影大螢幕隱私保護</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">校園個資法規</span>
                </div>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.maskStudentId}
                    onChange={(e) => onTogglePrivacy({ ...privacySettings, maskStudentId: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>遮蔽學號中間碼 (413****67)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.maskStudentName}
                    onChange={(e) => onTogglePrivacy({ ...privacySettings, maskStudentName: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>遮蔽姓名中字 (張*誠)</span>
                </label>

                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  工作人員專用名錄中仍可檢視完整學號進行發獎簽領。
                </p>
              </div>
            )}
          </div>

          {/* Animation Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              disabled={status === 'ROLLING'}
              onClick={() => onToggleAnimationMode('NORMAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                animationMode === 'NORMAL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="一般模式：自動跑 3.2 秒後平滑煞車定格"
            >
              <Film className="w-3.5 h-3.5" />
              <span>一般動畫 (3.2s)</span>
            </button>
            <button
              type="button"
              disabled={status === 'ROLLING'}
              onClick={() => onToggleAnimationMode('FAST')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                animationMode === 'FAST'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="快速模式：自動跑 1.0 秒後極速定格"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>快速抽獎 (1.0s)</span>
            </button>
          </div>

          {/* Quota Badge */}
          <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold flex items-center gap-1.5">
            <span className="text-slate-500">配額：</span>
            <span className={`font-mono-num px-2 py-0.5 rounded-md ${
              quotaRemaining > 0 
                ? 'bg-emerald-50 text-emerald-700 font-bold' 
                : 'bg-rose-50 text-rose-700'
            }`}>
              剩餘 {quotaRemaining} / 共 {currentPrize.quota}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Public Live Marquee Screen */}
      <div className={`w-full relative rounded-3xl bg-white border transition-all duration-300 p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center text-center overflow-hidden ${
        status === 'ROLLING'
          ? 'border-indigo-300 shadow-xl ring-2 ring-indigo-500/10'
          : 'border-slate-200/90 shadow-lg'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/25 via-white to-slate-50/40 pointer-events-none" />

        {/* Top: Department, Grade, Student ID (Masked for privacy) */}
        <div className="relative z-10 min-h-[36px] flex flex-wrap items-center justify-center gap-2.5 mb-4">
          {displayedCandidate ? (
            <>
              <div className="px-3.5 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                {displayedCandidate.department || '校園名冊'} 
                {displayedCandidate.grade && ` · ${displayedCandidate.grade}`}
              </div>
              <div className="px-3.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-mono font-bold text-indigo-700 tabular-nums flex items-center gap-1.5">
                {privacySettings.maskStudentId && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                <span>學號：{getRenderedId(displayedCandidate.id)}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 font-medium">候選名單準備中</div>
          )}
        </div>

        {/* Center: Massive Student Name (Optional masking support) */}
        <div className="relative z-10 w-full py-6 sm:py-8 flex items-center justify-center">
          <div className={`transition-all duration-75 select-none ${
            status === 'ROLLING' ? 'animate-slot-blur scale-105' : 'scale-100'
          }`}>
            {displayedCandidate ? (
              <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-wider text-slate-900 drop-shadow-xs">
                {getRenderedName(displayedCandidate.name)}
              </span>
            ) : (
              <span className="text-4xl sm:text-5xl font-bold text-slate-300">
                名單已全數抽出
              </span>
            )}
          </div>
        </div>

        {/* Bottom Line: Public instruction and live countdown */}
        <div className="relative z-10 min-h-[28px] mt-2 text-xs font-medium text-slate-500 flex items-center gap-2">
          {status === 'ROLLING' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-indigo-700 font-bold">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>
                {isDecelerating
                  ? '鎖定中...'
                  : `自動停止倒數：${countdownRemaining.toFixed(1)} 秒（或按 Space 提早停）`}
              </span>
            </div>
          ) : remainingCandidates.length === 0 ? (
            <span className="text-amber-600 font-medium">本期名單中所有同學皆已中獎</span>
          ) : quotaRemaining === 0 ? (
            <span className="text-slate-500 font-medium">
              本獎項名額已滿，請切換上方箭頭抽取下一個獎項
            </span>
          ) : (
            <span className="text-slate-500">
              點擊下方按鈕或按 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px] text-slate-700">Space</kbd> 開始抽獎（會依模式自動停止）
            </span>
          )}
        </div>
      </div>

      {/* 3. Grand Action Button */}
      <div className="w-full flex flex-col items-center mt-8">
        {status === 'ROLLING' ? (
          <button
            type="button"
            onClick={handleStopRolling}
            disabled={isDecelerating}
            className="w-full sm:w-96 py-5 px-8 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-98 text-white rounded-2xl shadow-xl shadow-rose-600/20 text-xl font-black tracking-wide transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
          >
            <Square className="w-6 h-6 fill-white" />
            <span>
              {isDecelerating
                ? '鎖定中...'
                : `提前揭曉 (${countdownRemaining.toFixed(1)}s 自動停)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartRolling}
            disabled={remainingCandidates.length === 0 || quotaRemaining <= 0}
            className="w-full sm:w-80 py-5 px-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-98 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-2xl shadow-xl shadow-indigo-600/25 text-xl font-black tracking-wide transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>開始抽獎 (Space)</span>
          </button>
        )}

        <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
          <span>待抽候選：<strong className="text-slate-800 font-mono-num">{remainingCandidates.length}</strong> 人</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>
            {animationMode === 'FAST'
              ? '⚡ 快速模式：滾動 1.0 秒自動定格'
              : '🎬 一般模式：滾動 3.2 秒自動平滑減速定格'}
          </span>
        </div>
      </div>
    </div>
  );
};
