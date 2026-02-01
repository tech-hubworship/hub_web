export function toSeoulStartOfDayISO(dateYYYYMMDD: string) {
  // YYYY-MM-DDT00:00:00+09:00 → ISO (UTC)
  const d = new Date(`${dateYYYYMMDD}T00:00:00+09:00`);
  return d.toISOString();
}

export function toSeoulEndOfDayISO(dateYYYYMMDD: string) {
  // YYYY-MM-DDT23:59:59.999+09:00 → ISO (UTC)
  const d = new Date(`${dateYYYYMMDD}T23:59:59.999+09:00`);
  return d.toISOString();
}

export function clampDateParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // very small validation for YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

