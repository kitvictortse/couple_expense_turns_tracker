export function generateRoomId(): string {
  return crypto.randomUUID();
}

export function normalizeRoomId(value: string): string {
  return value.trim();
}
