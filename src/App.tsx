/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { SlotStage } from './components/SlotStage';
import { ApiConfigModal } from './components/ApiConfigModal';
import { WinnersListModal } from './components/WinnersListModal';
import { WinnerCelebrationModal } from './components/WinnerCelebrationModal';
import { AuditLogModal } from './components/AuditLogModal';
import { DataGeneratorModal } from './components/DataGeneratorModal';
import { DEFAULT_PARTICIPANTS, DEFAULT_PRIZES } from './data/mockData';
import { getSavedApiUrl, fetchLotteryData } from './services/lotteryService';
import { Prize, Participant, WinnerRecord, PendingCandidate, AuditLogEntry, AnimationMode, PrivacySettings } from './types/lottery';
import { fireCelebrationConfetti } from './utils/confetti';
import { playFanfareSound } from './utils/audio';

const STORAGE_CONFIRMED_WINNERS_KEY = 'campus_lottery_confirmed_winners_v3';
const STORAGE_AUDIT_LOGS_KEY = 'campus_lottery_audit_logs_v3';
const STORAGE_ANIMATION_MODE_KEY = 'campus_lottery_anim_mode';
const STORAGE_PRIVACY_SETTINGS_KEY = 'campus_lottery_privacy_settings_v2';

export default function App() {
  const [apiUrl, setApiUrl] = useState<string>(getSavedApiUrl());
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [selectedPrizeIndex, setSelectedPrizeIndex] = useState(0);

  // Animation mode: Normal vs Fast
  const [animationMode, setAnimationMode] = useState<AnimationMode>(() => {
    if (typeof window === 'undefined') return 'NORMAL';
    return (localStorage.getItem(STORAGE_ANIMATION_MODE_KEY) as AnimationMode) || 'NORMAL';
  });

  // Privacy protection settings (PII desensitization on projection screen - Default: BOTH TRUE)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    if (typeof window === 'undefined') return { maskStudentId: true, maskStudentName: true };
    try {
      const stored = localStorage.getItem(STORAGE_PRIVACY_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          maskStudentId: parsed.maskStudentId !== false,
          maskStudentName: parsed.maskStudentName !== false
        };
      }
    } catch {
      // fallback
    }
    return { maskStudentId: true, maskStudentName: true };
  });

  // Confirmed winners list (persisted in localStorage)
  const [winners, setWinners] = useState<WinnerRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_CONFIRMED_WINNERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Audit Logs (persisted in localStorage)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [pendingCandidate, setPendingCandidate] = useState<PendingCandidate | null>(null);

  // Save animation mode
  const handleToggleAnimationMode = (mode: AnimationMode) => {
    setAnimationMode(mode);
    try {
      localStorage.setItem(STORAGE_ANIMATION_MODE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  // Save privacy settings
  const handleUpdatePrivacySettings = (settings: PrivacySettings) => {
    setPrivacySettings(settings);
    try {
      localStorage.setItem(STORAGE_PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  };

  // Helper to append and persist audit logs
  const appendAuditLog = (
    action: AuditLogEntry['action'],
    title: string,
    description: string,
    extra?: { prizeName?: string; participantName?: string; participantId?: string }
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      action,
      title,
      description,
      ...extra
    };

    setAuditLogs((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Initial load from GAS API if URL is configured
  useEffect(() => {
    const savedUrl = getSavedApiUrl();
    if (savedUrl) {
      setApiUrl(savedUrl);
      fetchLotteryData(savedUrl).then((res) => {
        if (res.success && res.data) {
          setPrizes(res.data.prizes);
          setParticipants(res.data.participants);
        }
      });
    }
  }, []);

  // 1. When slot machine locks in a candidate (Pending Confirmation)
  const handleCandidateDrawn = (candidate: PendingCandidate) => {
    setPendingCandidate(candidate);
    appendAuditLog(
      'DRAW_CANDIDATE',
      '抽出待確認候選者',
      `抽出同學 ${candidate.participant.name}（學號：${candidate.participant.id}），等待主持人資格確認`,
      {
        prizeName: candidate.prize.name,
        participantName: candidate.participant.name,
        participantId: candidate.participant.id
      }
    );
  };

  // 2. Host confirms candidate as Official Winner
  const handleConfirmWinner = () => {
    if (!pendingCandidate) return;

    const record: WinnerRecord = {
      id: `win_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      prizeId: pendingCandidate.prize.id,
      prizeName: pendingCandidate.prize.name,
      participant: pendingCandidate.participant,
      wonAt: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      claimed: false
    };

    setWinners((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem(STORAGE_CONFIRMED_WINNERS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    appendAuditLog(
      'CONFIRM_WINNER',
      '正式確認中獎',
      `工作人員確認 ${record.participant.name}（${record.participant.department} ${record.participant.grade}，學號：${record.participant.id}）獲得【${record.prizeName}】，正式列入得獎名單`,
      {
        prizeName: record.prizeName,
        participantName: record.participant.name,
        participantId: record.participant.id
      }
    );

    fireCelebrationConfetti();
    playFanfareSound();

    const wonCountForThisPrize = winners.filter((w) => w.prizeId === pendingCandidate.prize.id).length + 1;
    if (wonCountForThisPrize >= pendingCandidate.prize.quota) {
      const nextAvailableIndex = prizes.findIndex((p, idx) => {
        if (idx <= selectedPrizeIndex) return false;
        const won = winners.filter((w) => w.prizeId === p.id).length;
        return won < p.quota;
      });
      if (nextAvailableIndex !== -1) {
        setSelectedPrizeIndex(nextAvailableIndex);
      }
    }

    setPendingCandidate(null);
  };

  // 3. Host rerolls candidate
  const handleRerollCandidate = (reason: string) => {
    if (!pendingCandidate) return;

    appendAuditLog(
      'REROLL_CANDIDATE',
      '候選者作廢重抽',
      `候選同學 ${pendingCandidate.participant.name}（學號：${pendingCandidate.participant.id}）經主持判定作廢。原因：${reason}。獎品配額保留，名單未列入正式名冊`,
      {
        prizeName: pendingCandidate.prize.name,
        participantName: pendingCandidate.participant.name,
        participantId: pendingCandidate.participant.id
      }
    );

    setPendingCandidate(null);
  };

  // 4. Staff toggles prize claimed status
  const handleToggleClaim = (winnerId: string) => {
    setWinners((prev) => {
      const updated = prev.map((w) => {
        if (w.id === winnerId) {
          const nextClaimed = !w.claimed;
          const claimedTime = nextClaimed
            ? new Date().toLocaleTimeString('zh-TW', { hour12: false })
            : undefined;

          appendAuditLog(
            nextClaimed ? 'MARK_CLAIMED' : 'MARK_UNCLAIMED',
            nextClaimed ? '獎品領取簽核' : '取消領取註記',
            `同學 ${w.participant.name}（學號：${w.participant.id}）之【${w.prizeName}】標記為 ${
              nextClaimed ? '已領取' : '尚未領取'
            }`,
            {
              prizeName: w.prizeName,
              participantName: w.participant.name,
              participantId: w.participant.id
            }
          );

          return {
            ...w,
            claimed: nextClaimed,
            claimedAt: claimedTime
          };
        }
        return w;
      });

      try {
        localStorage.setItem(STORAGE_CONFIRMED_WINNERS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // 5. Reset all winners
  const handleResetWinners = () => {
    appendAuditLog(
      'RESET_WINNERS',
      '清空正式得獎名冊',
      `工作人員清空了所有已確認得獎紀錄（共 ${winners.length} 筆）`
    );
    setWinners([]);
    try {
      localStorage.removeItem(STORAGE_CONFIRMED_WINNERS_KEY);
    } catch {
      // Ignore
    }
  };

  // 6. Update API
  const handleUpdateData = (newUrl: string, newPrizes: Prize[], newParticipants: Participant[]) => {
    setApiUrl(newUrl);
    setPrizes(newPrizes);
    setParticipants(newParticipants);
    setSelectedPrizeIndex(0);
    appendAuditLog(
      'UPDATE_API',
      '更新 Google Apps Script API',
      `同步網址 ${newUrl}，載入 ${newParticipants.length} 位同學名冊與 ${newPrizes.length} 個獎項`
    );
    setIsConfigOpen(false);
  };

  const handleResetToDefault = () => {
    setApiUrl('');
    setPrizes(DEFAULT_PRIZES);
    setParticipants(DEFAULT_PARTICIPANTS);
    setSelectedPrizeIndex(0);
    appendAuditLog('UPDATE_API', '還原預設展示名冊', '切換為系統預設 20 人學生名冊與 8 個專題獎項');
    setIsConfigOpen(false);
  };

  // 7. Apply generated dataset from DataGeneratorModal
  const handleApplyDataset = (newPrizes: Prize[], newParticipants: Participant[], shouldResetWinners: boolean) => {
    setPrizes(newPrizes);
    setParticipants(newParticipants);
    setSelectedPrizeIndex(0);
    setPendingCandidate(null);

    if (shouldResetWinners) {
      setWinners([]);
      try {
        localStorage.removeItem(STORAGE_CONFIRMED_WINNERS_KEY);
      } catch {
        // Ignore
      }
    }

    appendAuditLog(
      'RESET_WINNERS',
      '重新生成載入預設資料',
      `重新生成 ${newPrizes.length} 個獎項與 ${newParticipants.length} 位同學名單${shouldResetWinners ? '（已同步重設得獎名冊）' : ''}`
    );
  };

  const wonParticipantIds = new Set(winners.map((w) => w.participant.id));
  const remainingCandidatesCount = participants.filter((p) => !wonParticipantIds.has(p.id)).length;
  const claimedCount = winners.filter((w) => w.claimed).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation */}
      <TopNav
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenWinners={() => setIsWinnersOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        totalParticipants={participants.length}
        remainingCandidates={remainingCandidatesCount}
        confirmedWinnersCount={winners.length}
        claimedCount={claimedCount}
        hasCustomApi={Boolean(apiUrl)}
      />

      {/* Main Public Presentation Stage: Live Event Clean Focus & PII Protection */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
        <SlotStage
          prizes={prizes}
          participants={participants}
          winners={winners}
          onCandidateDrawn={handleCandidateDrawn}
          selectedPrizeIndex={selectedPrizeIndex}
          onSelectPrizeIndex={setSelectedPrizeIndex}
          animationMode={animationMode}
          onToggleAnimationMode={handleToggleAnimationMode}
          privacySettings={privacySettings}
          onTogglePrivacy={handleUpdatePrivacySettings}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-200/70 bg-white/60 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>校園活動抽獎系統 · 免伺服器架構 · 現場投影個資保護</span>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Google Forms 表單收集</span>
            <span aria-hidden="true">→</span>
            <span>Google Sheets 配額管理</span>
            <span aria-hidden="true">→</span>
            <span>GAS 唯讀 JSON API</span>
          </div>
        </div>
      </footer>

      {/* 1. API Configuration Dialog */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentApiUrl={apiUrl}
        onUpdateData={handleUpdateData}
        onResetToDefault={handleResetToDefault}
      />

      {/* 2. Official Winners List & Claim Management Modal (with Full / Masked view & export) */}
      <WinnersListModal
        isOpen={isWinnersOpen}
        onClose={() => setIsWinnersOpen(false)}
        winners={winners}
        prizes={prizes}
        onToggleClaim={handleToggleClaim}
        onResetWinners={handleResetWinners}
      />

      {/* 3. Audit History Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
        logs={auditLogs}
      />

      {/* 4. Candidate Drawn Confirmation & Reroll Modal (with PII desensitization) */}
      <WinnerCelebrationModal
        pendingCandidate={pendingCandidate}
        onConfirm={handleConfirmWinner}
        onReroll={handleRerollCandidate}
        onClose={() => setPendingCandidate(null)}
        privacySettings={privacySettings}
      />

      {/* 5. Dataset Regenerator Modal */}
      <DataGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplyDataset={handleApplyDataset}
      />
    </div>
  );
}
