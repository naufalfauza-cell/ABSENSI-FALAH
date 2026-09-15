import React, { useState } from 'react';
import { Clock, Shield, Check, AlertCircle, Calendar, MapPin, Sparkles } from 'lucide-react';
import { AppSettings, EventSession } from '../../types';
import { DEFAULT_SESSIONS } from '../../data/defaultData';

interface AdminScheduleTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export const AdminScheduleTab: React.FC<AdminScheduleTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    sessions: settings.sessions && settings.sessions.length > 0 ? settings.sessions : DEFAULT_SESSIONS,
    venueName: settings.venueName || 'Kampus B Universitas Airlangga',
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof AppSettings, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSessionChange = (index: number, field: keyof EventSession, value: unknown) => {
    setFormData((prev) => {
      const nextSessions = [...(prev.sessions || DEFAULT_SESSIONS)];
      nextSessions[index] = { ...nextSessions[index], [field]: value };

      // If updating active session, also sync the top-level shortcut fields
      let nextState = { ...prev, sessions: nextSessions };
      if (nextSessions[index].id === prev.activeSessionId) {
        if (field === 'checkInStartTime') nextState.checkInStartTime = value as string;
        if (field === 'checkInEndTime') nextState.checkInEndTime = value as string;
        if (field === 'checkOutStartTime') nextState.checkOutStartTime = value as string;
        if (field === 'checkOutEndTime') nextState.checkOutEndTime = value as string;
        if (field === 'checkInLateToleranceMinutes') nextState.checkInLateToleranceMinutes = value as number;
      }
      return nextState;
    });
    setSavedSuccess(false);
  };

  const handleSelectActiveSession = (sessionId: string) => {
    const selected = (formData.sessions || DEFAULT_SESSIONS).find((s) => s.id === sessionId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        activeSessionId: sessionId,
        eventDate: selected.date,
        checkInStartTime: selected.checkInStartTime,
        checkInEndTime: selected.checkInEndTime,
        checkOutStartTime: selected.checkOutStartTime,
        checkOutEndTime: selected.checkOutEndTime,
        checkInLateToleranceMinutes: selected.checkInLateToleranceMinutes,
      }));
    } else {
      handleChange('activeSessionId', sessionId);
    }
    setSavedSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      await onUpdateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const sessionsList = formData.sessions || DEFAULT_SESSIONS;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h3 className="font-bold text-lg text-slate-900">Manajemen 3 Sesi Kegiatan &amp; Lokasi Falah</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur jadwal 3 sesi kepanitiaan (24 Sept Gladi Bersih malam, 25 Sept Hari-1, 26 Sept Hari-2 Penutupan) beserta batasan 2 jam pertama check-in dan 2 jam terakhir check-out di Kampus B UNAIR.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Pengaturan 3 sesi dan batasan waktu berhasil disimpan &amp; disinkronkan ke seluruh panitia!</span>
        </div>
      )}

      {/* Event Info & Venue */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-fuchsia-600" />
          <span>Informasi Acara &amp; Tempat Pelaksanaan</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Agenda / Kepanitiaan
            </label>
            <input
              type="text"
              id="event-name-setting"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lokasi / Tempat Pelaksanaan
            </label>
            <div className="relative">
              <input
                type="text"
                id="venue-name-setting"
                value={formData.venueName || 'Kampus B Universitas Airlangga'}
                onChange={(e) => handleChange('venueName', e.target.value)}
                placeholder="Contoh: Kampus B Universitas Airlangga"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:bg-white focus:outline-hidden font-medium text-slate-900"
              />
              <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ditampilkan di banner header dan aplikasi panitia</p>
          </div>
        </div>
      </div>

      {/* 3 Sessions Customization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-fuchsia-600" />
            <span>Konfigurasi 3 Sesi Kegiatan (Waktu &amp; Batasan 2 Jam)</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            Sesi aktif saat ini:{' '}
            <strong className="text-fuchsia-700">
              {sessionsList.find((s) => s.id === formData.activeSessionId)?.name || 'Sesi 1'}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sessionsList.map((session, index) => {
            const isActive = session.id === formData.activeSessionId;

            return (
              <div
                key={session.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-fuchsia-50/30 border-fuchsia-400 ring-1 ring-fuchsia-400/30'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fuchsia-700 to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {session.sessionNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={session.name}
                          onChange={(e) => handleSessionChange(index, 'name', e.target.value)}
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-fuchsia-500 focus:outline-hidden px-1"
                        />
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {session.dayLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tanggal: <strong>{session.date}</strong> &bull; Tempat: {formData.venueName || 'Kampus B UNAIR'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectActiveSession(session.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white border-transparent shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isActive ? '✓ Sedang Aktif' : 'Set Jadi Sesi Aktif'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Agenda Time Range */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1.5">
                      1. Jam Agenda Kegiatan
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={session.agendaStartTime}
                        onChange={(e) => handleSessionChange(index, 'agendaStartTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="time"
                        value={session.agendaEndTime}
                        onChange={(e) => handleSessionChange(index, 'agendaEndTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Total durasi acara</span>
                  </div>

                  {/* 2 Jam Pertama: Check-In */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1.5">
                      2. Sesi Check-In (2 Jam Pertama)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={session.checkInStartTime}
                        onChange={(e) => handleSessionChange(index, 'checkInStartTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-900"
                      />
                      <span className="text-emerald-400 font-bold">-</span>
                      <input
                        type="time"
                        value={session.checkInEndTime}
                        onChange={(e) => handleSessionChange(index, 'checkInEndTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-900"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 block mt-1">Check-in tepat waktu</span>
                  </div>

                  {/* 2 Jam Terakhir: Check-Out */}
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-1.5">
                      3. Sesi Check-Out (2 Jam Terakhir)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={session.checkOutStartTime}
                        onChange={(e) => handleSessionChange(index, 'checkOutStartTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-mono font-bold text-amber-900"
                      />
                      <span className="text-amber-400 font-bold">-</span>
                      <input
                        type="time"
                        value={session.checkOutEndTime}
                        onChange={(e) => handleSessionChange(index, 'checkOutEndTime', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded font-mono font-bold text-amber-900"
                      />
                    </div>
                    <span className="text-[10px] text-amber-700 block mt-1">Check-out kepulangan</span>
                  </div>

                  {/* Toleransi */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1.5">
                      4. Toleransi Terlambat
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={session.checkInLateToleranceMinutes}
                        onChange={(e) => handleSessionChange(index, 'checkInLateToleranceMinutes', Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                      />
                      <span className="text-slate-500 font-semibold text-[11px]">Menit</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Masa transisi sebelum telat</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Policy Toggles */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <h4 className="font-bold text-sm text-slate-900">Kebijakan &amp; Keamanan Presensi</h4>

        <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
          <input
            type="checkbox"
            id="require-radius-toggle"
            checked={formData.requireLocationRadius}
            onChange={(e) => handleChange('requireLocationRadius', e.target.checked)}
            className="w-4 h-4 mt-0.5 text-fuchsia-600 rounded border-slate-300 focus:ring-fuchsia-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Wajib Berada di Dalam Radius Geofencing (Geofencing Strict Kampus B UNAIR)
            </span>
            <span className="text-[11px] text-slate-500">
              Jika diaktifkan, panitia yang berada di luar radius tidak dapat menekan tombol check-in/out tanpa persetujuan manual.
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
          <input
            type="checkbox"
            id="allow-outside-window-toggle"
            checked={formData.allowOutsideWindow}
            onChange={(e) => handleChange('allowOutsideWindow', e.target.checked)}
            className="w-4 h-4 mt-0.5 text-fuchsia-600 rounded border-slate-300 focus:ring-fuchsia-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Izinkan Absensi di Luar Jam Batas Sesi (dengan Catatan Keterangan)
            </span>
            <span className="text-[11px] text-slate-500">
              Memberikan kelonggaran bagi panitia yang bertugas lebih awal atau shift lembur dengan catatan tugas.
            </span>
          </div>
        </label>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            PIN Keamanan Akses Panel Admin
          </label>
          <input
            type="password"
            maxLength={8}
            id="admin-pin-setting"
            value={formData.adminPin}
            onChange={(e) => handleChange('adminPin', e.target.value)}
            className="w-40 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono tracking-widest focus:ring-2 focus:ring-fuchsia-500 focus:bg-white focus:outline-hidden"
          />
          <span className="text-[11px] text-slate-400 block mt-1">Default PIN: 1945</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          id="save-settings-btn"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan 3 Sesi'}</span>
        </button>
      </div>
    </form>
  );
};
