import { Prize, Participant } from '../types/lottery';

// 校園經典實體獎品與禮券清單 (預設 6 大獎項 · 16 個配額)
export const PHYSICAL_PRIZES: Prize[] = [
  { id: "prize_ipad", name: "Apple iPad 10th 代 64GB", quota: 1, order: 1, description: "特等獎 · 旗艦平板電腦" },
  { id: "prize_airpods", name: "Apple AirPods 4 主動降噪版", quota: 1, order: 2, description: "頭獎 · 無線藍牙耳機" },
  { id: "prize_keyboard", name: "Logitech 靜音人體工學鍵鼠組", quota: 2, order: 3, description: "貳獎 · 生產力周邊" },
  { id: "prize_powerbank", name: "小米 20000mAh 雙向快充行動電源", quota: 3, order: 4, description: "參獎 · 大容量電源" },
  { id: "prize_voucher_1000", name: "誠品書店禮券 1,000 元", quota: 4, order: 5, description: "肆獎 · 圖書文創禮券" },
  { id: "prize_card_200", name: "全家超商禮物卡 200 元", quota: 5, order: 6, description: "幸運獎 · 校園實用消費卡" }
];

export const DEFAULT_PRIZES = PHYSICAL_PRIZES;

// 預設示範名冊：使用標準合成校園示範名單（完全剔除任何真實個資）
export const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: "41271001", name: "陳冠宇", department: "人工智慧學系", grade: "大三", email: "41271001@university.edu.tw" },
  { id: "41271002", name: "林家豪", department: "資訊工程學系", grade: "大四", email: "41271002@university.edu.tw" },
  { id: "41271003", name: "黃心怡", department: "資訊管理學系", grade: "大二", email: "41271003@university.edu.tw" },
  { id: "41271004", name: "張廷宇", department: "電機工程學系", grade: "大三", email: "41271004@university.edu.tw" },
  { id: "41271005", name: "李詠晴", department: "數位設計學系", grade: "大四", email: "41271005@university.edu.tw" },
  { id: "41271006", name: "王柏翰", department: "人工智慧學系", grade: "大二", email: "41271006@university.edu.tw" },
  { id: "41271007", name: "吳子晴", department: "企業管理學系", grade: "大三", email: "41271007@university.edu.tw" },
  { id: "41271008", name: "劉彥廷", department: "教育科技學系", grade: "大四", email: "41271008@university.edu.tw" },
  { id: "41271009", name: "蔡佳穎", department: "資訊工程學系", grade: "大三", email: "41271009@university.edu.tw" },
  { id: "41271010", name: "楊宇軒", department: "人工智慧學系", grade: "大一", email: "41271010@university.edu.tw" },
  { id: "41271011", name: "許詩涵", department: "資訊管理學系", grade: "大四", email: "41271011@university.edu.tw" },
  { id: "41271012", name: "鄭翔宇", department: "電機工程學系", grade: "大二", email: "41271012@university.edu.tw" },
  { id: "41271013", name: "謝佩珊", department: "數位設計學系", grade: "大三", email: "41271013@university.edu.tw" },
  { id: "41271014", name: "洪宗翰", department: "人工智慧學系", grade: "大四", email: "41271014@university.edu.tw" },
  { id: "41271015", name: "郭品妤", department: "企業管理學系", grade: "大二", email: "41271015@university.edu.tw" },
  { id: "41271016", name: "邱柏宇", department: "資訊工程學系", grade: "大三", email: "41271016@university.edu.tw" },
  { id: "41271017", name: "曾郁婷", department: "教育科技學系", grade: "大四", email: "41271017@university.edu.tw" },
  { id: "41271018", name: "廖冠廷", department: "電機工程學系", grade: "大二", email: "41271018@university.edu.tw" },
  { id: "41271019", name: "賴雅婷", department: "資訊管理學系", grade: "大三", email: "41271019@university.edu.tw" },
  { id: "41271020", name: "徐子揚", department: "人工智慧學系", grade: "大四", email: "41271020@university.edu.tw" }
];

/**
 * 動態隨機生成示範學生名單 (可自訂筆數)
 */
export function generateRandomParticipants(count = 30): Participant[] {
  const lastNames = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '郭', '邱', '曾', '廖', '賴', '徐'];
  const firstNames = [
    '冠宇', '宗翰', '家豪', '冠廷', '柏翰', '彥廷', '宇軒', '柏宇', '廷宇', '翔宇',
    '品妤', '雅婷', '詠晴', '子晴', '婷婷', '心怡', '佳穎', '佩珊', '郁婷', '詩涵',
    '品皓', '承宏', '則皓', '秉宏', '俊杰', '豐榮', '佑安', '哲瑋', '揚翔', '景勝'
  ];
  const depts = [
    { dept: '人工智慧學系', prefix: 'AI' },
    { dept: '資訊工程學系', prefix: '資工' },
    { dept: '資訊管理學系', prefix: '資管' },
    { dept: '電機工程學系', prefix: '電機' },
    { dept: '企業管理學系', prefix: '企管' },
    { dept: '教育科技學系', prefix: '教設' },
    { dept: '數位設計學系', prefix: '數媒' }
  ];
  const grades = ['大一', '大二', '大三', '大四', '碩一', '碩二'];

  const list: Participant[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const deptInfo = depts[Math.floor(Math.random() * depts.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];

    let studentId = '';
    do {
      const year = 412;
      const num = 71000 + Math.floor(Math.random() * 900);
      studentId = `${year}${num}`;
    } while (usedIds.has(studentId));
    usedIds.add(studentId);

    list.push({
      id: studentId,
      name: `${lastName}${firstName}`,
      department: Math.random() > 0.5 ? deptInfo.prefix : deptInfo.dept,
      grade,
      email: `${studentId}@university.edu.tw`
    });
  }

  return list;
}
