/**
 * Privacy protection utilities for PII (Personally Identifiable Information)
 * Controls masking and visibility between Front-end (public/member view) and Back-end (admin view)
 */

export function maskIdNumber(idStr: string): string {
  if (!idStr) return '-';
  const clean = idStr.trim();
  if (clean.length < 5) return '******';
  return clean.slice(0, 2) + '****' + clean.slice(-3);
}

export function maskPhone(phoneStr: string): string {
  if (!phoneStr) return '-';
  const clean = phoneStr.trim();
  if (clean.length < 8) return '****';
  // If formatted like 0972-573495 or 0972573495
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}-***-${digits.slice(7)}`;
  }
  return clean.slice(0, 4) + '***' + clean.slice(-3);
}

export function maskBirthDate(dateStr: string): string {
  if (!dateStr) return '-';
  // Keep year/masked month or confidential badge
  return '••••-••-•• (後台可見)';
}

export function maskEmail(emailStr: string): string {
  if (!emailStr) return '-';
  const parts = emailStr.split('@');
  if (parts.length !== 2) return '***@***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name[0]}***${name.slice(-1)}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

export function maskAddress(addressStr: string): string {
  if (!addressStr) return '-';
  // Show city/district only if possible
  const match = addressStr.match(/^(.{2,3}[縣市].{2,3}[區鄉鎮市])/);
  if (match) {
    return `${match[1]} •••••• (後台可見)`;
  }
  return '•••••• (後台可見)';
}

export const PII_FIELD_KEYS = [
  'idNumber',
  'birthDate',
  'phone',
  'email',
  'emergencyContact',
  'emergencyPhone',
  'address',
  'medicalHistory',
  'insuranceBeneficiary',
  'bloodType',
];

export function isSensitiveField(key: string): boolean {
  return PII_FIELD_KEYS.includes(key);
}
