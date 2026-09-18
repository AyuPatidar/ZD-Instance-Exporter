export function formatDateUTC(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export function formatDateSafe(dateStr?: string | null): string {
  return formatDateUTC(dateStr);
}
