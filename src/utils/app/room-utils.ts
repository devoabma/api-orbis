export function normalizeRoomName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '') // remove espaços e hifens
}
