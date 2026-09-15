import type { GPSPosition } from './types';

export interface SecureAttendanceRequest {
  memberId: string;
  sessionId: string;
  gps: GPSPosition;
  notes?: string;
}

async function parseResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Permintaan presensi gagal');
  return data;
}

export async function secureCheckIn({ memberId, sessionId, gps, notes = '' }: SecureAttendanceRequest) {
  return parseResponse(await fetch('/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, sessionId, latitude: gps.latitude, longitude: gps.longitude, accuracy: gps.accuracy, notes }),
  }));
}

export async function secureCheckOut({ memberId, sessionId, gps, notes = '' }: SecureAttendanceRequest) {
  return parseResponse(await fetch('/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, sessionId, latitude: gps.latitude, longitude: gps.longitude, accuracy: gps.accuracy, notes }),
  }));
}

export async function getAttendanceStatus(memberId: string, sessionId: string) {
  const params = new URLSearchParams({ memberId, sessionId });
  return parseResponse(await fetch(`/api/attendance/status?${params.toString()}`));
}
