export type AttendanceAction = 'checkin' | 'checkout';

export interface RawGpsInput {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function isValidGps(input: RawGpsInput): boolean {
  return Number.isFinite(input.latitude) && input.latitude >= -90 && input.latitude <= 90
    && Number.isFinite(input.longitude) && input.longitude >= -180 && input.longitude <= 180
    && Number.isFinite(input.accuracy) && input.accuracy >= 0 && input.accuracy <= 1000;
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function jakartaParts(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).reduce<Record<string, string>>((result, part) => { result[part.type] = part.value; return result; }, {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}

export function minutesFromTime(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function isWithinTimeWindow(time: string, start: string, end: string): boolean {
  const value = minutesFromTime(time);
  return value >= minutesFromTime(start) && value <= minutesFromTime(end);
}

export function lateMinutes(time: string, checkInEnd: string, tolerance: number): number {
  return Math.max(0, minutesFromTime(time) - minutesFromTime(checkInEnd) - tolerance);
}
