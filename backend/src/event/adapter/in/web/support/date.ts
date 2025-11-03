export function formatDateOnly(value: Date): string {
  return value.toISOString().split('T')[0];
}

export default formatDateOnly;
