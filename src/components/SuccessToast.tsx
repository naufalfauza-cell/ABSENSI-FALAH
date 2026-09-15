import React from 'react';
import { CheckCircle2, MapPin, Clock, X } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface SuccessToastProps {
  record: AttendanceRecord | null;
  actionType: 'check-in' | 'check-out';
  onClose: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ record, actionType, onClose }) => {
  if (!record) return null;

  const isCheckIn = actionType === 'check-in';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-fuchsia-100 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-100 to-pink-100 text-fuchsia-700 flex items-center justify-center mx-auto mb-4 border border-fuchsia-200 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          {isCheckIn ? 'Check-In Berhasil!' : 'Check-Out Berhasil!'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Presensi panitia Falah Anda telah terverifikasi dan tersimpan dengan sukses.
        </p>

        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Nama Panitia:</span>
            <span className="font-bold text-slate-900">{record.memberName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Divisi:</span>
            <span className="font-semibold text-fuchsia-700">{record.division}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Waktu Presensi:</span>
            </span>
            <span className="font-mono font-bold text-slate-900">
              {isCheckIn ? record.checkInTime : record.checkOutTime} WIB
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Tag Lokasi:</span>
            </span>
            <span className="font-semibold text-slate-900 truncate max-w-[170px]">
              {isCheckIn ? record.checkInLocationName : record.checkOutLocationName || 'Posko Falah'}
            </span>
          </div>

          {isCheckIn && (
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="text-slate-500">Status Kedatangan:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  record.checkInStatus === 'Tepat Waktu'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {record.checkInStatus}
              </span>
            </div>
          )}

          {!isCheckIn && record.workDurationFormatted && (
            <div className="flex justify-between items-center border-t border-slate-200 pt-2">
              <span className="text-slate-700 font-bold">Total Jam Tugas:</span>
              <span className="font-bold text-fuchsia-700">{record.workDurationFormatted}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors shadow-sm"
        >
          Tutup &amp; Selesai
        </button>
      </div>
    </div>
  );
};
