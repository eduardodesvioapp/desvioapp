/**
 * Date utility functions
 *
 * All timestamps from Supabase are stored in UTC.
 * These helpers ensure the suffix 'Z' is always present so the
 * browser interprets the value as UTC and converts it to the
 * user's local timezone automatically.
 */

/**
 * Parses an ISO date string from Supabase, ensuring UTC interpretation.
 * @param {string | Date} value
 * @returns {Date}
 */
export function parseUTC(value) {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  // If there is no timezone indicator, append 'Z' to mark it as UTC
  const str = String(value);
  const hasTimezone = str.endsWith('Z') || str.includes('+') || /[-+]\d{2}:\d{2}$/.test(str);
  return new Date(hasTimezone ? str : str + 'Z');
}

/**
 * Formats a date as HH:MM in the user's local timezone.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatTime(value) {
  const d = parseUTC(value);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats a date as DD/MM in the user's local timezone.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatDate(value) {
  const d = parseUTC(value);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Formats a date as DD/MM/YYYY HH:MM in the user's local timezone.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatDateTime(value) {
  const d = parseUTC(value);
  if (isNaN(d)) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * If the date is today, shows HH:MM. Otherwise shows DD/MM.
 * Ideal for conversation list timestamps.
 * @param {string | Date} value
 * @returns {string}
 */
export function formatConversationTime(value) {
  const d = parseUTC(value);
  if (isNaN(d)) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday ? formatTime(d) : formatDate(d);
}
