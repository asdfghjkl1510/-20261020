import { ApiResponse, Participant, Prize } from '../types/lottery';
import { DEFAULT_PARTICIPANTS, DEFAULT_PRIZES } from '../data/mockData';

const STORAGE_API_KEY = 'campus_lottery_api_url';

export function getSavedApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_API_KEY) || '';
}

export function saveApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_API_KEY);
  } else {
    localStorage.setItem(STORAGE_API_KEY, url.trim());
  }
}

export interface FetchResult {
  success: boolean;
  message: string;
  data?: {
    prizes: Prize[];
    participants: Participant[];
    timestamp: string;
  };
}

export async function fetchLotteryData(url: string): Promise<FetchResult> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return {
      success: false,
      message: '請輸入有效的 Google Apps Script API 網址'
    };
  }

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Note: GAS web app redirects (302) to googleusercontent.com
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP 狀態碼錯誤: ${response.status} ${response.statusText}`);
    }

    const json = await response.json() as unknown;
    return normalizeApiResponse(json);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    let advice = '連線失敗，請檢查網址或網路狀況。';
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS')) {
      advice = '連線失敗或跨域限制 (CORS)。請確認 Google Apps Script (GAS) 部署時「誰可以存取 (Who has access)」設定為「所有人 (Anyone)」。';
    }
    return {
      success: false,
      message: `${advice} (${errorMsg})`
    };
  }
}

export function normalizeApiResponse(raw: unknown): FetchResult {
  if (!raw || typeof raw !== 'object') {
    return {
      success: false,
      message: 'API 回傳內容非有效 JSON 物件'
    };
  }

  const payload = raw as Partial<ApiResponse> & {
    data?: {
      prizes?: Prize[];
      participants?: Participant[];
    };
    candidates?: Participant[];
    list?: Participant[];
    students?: Participant[];
  };

  // Find participants list
  let rawParticipants: unknown[] = [];
  if (Array.isArray(payload.participants)) {
    rawParticipants = payload.participants;
  } else if (payload.data && Array.isArray(payload.data.participants)) {
    rawParticipants = payload.data.participants;
  } else if (Array.isArray(payload.candidates)) {
    rawParticipants = payload.candidates;
  } else if (Array.isArray(payload.students)) {
    rawParticipants = payload.students;
  } else if (Array.isArray(payload.list)) {
    rawParticipants = payload.list;
  } else if (Array.isArray(raw)) {
    rawParticipants = raw as unknown[];
  }

  if (rawParticipants.length === 0) {
    return {
      success: false,
      message: '在 API 回傳中找不到名冊名單 (participants 陣列為空)'
    };
  }

  // Normalize participants
  const participants: Participant[] = rawParticipants.map((item, index) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const id = String(row.id || row.studentId || row.student_id || row['學號'] || `id_${index + 1}`).trim();
    const name = String(row.name || row['姓名'] || row.studentName || `同學 ${index + 1}`).trim();
    const department = String(row.department || row.dept || row['系所'] || row['系級'] || '學生').trim();
    const grade = String(row.grade || row['年級'] || '').trim();
    const email = row.email ? String(row.email).trim() : undefined;

    return { id, name, department, grade, email };
  });

  // Find prizes
  let rawPrizes: unknown[] = [];
  if (Array.isArray(payload.prizes)) {
    rawPrizes = payload.prizes;
  } else if (payload.data && Array.isArray(payload.data.prizes)) {
    rawPrizes = payload.data.prizes;
  }

  const prizes: Prize[] = rawPrizes.length > 0
    ? rawPrizes.map((p, idx) => {
        const pObj = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        return {
          id: String(pObj.id || `prize_${idx + 1}`),
          name: String(pObj.name || pObj['獎項名稱'] || pObj['獎品'] || `獎品 ${idx + 1}`),
          quota: typeof pObj.quota === 'number' ? pObj.quota : Number(pObj['名額'] || 1),
          order: typeof pObj.order === 'number' ? pObj.order : idx + 1,
          description: pObj.description ? String(pObj.description) : ''
        };
      })
    : DEFAULT_PRIZES;

  return {
    success: true,
    message: `成功載入 ${participants.length} 位同學名單與 ${prizes.length} 個獎項！`,
    data: {
      prizes,
      participants,
      timestamp: payload.timestamp || new Date().toISOString()
    }
  };
}
