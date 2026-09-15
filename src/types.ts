export interface LocationTarget {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 100 meters
  isActive: boolean;
  isPrimary?: boolean;
}

export interface EventSession {
  id: string; // 'sesi-1' | 'sesi-2' | 'sesi-3'
  sessionNumber: number; // 1, 2, 3
  name: string; // e.g. "Gladi Bersih (Malam)", "Hari Ke-1 Acara", "Hari Ke-2 Penutupan"
  date: string; // YYYY-MM-DD e.g. "2026-09-24"
  dayLabel: string; // "Kamis, 24 Sept 2026"
  agendaStartTime: string; // "16:00"
  agendaEndTime: string; // "21:00"
  checkInStartTime: string; // "16:00"
  checkInEndTime: string; // "18:00" (2 jam pertama)
  checkInLateToleranceMinutes: number; // 15
  checkOutStartTime: string; // "19:00" (2 jam terakhir)
  checkOutEndTime: string; // "21:00"
  description?: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  division: string;
  role: string;
  phone?: string;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  division: string;
  role: string;
  sessionId?: string; // e.g. 'sesi-1', 'sesi-2', 'sesi-3'
  sessionName?: string; // e.g. 'Gladi Bersih (Malam)'
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss
  checkInStatus?: 'Tepat Waktu' | 'Terlambat' | 'Di Luar Jam';
  checkInLocationId?: string;
  checkInLocationName?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDistanceMeters?: number;
  checkInInsideRadius?: boolean;
  checkInNotes?: string;
  checkInPhoto?: string; // base64 or photo URL

  checkOutTime?: string; // HH:mm:ss
  checkOutLocationId?: string;
  checkOutLocationName?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutDistanceMeters?: number;
  checkOutInsideRadius?: boolean;
  checkOutNotes?: string;
  
  workDurationFormatted?: string; // e.g. "7 Jam 45 Menit"
  createdAt: number;
}

export interface AppSettings {
  eventName: string;
  venueName: string; // "Kampus B Universitas Airlangga"
  activeSessionId: string; // 'sesi-1' | 'sesi-2' | 'sesi-3'
  sessions: EventSession[];

  // Mirrored values from active session for backward compatibility
  eventDate: string; // YYYY-MM-DD
  checkInStartTime: string; // "16:00"
  checkInEndTime: string; // "18:00"
  checkInLateToleranceMinutes: number; // e.g. 15
  checkOutStartTime: string; // "19:00"
  checkOutEndTime: string; // "21:00"
  requireLocationRadius: boolean; // if true, block or warn check-in outside radius
  allowOutsideWindow: boolean; // if true, allow check in outside window with note
  adminPin: string; // default "1945" or "1234"
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type OperationalState = 'closed' | 'checkin_open' | 'checkout_open' | 'completed';

export interface PublicDivision { id: string; name: string; }
export interface PublicMember { id: string; name: string; publicCode: string; divisionId: string; }
export interface PublicSession {
  id: string; sessionNumber: number; name: string; date: string; dayLabel: string;
  agendaStartTime: string; agendaEndTime: string; checkInStartTime: string; checkInEndTime: string;
  lateToleranceMinutes: number; checkOutStartTime: string; checkOutEndTime: string;
  description?: string; operationalState: OperationalState;
}
export interface PublicAttendance {
  id: string; sessionId: string; status: string; checkInStatus?: string; checkOutStatus?: string;
  checkInAt?: string; checkOutAt?: string; workDurationSeconds?: number;
}
