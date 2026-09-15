import React from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { AppSettings, EventSession } from '../types';
import { evaluateCheckInWindow, evaluateCheckOutWindow } from '../utils/geo';

interface TimeWindowCardProps {
  settings: AppSettings;
  activeSession?: EventSession;
  currentTime: string;
  currentDate: string;
}

export const TimeWindowCard: React.FC<TimeWindowCardProps> = ({
  settings,
  activeSession,
  currentTime,
  currentDate,
}) => {
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

  const checkInStatus = evaluateCheckInWindow(
    currentTime,
    session.checkInStartTime,
    session.checkInEndTime,
    session.checkInLateToleranceMinutes
  );

  const checkOutStatus = evaluateCheckOutWindow(
    currentTime,
    session.checkOutStartTime,
    session.checkOutEndTime
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">Batasan Jadwal Sesi Presensi</h3>
              <span className="text-[11px] font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 px-2 py-0.5 rounded-full">
                Sesi {session.sessionNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {session.name} &bull; Agenda: {session.agendaStartTime} - {session.agendaEndTime} WIB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-50/70 border border-fuchsia-100 text-fuchsia-900 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-fuchsia-600" />
          <span>{session.dayLabel || currentDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Check-In Window Box (2 Jam Pertama) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                2 Jam Pertama: Check-In Masuk
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Mulai pembukaan agenda
              </span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                checkInStatus.badgeColor === 'green'
                  ? 'bg-emerald-100 text-emerald-800'
                  : checkInStatus.badgeColor === 'amber'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {checkInStatus.isOpen ? 'Sesi Terbuka' : 'Sesi Ditutup'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              {session.checkInStartTime} - {session.checkInEndTime}
            </span>
            <span className="text-xs font-semibold text-slate-500">WIB</span>
          </div>

          <p className="text-xs text-slate-600">
            Toleransi: +{session.checkInLateToleranceMinutes} menit (setelahnya tercatat Terlambat).
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center gap-1.5 text-xs">
            {checkInStatus.isOpen ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span
              className={`font-medium ${
                checkInStatus.isOpen ? 'text-emerald-800' : 'text-slate-600'
              }`}
            >
              {checkInStatus.label}
            </span>
          </div>
        </div>

        {/* Check-Out Window Box (2 Jam Terakhir) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                2 Jam Terakhir: Check-Out Pulang
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Sebelum penutupan agenda
              </span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                checkOutStatus.badgeColor === 'green'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {checkOutStatus.isOpen ? 'Sesi Terbuka' : 'Sesi Ditutup'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              {session.checkOutStartTime} - {session.checkOutEndTime}
            </span>
            <span className="text-xs font-semibold text-slate-500">WIB</span>
          </div>

          <p className="text-xs text-slate-600">
            Check-out tersedia di 2 jam terakhir setelah menyelesaikan tugas kepanitiaan.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center gap-1.5 text-xs">
            {checkOutStatus.isOpen ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span
              className={`font-medium ${
                checkOutStatus.isOpen ? 'text-emerald-800' : 'text-slate-600'
              }`}
            >
              {checkOutStatus.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
