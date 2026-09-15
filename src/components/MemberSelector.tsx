import React, { useState, useMemo } from 'react';
import { Search, UserCheck, CheckCircle2, Clock, ChevronDown, UserPlus } from 'lucide-react';
import { CommitteeMember, AttendanceRecord } from '../types';

interface MemberSelectorProps {
  members: CommitteeMember[];
  selectedMember: CommitteeMember | null;
  onSelectMember: (member: CommitteeMember) => void;
  todayAttendance: AttendanceRecord[];
  sessionLabel?: string;
  onAddNewMemberModal?: () => void;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMember,
  onSelectMember,
  todayAttendance,
  sessionLabel,
  onAddNewMemberModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Semua');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract unique divisions
  const divisions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.division));
    return ['Semua', ...Array.from(set)];
  }, [members]);

  // Today attendance map for quick status lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    todayAttendance.forEach((att) => {
      map.set(att.memberId, att);
    });
    return map;
  }, [todayAttendance]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchDiv = selectedDivision === 'Semua' || m.division === selectedDivision;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.division.toLowerCase().includes(search.toLowerCase()) ||
        m.role.toLowerCase().includes(search.toLowerCase());
      return matchDiv && matchSearch;
    });
  }, [members, search, selectedDivision]);

  const selectedRecord = selectedMember ? attendanceMap.get(selectedMember.id) : undefined;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">Identitas Panitia (100 Panitia Falah)</h3>
          <p className="text-xs text-slate-500">Pilih nama Anda untuk melakukan absensi kehadiran</p>
        </div>

        {onAddNewMemberModal && (
          <button
            type="button"
            onClick={onAddNewMemberModal}
            className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-700 hover:text-fuchsia-800 bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 rounded-lg border border-fuchsia-200 transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Baru</span>
          </button>
        )}
      </div>

      {/* If member is selected, show selected banner with Change button */}
      {selectedMember ? (
        <div className="p-4 rounded-xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50/70 via-pink-50/40 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-fuchsia-700 via-pink-600 to-rose-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-fuchsia-600/20">
                {selectedMember.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">{selectedMember.name}</h4>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-fuchsia-200 text-fuchsia-800 font-bold">
                    {selectedMember.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {selectedMember.role} &bull; <span className="text-fuchsia-700 font-semibold">{selectedMember.division}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Today's status pill */}
              {selectedRecord ? (
                selectedRecord.checkOutTime ? (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selesai {sessionLabel ? `(${sessionLabel})` : ''} (In: {selectedRecord.checkInTime} | Out: {selectedRecord.checkOutTime})</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sudah Check-In ({selectedRecord.checkInTime} WIB)</span>
                  </span>
                )
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  Belum Presensi {sessionLabel ? sessionLabel : 'Hari Ini'}
                </span>
              )}

              <button
                type="button"
                id="change-member-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-50 transition-colors shadow-2xs"
              >
                Ganti Nama
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          id="open-select-member-btn"
          onClick={() => setIsDropdownOpen(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-fuchsia-300 bg-fuchsia-50/30 hover:bg-fuchsia-50/60 text-left flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Klik untuk Memilih Nama Panitia</p>
              <p className="text-xs text-slate-500">Cari nama Anda dari 100 daftar panitia Falah yang terdaftar</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-fuchsia-600 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Collapsible Search & Selection Panel */}
      {(!selectedMember || isDropdownOpen) && (
        <div className="mt-4 pt-4 border-t border-slate-200/80">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-panitia-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama atau ID panitia (contoh: Falah, Fauzi, FLH-001)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Division Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
            {divisions.map((div) => (
              <button
                key={div}
                type="button"
                onClick={() => setSelectedDivision(div)}
                className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                  selectedDivision === div
                    ? 'bg-gradient-to-r from-fuchsia-700 to-pink-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {div}
              </button>
            ))}
          </div>

          {/* Members List Container */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ada panitia yang sesuai dengan pencarian "{search}".
              </div>
            ) : (
              filteredMembers.map((member) => {
                const record = attendanceMap.get(member.id);
                const isSelected = selectedMember?.id === member.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onSelectMember(member);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left p-3 flex items-center justify-between hover:bg-white transition-colors ${
                      isSelected ? 'bg-fuchsia-50/80 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-100 text-fuchsia-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {member.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {member.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {member.role} &bull; {member.division}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {record ? (
                        record.checkOutTime ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Selesai
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ✓ In ({record.checkInTime})
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Belum Absen
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-right">
            Menampilkan {filteredMembers.length} dari {members.length} panitia
          </p>
        </div>
      )}
    </div>
  );
};
