import { LocationTarget } from '../types';

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export interface LocationMatchResult {
  nearestLocation: LocationTarget | null;
  distanceMeters: number;
  isInsideRadius: boolean;
  allowedLocationsCount: number;
}

export function findNearestLocation(
  userLat: number,
  userLng: number,
  locations: LocationTarget[]
): LocationMatchResult {
  const activeLocations = locations.filter((loc) => loc.isActive);
  if (activeLocations.length === 0) {
    return {
      nearestLocation: null,
      distanceMeters: Infinity,
      isInsideRadius: false,
      allowedLocationsCount: 0,
    };
  }

  let nearest: LocationTarget | null = null;
  let minDistance = Infinity;

  // First check if user is inside any active location's radius
  for (const loc of activeLocations) {
    const dist = calculateDistanceMeters(userLat, userLng, loc.latitude, loc.longitude);
    if (dist <= loc.radiusMeters) {
      return {
        nearestLocation: loc,
        distanceMeters: dist,
        isInsideRadius: true,
        allowedLocationsCount: activeLocations.length,
      };
    }
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }

  return {
    nearestLocation: nearest,
    distanceMeters: minDistance,
    isInsideRadius: false,
    allowedLocationsCount: activeLocations.length,
  };
}

/**
 * Parses "HH:mm" or "HH:mm:ss" into total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getCurrentTimeWIB(): string {
  const now = new Date();
  // Format as HH:mm:ss
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function getCurrentDateFormatted(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return now.toLocaleDateString('id-ID', options);
}

export interface TimeWindowStatus {
  isBefore: boolean;
  isOpen: boolean;
  isLate: boolean;
  isAfter: boolean;
  label: string;
  badgeColor: 'green' | 'amber' | 'red' | 'gray';
}

export function evaluateCheckInWindow(
  currentTimeStr: string,
  startTimeStr: string,
  endTimeStr: string,
  toleranceMinutes: number
): TimeWindowStatus {
  const currentMin = timeToMinutes(currentTimeStr);
  const startMin = timeToMinutes(startTimeStr);
  const endMin = timeToMinutes(endTimeStr);
  const toleranceEndMin = endMin + toleranceMinutes;

  if (currentMin < startMin) {
    return {
      isBefore: true,
      isOpen: false,
      isLate: false,
      isAfter: false,
      label: `Belum Dibuka (Mulai ${startTimeStr} WIB)`,
      badgeColor: 'gray',
    };
  }

  if (currentMin <= endMin) {
    return {
      isBefore: false,
      isOpen: true,
      isLate: false,
      isAfter: false,
      label: `Sesi Dibuka: Tepat Waktu (${startTimeStr} - ${endTimeStr})`,
      badgeColor: 'green',
    };
  }

  if (currentMin <= toleranceEndMin) {
    return {
      isBefore: false,
      isOpen: true,
      isLate: true,
      isAfter: false,
      label: `Masa Toleransi Terlambat (Batas akhir ${endTimeStr})`,
      badgeColor: 'amber',
    };
  }

  return {
    isBefore: false,
    isOpen: false,
    isLate: true,
    isAfter: true,
    label: `Sesi Check-In Telah Berakhir (${endTimeStr} WIB)`,
    badgeColor: 'red',
  };
}

export function evaluateCheckOutWindow(
  currentTimeStr: string,
  startTimeStr: string,
  endTimeStr: string
): TimeWindowStatus {
  const currentMin = timeToMinutes(currentTimeStr);
  const startMin = timeToMinutes(startTimeStr);
  const endMin = timeToMinutes(endTimeStr);

  if (currentMin < startMin) {
    return {
      isBefore: true,
      isOpen: false,
      isLate: false,
      isAfter: false,
      label: `Belum Waktu Check-Out (Mulai ${startTimeStr} WIB)`,
      badgeColor: 'gray',
    };
  }

  if (currentMin <= endMin) {
    return {
      isBefore: false,
      isOpen: true,
      isLate: false,
      isAfter: false,
      label: `Sesi Check-Out Dibuka (${startTimeStr} - ${endTimeStr} WIB)`,
      badgeColor: 'green',
    };
  }

  return {
    isBefore: false,
    isOpen: false,
    isLate: false,
    isAfter: true,
    label: `Sesi Check-Out Selesai (Batas ${endTimeStr} WIB)`,
    badgeColor: 'amber',
  };
}

export function calculateDuration(checkInTimeStr: string, checkOutTimeStr: string): string {
  if (!checkInTimeStr || !checkOutTimeStr) return '-';
  const startMin = timeToMinutes(checkInTimeStr);
  const endMin = timeToMinutes(checkOutTimeStr);
  const diff = Math.max(0, endMin - startMin);
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours} Jam ${minutes} Menit`;
}
