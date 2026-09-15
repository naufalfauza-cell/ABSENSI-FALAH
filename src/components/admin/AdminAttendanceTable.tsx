import React, { useState, useMemo } from 'react';
import { Download, Search, CheckCircle2, Clock, AlertTriangle, UserX, UserCheck, Trash2, Eye, Calendar } from 'lucide-react';
import { CommitteeMember, AttendanceRecord, EventSession } from '../../types';
import { DEFAULT_SESSIONS } from '../../data/defaultData';

interface AdminAttendanceTableProps {
  members: CommitteeMember[];
  attendance: AttendanceRecord[];
  sessions?: EventSession[];
  activeSessionId?: string;
  onOpenManualModal: () => void;
  onDeleteRecord: (id: string) => Promise<void>;
  currentDate: string;
}

export const AdminAttendanceTable: React.FC<AdminAttendanceTableProps> = ({
  members,
  attendance,
  sessions = DEFAULT_SESSIONS,
  activeSessionId = 'sesi-1',
  onOpenManualModal,
  onDeleteRecord,
  currentDate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Semua');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>(activeSessionId || 'Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedPhoto, setSelectedPhoto] = useState<{ name: string; photo: string } | null>(null);

  // Filter attendance by session first if a specific session is selected
  const sessionFilteredAttendance = useMemo(() => {
    if (selectedSessionFilter === 'Semua') {
      return attendance;
    }
    return attendance.filter((att) => {
      if (att.sessionId) {
        return att.sessionId === selectedSessionFilter;
      }
      // Fallback check date matching session date
      const matchedSession = sessions.find((s) => s.id === selectedSessionFilter);
      return matchedSession && att.date === matchedSession.date;
    });
  }, [attendance, selectedSessionFilter, sessions]);

  // Map attendance by memberId (taking the most recent for this filter)
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    sessionFilteredAttendance.forEach((att) => {
      // If multiple, latest wins
      map.set(att.memberId, att);
    });
    return map;
  }, [sessionFilteredAttendance]);

  // Unique divisions
  const divisions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.division));
    return ['Semua', ...Array.from(set)];
  }, [members]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = members.length;
    let present = 0;
    let onTime = 0;
    let late = 0;
    let checkedOut = 0;

    sessionFilteredAttendance.forEach((att) => {
      if (att.checkInTime) {
        present++;
        if (att.checkInStatus === 'Tepat Waktu') onTime++;
        else if (att.checkInStatus === 'Terlambat') late++;
      }
      if (att.checkOutTime) {
        checkedOut++;
      }
    });

    const notPresent = Math.max(0, total - present);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, onTime, late, checkedOut, notPresent, percentage };
  }, [members, sessionFilteredAttendance]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return members
      .map((member) => {
        const record = attendanceMap.get(member.id);
        return {
          member,
          record,
        };
      })
      .filter(({ member, record }) => {
        const matchDiv = selectedDivision === 'Semua' || member.division === selectedDivision;
        const matchSearch =
          member.name.toLowerCase().includes(search.toLowerCase()) ||
          member.id.toLowerCase().includes(search.toLowerCase()) ||
          member.division.toLowerCase().includes(search.toLowerCase()) ||
          member.role.toLowerCase().includes(search.toLowerCase());

        let matchStatus = true;
        if (statusFilter === 'Hadir') matchStatus = !!record?.checkInTime;
        else if (statusFilter === 'Belum Hadir') matchStatus = !record?.checkInTime;
        else if (statusFilter === 'Tepat Waktu') matchStatus = record?.checkInStatus === 'Tepat Waktu';
        else if (statusFilter === 'Terlambat') matchStatus = record?.checkInStatus === 'Terlambat';
        else if (statusFilter === 'Selesai') matchStatus = !!record?.checkOutTime;

        return matchDiv && matchSearch && matchStatus;
      });
  }, [members, attendanceMap, selectedDivision, search, statusFilter]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'No',
      'ID Panitia',
      'Nama Panitia',
      'Divisi',
      'Jabatan',
      'Sesi Kegiatan',
      'Tanggal',
      'Jam Check-In',
      'Status Check-In',
      'Lokasi Check-In',
      'Status Radius',
      'Jarak (Meter)',
      'Jam Check-Out',
      'Lokasi Check-Out',
      'Total Durasi',
      'Catatan / Keterangan',
    ];

    const currentSessionObj = sessions.find((s) => s.id === selectedSessionFilter);
    const sessionLabel = currentSessionObj ? currentSessionObj.name : 'Semua Sesi';

    const rows = members.map((member, index) => {
      const rec = attendanceMap.get(member.id);
      return [
        index + 1,
        `"${member.id}"`,
        `"${member.name}"`,
        `"${member.division}"`,
        `"${member.role}"`,
        `"${rec?.sessionName || (rec?.sessionId ? sessions.find(s => s.id === rec.sessionId)?.name : sessionLabel)}"`,
        `"${rec?.date || currentSessionObj?.date || currentDate}"`,
        `"${rec?.checkInTime || '-'}"`,
        `"${rec?.checkInStatus || 'Belum Hadir'}"`,
        `"${rec?.checkInLocationName || '-'}"`,
        `"${rec?.checkInInsideRadius ? 'Dalam Radius' : rec?.checkInTime ? 'Luar Radius' : '-'}"`,
        `"${rec?.checkInDistanceMeters !== undefined ? rec.checkInDistanceMeters : '-'}"`,
        `"${rec?.checkOutTime || '-'}"`,
        `"${rec?.checkOutLocationName || '-'}"`,
        `"${rec?.workDurationFormatted || '-'}"`,
        `"${(rec?.checkInNotes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileNameSession = selectedSessionFilter !== 'Semua' ? `_${selectedSessionFilter}` : '_SemuaSesi';
    link.setAttribute('download', `Rekap_Presensi_Panitia_Falah${fileNameSession}_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSessionObj = sessions.find((s) => s.id === selectedSessionFilter);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Panitia
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {stats.total}
          </span>
          <span className="text-[10px] text-slate-400">100 Pengurus &amp; Panitia</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-fuchsia-600 uppercase tracking-wider block">
            Hadir ({selectedSessionFilter === 'Semua' ? 'Semua' : activeSessionObj?.name || 'Sesi'})
          </span>
          <span className="text-2xl font-bold font-mono text-fuchsia-700 mt-1 block">
            {stats.present}
          </span>
          <span className="text-[10px] text-fuchsia-600 font-semibold">{stats.percentage}% Kehadiran</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Tepat Waktu
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
            {stats.onTime}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Sesuai Batas 2 Jam</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Terlambat
          </span>
          <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">
            {stats.late}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Lewat Jam Batas</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Sudah Check-Out
          </span>
          <span className="text-2xl font-bold font-mono text-blue-700 mt-1 block">
            {stats.checkedOut}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Selesai Tugas</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
            Belum Hadir
          </span>
          <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">
            {stats.notPresent}
          </span>
          <span className="text-[10px] text-rose-500 font-medium">Menunggu Presensi</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
          <span>
            Tingkat Kehadiran{' '}
            <strong className="text-fuchsia-700">
              {selectedSessionFilter === 'Semua' ? 'Semua Sesi' : `${activeSessionObj?.name} (${activeSessionObj?.dayLabel})`}
            </strong>
          </span>
          <span className="font-mono text-fuchsia-700">{stats.present} dari {stats.total} Panitia ({stats.percentage}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-fuchsia-600 to-pink-500 h-full transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.onTime / stats.total) * 100 : 0}%` }}
            title={`Tepat Waktu: ${stats.onTime}`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.late / stats.total) * 100 : 0}%` }}
            title={`Terlambat: ${stats.late}`}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-600 inline-block" /> Tepat Waktu ({stats.onTime})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Terlambat ({stats.late})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> Belum Hadir ({stats.notPresent})
          </span>
        </div>
      </div>

      {/* Control Actions & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari panitia / ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            />
          </div>

          {/* Session Filter */}
          <div className="relative">
            <select
              value={selectedSessionFilter}
              onChange={(e) => setSelectedSessionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-fuchsia-50/70 border border-fuchsia-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-bold text-fuchsia-900"
            >
              <option value="Semua">📅 Filter Sesi: Semua Sesi</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  📅 Sesi {s.sessionNumber}: {s.name} ({s.date})
                </option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-medium text-slate-700"
          >
            {divisions.map((d) => (
              <option key={d} value={d}>
                Divisi: {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="Semua">Status: Semua</option>
            <option value="Hadir">Status: Sudah Hadir</option>
            <option value="Belum Hadir">Status: Belum Hadir</option>
            <option value="Tepat Waktu">Status: Tepat Waktu</option>
            <option value="Terlambat">Status: Terlambat</option>
            <option value="Selesai">Status: Selesai Check-out</option>
          </select>
        </div>

        {/* Buttons: Export & Manual Entry */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenManualModal}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-fuchsia-800 bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Presensi Manual</span>
          </button>

          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Rekap</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Panitia</th>
                <th className="py-3 px-3">Divisi &amp; Jabatan</th>
                <th className="py-3 px-3">Sesi / Tanggal</th>
                <th className="py-3 px-3">Check-In</th>
                <th className="py-3 px-3">Lokasi GPS &amp; Radius</th>
                <th className="py-3 px-3">Check-Out</th>
                <th className="py-3 px-3">Durasi</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data panitia yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ member, record }, index) => {
                  const recSession = sessions.find((s) => s.id === record?.sessionId);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {member.name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-500">{member.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="text-slate-800 font-medium">{member.division}</p>
                        <p className="text-slate-400 text-[10px]">{member.role}</p>
                      </td>

                      <td className="py-3 px-3">
                        {record ? (
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">
                              {record.sessionName || recSession?.name || `Sesi ${record.sessionId || '1'}`}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {record.date}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {selectedSessionFilter !== 'Semua' ? activeSessionObj?.name : '-'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {record?.checkInTime ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900">
                              {record.checkInTime}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">WIB</span>
                            {record.checkInNotes && (
                              <p className="text-[10px] text-slate-500 italic truncate max-w-[120px]">
                                {record.checkInNotes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum In</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {record?.checkInLocationName ? (
                          <div>
                            <span className="font-medium text-slate-800 truncate block max-w-[140px]">
                              {record.checkInLocationName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span
                                className={`px-1.5 py-0.2 rounded font-semibold ${
                                  record.checkInInsideRadius
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {record.checkInInsideRadius ? 'Dalam Radius' : 'Luar Radius'}
                              </span>
                              {record.checkInDistanceMeters !== undefined && (
                                <span className="text-slate-500 font-mono">
                                  ({record.checkInDistanceMeters}m)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {record?.checkOutTime ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900">
                              {record.checkOutTime}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">WIB</span>
                          </div>
                        ) : record?.checkInTime ? (
                          <span className="text-amber-600 text-[11px] font-medium">Sedang Bertugas</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-700">
                          {record?.workDurationFormatted || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {record?.checkInTime ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              record.checkInStatus === 'Tepat Waktu'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {record.checkInStatus === 'Tepat Waktu' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{record.checkInStatus}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            <UserX className="w-3 h-3" />
                            <span>Belum Hadir</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {record?.checkInPhoto && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPhoto({ name: member.name, photo: record.checkInPhoto! })
                              }
                              className="p-1 rounded text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Lihat Foto Bukti"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {record && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus data presensi ${member.name} (${record.sessionName || 'Sesi ini'})?`)) {
                                  onDeleteRecord(record.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Hapus Presensi Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900">
                Foto Bukti: {selectedPhoto.name}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
            <img
              src={selectedPhoto.photo}
              alt="Bukti Kehadiran"
              className="w-full h-64 object-cover rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
