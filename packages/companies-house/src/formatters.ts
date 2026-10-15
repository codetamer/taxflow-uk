import type { CompaniesHouseAddress } from './types.ts';

/**
 * Formats a Companies House officer name from "SURNAME, Firstname Middlename" to "Firstname Middlename Surname".
 */
export function formatOfficerName(rawName: string): string {
  if (!rawName) return '';
  const parts = rawName.split(',').map((p) => p.trim());
  if (parts.length < 2) {
    return rawName;
  }

  const surname = parts[0] || '';
  const forenamesAndTitle = parts[1] || '';

  // Title might be in a third segment or part of forenames
  const forenameTokens = forenamesAndTitle.split(/\s+/).map((t) => {
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  });

  const surnameFormatted = surname
    .split(/[-\s]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');

  return `${forenameTokens.join(' ')} ${surnameFormatted}`.trim();
}

/**
 * Formats a Companies House registered office address object into a single postal address string.
 */
export function formatAddress(addr?: CompaniesHouseAddress): string {
  if (!addr) {
    return 'Registered Office in England & Wales';
  }

  const parts: string[] = [];
  if (addr.premises && !addr.address_line_1?.startsWith(addr.premises)) {
    parts.push(addr.premises);
  }
  if (addr.address_line_1) parts.push(addr.address_line_1);
  if (addr.address_line_2) parts.push(addr.address_line_2);
  if (addr.locality) parts.push(addr.locality);
  if (addr.region) parts.push(addr.region);
  if (addr.postal_code) parts.push(addr.postal_code);
  if (addr.country && addr.country !== 'United Kingdom' && addr.country !== 'England') {
    parts.push(addr.country);
  }

  return parts.filter(Boolean).join(', ');
}
