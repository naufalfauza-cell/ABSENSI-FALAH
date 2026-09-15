import React from 'react';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { LocationTarget, GPSPosition } from '../types';
import { formatDistance, LocationMatchResult } from '../utils/geo';

interface LocationStatusCardProps {
  gps: GPSPosition | null;
  gpsLoading: boolean;
  gpsError: string | null;
  matchResult: LocationMatchResult;
  locations: LocationTarget[];
  onRefreshGPS: () => void;
  isSimulatedLocation: boolean;
  onToggleSimulateLocation: (useTarget: boolean) => void;
  requireLocationRadius: boolean;
}

export const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  gps,
  gpsLoading,
  gpsError,
  matchResult,
  locations,
  onRefreshGPS,
  isSimulatedLocation,
  onToggleSimulateLocation,
  requireLocationRadius,
}) => {
  const { nearestLocation, distanceMeters, isInsideRadius } = matchResult;
  const activeLocations = locations.filter((l) => l.isActive);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Validasi Tag Lokasi GPS</h3>
            <p className="text-xs text-slate-500">
              Sistem geofencing panitia ({activeLocations.length} titik resmi diizinkan)
            </p>
          </div>
        </div>

        <button
          type="button"
          id="refresh-gps-btn"
          onClick={onRefreshGPS}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
          title="Perbarui koordinat GPS sekarang"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-fuchsia-600' : ''}`} />
          <span>{gpsLoading ? 'Mencari...' : 'Perbarui GPS'}</span>
        </button>
      </div>

      {/* GPS Warning / Error */}
      {gpsError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Izin GPS Belum Aktif atau Terbatas</p>
            <p className="mt-0.5 text-amber-800">
              {gpsError}. Anda dapat mengklik tombol "Simulasi Berada di Lokasi" di bawah untuk mencoba simulasi lokasi.
            </p>
          </div>
        </div>
      )}

      {/* Primary Verification Status Box */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          isInsideRadius
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {isInsideRadius ? (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-sm">
                {isInsideRadius
                  ? 'Lokasi Terverifikasi (Di Dalam Radius)'
                  : 'Posisi Anda di Luar Radius'}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isInsideRadius
                    ? 'bg-emerald-200/80 text-emerald-900'
                    : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {isInsideRadius ? 'Valid' : requireLocationRadius ? 'Dibatasi' : 'Peringatan'}
              </span>
            </div>

            {nearestLocation ? (
              <div className="mt-2 text-xs space-y-1">
                <p>
                  Titik Terdekat:{' '}
                  <strong className="font-semibold">{nearestLocation.name}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
                  <span>
                    Jarak Anda: <strong>{formatDistance(distanceMeters)}</strong>
                  </span>
                  <span>
                    Batas Radius: <strong>{nearestLocation.radiusMeters} meter</strong>
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] truncate">{nearestLocation.address}</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-600">Belum ada titik lokasi yang aktif.</p>
            )}
          </div>
        </div>
      </div>

      {/* GPS Coordinate Details & Accuracy */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-slate-400" />
          <span>
            GPS:{' '}
            {gps ? (
              <span className="font-mono text-slate-800">
                {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)} (Akurasi: &plusmn;
                {Math.round(gps.accuracy)}m)
              </span>
            ) : (
              <span className="italic text-slate-400">Sedang mendeteksi sinyal GPS...</span>
            )}
          </span>
        </div>

        {/* Quick Testing Simulator Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="toggle-demo-location-btn"
            onClick={() => onToggleSimulateLocation(!isSimulatedLocation)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
              isSimulatedLocation
                ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isSimulatedLocation ? '✓ Mode Titik Falah Aktif' : '📍 Simulasi Titik Falah'}
          </button>
        </div>
      </div>

      {/* Available Designated Locations List */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
          <Layers className="w-3.5 h-3.5 text-fuchsia-600" />
          <span>Daftar Titik Lokasi Resmi Yang Ditentukan Panitia:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeLocations.map((loc) => {
            const isThisNearest = nearestLocation?.id === loc.id;
            return (
              <div
                key={loc.id}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isThisNearest && isInsideRadius
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate">{loc.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                    R: {loc.radiusMeters}m
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{loc.address}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
