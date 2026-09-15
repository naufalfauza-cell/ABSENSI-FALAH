import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle, Moon, Sun, Award } from 'lucide-react';
import { EventSession, AttendanceRecord } from '../types';

interface SessionSelectorBarProps {
  sessions: EventSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  attendance: AttendanceRecord[];
  venueName?: string;
}

export const SessionSelectorBar: React.FC<SessionSelectorBarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  attendance,
  venueName = 'Kampus B Universitas Airlangga',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100 font-bold text-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Pilih Sesi Kegiatan (3 Hari Kepanitiaan)
              </h3>
              <span className="text-[11px] font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 px-2 py-0.5 rounded-full">
                3 Hari Kegiatan
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="font-medium text-slate-700">{venueName}</span>
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 self-end sm:self-center">
          Klik sesi untuk melihat jadwal &amp; presensi
        </span>
      </div>

      {/* 3 Sessions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sessions.map((session, index) => {
          const isSelected = session.id === activeSessionId;
          const sessionAttendanceCount = attendance.filter(
            (a) => (a.sessionId ? a.sessionId === session.id : a.date === session.date) && a.checkInTime
          ).length;

          // Icon based on session type
          const SessionIcon = index === 0 ? Moon : index === 1 ? Sun : Award;
          const iconColor =
            index === 0
              ? 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200'
              : index === 1
              ? 'text-pink-600 bg-pink-50 border-pink-200'
              : 'text-purple-700 bg-purple-50 border-purple-200';

          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelectSession(session.id)}
              className={`text-left p-3.5 rounded-xl border transition-all relative group cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-fuchsia-50/90 via-pink-50/50 to-white border-fuchsia-500 ring-2 ring-fuchsia-500/20 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs ${iconColor}`}>
                    <SessionIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Sesi {session.sessionNumber}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {session.name}
                    </h4>
                  </div>
                </div>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                    Pilih
                  </span>
                )}
              </div>

              {/* Date & Agenda Hours */}
              <div className="mt-1 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">{session.dayLabel}</span>
                  <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                    {session.agendaStartTime} - {session.agendaEndTime} WIB
                  </span>
                </div>

                {/* 2 Jam Pertama & 2 Jam Terakhir Windows */}
                <div className="pt-2 mt-2 border-t border-slate-200/60 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-fuchsia-800 block">
                      2 Jam Pertama (Check-In)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {session.checkInStartTime} - {session.checkInEndTime}
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-rose-700 block">
                      2 Jam Terakhir (Check-Out)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {session.checkOutStartTime} - {session.checkOutEndTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance count badge */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Hadir: <strong className="text-slate-800 font-bold">{sessionAttendanceCount}</strong> panitia</span>
                </span>
                <span className="text-[10px] text-fuchsia-700 font-semibold group-hover:underline">
                  {isSelected ? 'Sedang Dipilih' : 'Klik Beralih'} &rarr;
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
