import React, { useState } from 'react';
import { LogIn, LogOut, CheckCircle2, AlertCircle, FileText, Camera, ShieldCheck, Calendar } from 'lucide-react';
import { CommitteeMember, AttendanceRecord, AppSettings, GPSPosition, EventSession } from '../types';
import { LocationMatchResult, evaluateCheckInWindow, evaluateCheckOutWindow } from '../utils/geo';

interface CheckInActionCardProps {
  member: CommitteeMember | null;
  attendanceRecord?: AttendanceRecord;
  settings: AppSettings;
  activeSession?: EventSession;
  gps: GPSPosition | null;
  matchResult: LocationMatchResult;
  currentTime: string;
  onCheckIn: (notes: string, photo?: string, sessionId?: string, sessionName?: string) => Promise<void>;
  onCheckOut: (notes: string, sessionId?: string) => Promise<void>;
  loading: boolean;
}

export const CheckInActionCard: React.FC<CheckInActionCardProps> = ({
  member,
  attendanceRecord,
  settings,
  activeSession,
  gps,
  matchResult,
  currentTime,
  onCheckIn,
  onCheckOut,
  loading,
}) => {
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const session = activeSession || settings.sessions?.[0] || {
    id: 'sesi-1',
    sessionNumber: 1,
    name: 'Gladi Bersih (Malam)',
    date: settings.eventDate || '2026-09-24',
    dayLabel: 'Kamis, 24 Sept 2026',
    agendaStartTime: '16:00',
    agendaEndTime: '21:00',
    checkInStartTime: settings.checkInStartTime,
    checkInEndTime: settings.checkInEndTime,
    checkInLateToleranceMinutes: settings.checkInLateToleranceMinutes,
    checkOutStartTime: settings.checkOutStartTime,
    checkOutEndTime: settings.checkOutEndTime,
  };

  const checkInWindow = evaluateCheckInWindow(
    currentTime,
    session.checkInStartTime,
    session.checkInEndTime,
    session.checkInLateToleranceMinutes
  );

  const checkOutWindow = evaluateCheckOutWindow(
    currentTime,
    session.checkOutStartTime,
    session.checkOutEndTime
  );

  // Status flags
  const hasCheckedIn = !!attendanceRecord?.checkInTime;
  const hasCheckedOut = !!attendanceRecord?.checkOutTime;

  // Location validation check
  const isLocationValid = matchResult.isInsideRadius;
  const locationBlocksAction = settings.requireLocationRadius && !isLocationValid;

  // Handle Photo capture via file input
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async () => {
    if (!member) return;

    if (!hasCheckedIn) {
      await onCheckIn(notes, photoPreview || undefined, session.id, session.name);
      setNotes('');
      setPhotoPreview(null);
    } else if (!hasCheckedOut) {
      await onCheckOut(notes, session.id);
      setNotes('');
    }
  };

  if (!member) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        <p className="font-semibold text-sm">Pilih nama panitia di atas terlebih dahulu untuk memproses absensi.</p>
      </div>
    );
  }

  // Case 1: Already finished both check-in and check-out for this session
  if (hasCheckedIn && hasCheckedOut) {
    return (
      <div className="bg-white rounded-2xl border border-fuchsia-200 p-6 shadow-xs text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-100 to-pink-100 text-fuchsia-700 flex items-center justify-center mx-auto mb-3 border border-fuchsia-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white text-xs font-bold mb-2 shadow-2xs">
          <span>{session.name} ({session.dayLabel})</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Kehadiran Sesi Ini Lengkap!</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          Terima kasih atas dedikasi dan kontribusi Anda, <strong>{member.name}</strong> ({member.division}).
        </p>

        <div className="mt-5 max-w-sm mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Sesi Agenda:</span>
            <span className="font-semibold text-slate-900">
              {session.name} ({session.agendaStartTime} - {session.agendaEndTime} WIB)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jam Check-In:</span>
            <span className="font-semibold text-slate-900">
              {attendanceRecord.checkInTime} WIB ({attendanceRecord.checkInStatus})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lokasi Check-In:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[180px]">
              {attendanceRecord.checkInLocationName || '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jam Check-Out:</span>
            <span className="font-semibold text-slate-900">{attendanceRecord.checkOutTime} WIB</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <span className="text-slate-700 font-bold">Total Durasi Tugas:</span>
            <span className="font-bold text-fuchsia-700">{attendanceRecord.workDurationFormatted || '-'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Ready for Check-in or Check-out
  const isCheckOutMode = hasCheckedIn && !hasCheckedOut;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">
              {isCheckOutMode ? 'Konfirmasi Check-Out Pulang' : 'Konfirmasi Check-In Masuk'}
            </h3>
            <span className="text-[11px] font-bold bg-fuchsia-50 text-fuchsia-800 px-2 py-0.5 rounded border border-fuchsia-200">
              Sesi {session.sessionNumber}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCheckOutMode
              ? `Check-in tercatat pukul ${attendanceRecord?.checkInTime} WIB. Selesaikan penugasan ${session.name}.`
              : `Presensi untuk ${session.name} (${session.dayLabel}) di Kampus B UNAIR.`}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isCheckOutMode ? 'bg-amber-100 text-amber-900' : 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200'
          }`}
        >
          {isCheckOutMode ? 'Langkah 2: Check-Out' : 'Langkah 1: Check-In'}
        </span>
      </div>

      {/* Warning if location is outside radius */}
      {locationBlocksAction && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Lokasi Belum Memenuhi Syarat Geofencing</p>
            <p className="mt-0.5 text-rose-800">
              Admin mewajibkan Anda berada di dalam radius posko resmi Kampus B UNAIR (terdekat: {matchResult.nearestLocation?.name || 'Kampus B UNAIR'}).
              Jika sedang bertugas dinas luar atau testing, hubungi admin atau klik "Simulasi Titik Falah" di kartu atas.
            </p>
          </div>
        </div>
      )}

      {/* Timing reminder notice */}
      {!isCheckOutMode && checkInWindow.isLate && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Perhatian: Melewati 2 Jam Pertama Check-In</span>
            <p className="text-amber-800 mt-0.5">
              Batas 2 jam pertama check-in tepat waktu adalah {session.checkInEndTime} WIB. Presensi Anda akan tercatat dengan status{' '}
              <strong>Terlambat</strong>.
            </p>
          </div>
        </div>
      )}

      {isCheckOutMode && !checkOutWindow.isOpen && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Di Luar Rentang 2 Jam Terakhir ({session.checkOutStartTime} - {session.checkOutEndTime} WIB)</span>
            <p className="text-blue-800 mt-0.5">
              Anda tetap dapat melakukan check-out lebih awal atau shift lembur jika penugasan selesai.
            </p>
          </div>
        </div>
      )}

      {/* Optional Note & Selfie Photo */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Keterangan / Catatan Tugas (Opsional)</span>
          </label>
          <input
            type="text"
            id="attendance-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isCheckOutMode
                ? 'Contoh: Laporan shift selesai, handover logistik aman'
                : 'Contoh: Hadir di posko gerbang barat UNAIR / persiapan ruangan'
            }
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Optional Photo Verification */}
        {!isCheckOutMode && (
          <div className="flex items-center gap-3">
            <label
              htmlFor="camera-input"
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 hover:bg-fuchsia-100 text-fuchsia-800 text-xs font-semibold transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>{photoPreview ? 'Ganti Foto Bukti' : 'Lampirkan Foto/Selfie (Opsional)'}</span>
            </label>
            <input
              id="camera-input"
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            {photoPreview && (
              <div className="flex items-center gap-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-8 h-8 rounded-md object-cover border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Hapus Foto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Submit Button */}
      <button
        type="button"
        id="submit-attendance-btn"
        onClick={handleAction}
        disabled={loading || (locationBlocksAction && !settings.allowOutsideWindow)}
        className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
          isCheckOutMode
            ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 shadow-rose-600/20'
            : 'bg-gradient-to-r from-fuchsia-700 via-pink-600 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 shadow-fuchsia-600/25'
        }`}
      >
        {loading ? (
          <span>Menyimpan ke Server...</span>
        ) : isCheckOutMode ? (
          <>
            <LogOut className="w-5 h-5" />
            <span>Check-Out Sekarang &bull; {session.name} ({currentTime} WIB)</span>
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            <span>Check-In Sekarang &bull; {session.name} ({currentTime} WIB)</span>
          </>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-600" />
        <span>
          Data tersimpan real-time ke sistem panitia dengan koordinat GPS Kampus B UNAIR &amp; cap waktu server.
        </span>
      </div>
    </div>
  );
};
