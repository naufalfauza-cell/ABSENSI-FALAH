import React, { useState } from 'react';
import { UserCheck, X, Check, AlertCircle, Calendar } from 'lucide-react';
import { CommitteeMember, EventSession } from '../../types';
import { DEFAULT_SESSIONS } from '../../data/defaultData';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CommitteeMember[];
  currentDate: string;
  sessions?: EventSession[];
  activeSessionId?: string;
  onSaveManual: (data: {
    memberId: string;
    date: string;
    sessionId?: string;
    sessionName?: string;
    checkInTime: string;
    checkOutTime?: string;
    checkInStatus: 'Tepat Waktu' | 'Terlambat';
    notes: string;
  }) => Promise<void>;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  members,
  currentDate,
  sessions = DEFAULT_SESSIONS,
  activeSessionId,
  onSaveManual,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState(activeSessionId || sessions[0]?.id || 'sesi-1');
  const [checkInTime, setCheckInTime] = useState('07:15');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState<'Tepat Waktu' | 'Terlambat'>('Tepat Waktu');
  const [notes, setNotes] = useState('Verifikasi Manual oleh Admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Pilih panitia terlebih dahulu.');
      return;
    }
    if (!checkInTime) {
      setError('Jam check-in wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSaveManual({
        memberId: selectedMemberId,
        date: currentSession ? currentSession.date : currentDate,
        sessionId: currentSession?.id,
        sessionName: currentSession?.name,
        checkInTime: `${checkInTime}:00`,
        checkOutTime: checkOutTime ? `${checkOutTime}:00` : undefined,
        checkInStatus: status,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan presensi manual');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Entri Presensi Manual Admin</h3>
              <p className="text-xs text-slate-500">Bypass GPS untuk panitia bermasalah perangkat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-fuchsia-600" />
              <span>Pilih Sesi Kegiatan *</span>
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-semibold text-slate-900"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Sesi {s.sessionNumber}: {s.name} ({s.dayLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Panitia *</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id} - {m.division})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Check-In Masuk *
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Check-Out (Opsional)
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kehadiran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Tepat Waktu')}
                className={`py-1.5 px-3 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                  status === 'Tepat Waktu'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ✓ Tepat Waktu
              </button>
              <button
                type="button"
                onClick={() => setStatus('Terlambat')}
                className={`py-1.5 px-3 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                  status === 'Terlambat'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ⚠ Terlambat
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan / Catatan Admin</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tugas lapangan luar Kampus B / HP baterai habis"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
