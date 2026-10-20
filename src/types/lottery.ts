export interface Prize {
  id: string;
  name: string;
  quota: number;
  order: number;
  description?: string;
}

export interface Participant {
  id: string; // 學號
  name: string;
  department: string;
  grade: string;
  email?: string;
}

export interface ApiResponse {
  status: string;
  timestamp?: string;
  prizes?: Prize[];
  participants: Participant[];
}

export interface WinnerRecord {
  id: string;
  prizeId: string;
  prizeName: string;
  participant: Participant;
  wonAt: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface PendingCandidate {
  prize: Prize;
  participant: Participant;
  drawnAt: string;
}

export type LotteryStatus = 'IDLE' | 'ROLLING' | 'PENDING_CONFIRMATION';

export type AnimationMode = 'NORMAL' | 'FAST';

export type AuditAction = 
  | 'DRAW_CANDIDATE' 
  | 'CONFIRM_WINNER' 
  | 'REROLL_CANDIDATE' 
  | 'MARK_CLAIMED' 
  | 'MARK_UNCLAIMED' 
  | 'RESET_WINNERS' 
  | 'UPDATE_API';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  title: string;
  description: string;
  prizeName?: string;
  participantName?: string;
  participantId?: string;
}

export interface PrivacySettings {
  maskStudentId: boolean;   // Default: true
  maskStudentName: boolean; // Default: false (optional toggle for full anonymity)
}

