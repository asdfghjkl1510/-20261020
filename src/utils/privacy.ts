/**
 * Privacy & PII (Personally Identifiable Information) masking utilities
 * Ensures public auditorium projection screens never expose sensitive student data
 */

/**
 * Mask Student ID (學號遮蔽)
 * e.g. "413777367" -> "413****67"
 * e.g. "114514" -> "11**14"
 */
export function maskStudentId(id: string): string {
  if (!id) return '';
  const trimmed = id.trim();
  const chars = Array.from(trimmed);
  const len = chars.length;

  if (len <= 4) {
    return `${chars[0]}**${chars[len - 1]}`;
  }

  if (len <= 7) {
    return `${chars.slice(0, 2).join('')}**${chars.slice(-2).join('')}`;
  }

  // 8 or more characters (standard 9-digit university IDs)
  return `${chars.slice(0, 3).join('')}****${chars.slice(-2).join('')}`;
}

/**
 * Mask Student Name (姓名遮蔽)
 * e.g. "張育誠" -> "張*誠"
 * e.g. "李豐" -> "李*"
 * e.g. "歐陽修誠" -> "歐**誠"
 */
export function maskStudentName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const chars = Array.from(trimmed);
  const len = chars.length;

  if (len <= 1) {
    return trimmed;
  }

  if (len === 2) {
    return `${chars[0]}*`;
  }

  if (len === 3) {
    return `${chars[0]}*${chars[2]}`;
  }

  // 4 or more characters
  return `${chars[0]}${'*'.repeat(len - 2)}${chars[len - 1]}`;
}
