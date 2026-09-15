import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Search, Shield, Check } from 'lucide-react';
import { CommitteeMember } from '../../types';

interface AdminMembersTabProps {
  members: CommitteeMember[];
  onAddMember: (member: Omit<CommitteeMember, 'id'>) => Promise<void>;
}

export const AdminMembersTab: React.FC<AdminMembersTabProps> = ({ members, onAddMember }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [division, setDivision] = useState('Sie Acara & Protokoler');
  const [role, setRole] = useState('Anggota');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('Semua');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const divisions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.division));
    return ['Semua', ...Array.from(set)];
  }, [members]);

  const divisionStats = useMemo(() => {
    const counts: { [div: string]: number } = {};
    members.forEach((m) => {
      counts[m.division] = (counts[m.division] || 0) + 1;
    });
    return counts;
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchDiv = selectedDivision === 'Semua' || m.division === selectedDivision;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.division.toLowerCase().includes(search.toLowerCase());
      return matchDiv && matchSearch;
    });
  }, [members, selectedDivision, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama panitia wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onAddMember({
        name,
        division,
        role: role || 'Anggota',
        phone,
      });
      setName('');
      setPhone('');
      setShowAddForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan panitia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Direktori Panitia ({members.length} Anggota)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh pengurus dan anggota kepanitiaan Falah yang berhak melakukan presensi.
          </p>
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Panitia Baru</span>
          </button>
        )}
      </div>

      {/* Add Panitia Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-fuchsia-50/40 border border-fuchsia-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-fuchsia-100 pb-3">
            <h4 className="font-bold text-sm text-fuchsia-950 flex items-center gap-2">
              <Users className="w-4 h-4 text-fuchsia-600" />
              <span>Registrasi Anggota Panitia Baru</span>
            </h4>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama panitia..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi *</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              >
                {divisions.filter((d) => d !== 'Semua').map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Divisi Tambahan Khusus">Divisi Tambahan Khusus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan / Peran</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Anggota / Koordinator..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-fuchsia-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Panitia'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Division Summary Pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(divisionStats).map(([div, count]) => (
          <button
            key={div}
            type="button"
            onClick={() => setSelectedDivision(div === selectedDivision ? 'Semua' : div)}
            className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
              selectedDivision === div
                ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white border-transparent shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{div}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDivision === div ? 'bg-white text-fuchsia-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau ID panitia..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
        />
      </div>

      {/* Grid of Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-50 to-pink-100 text-fuchsia-800 font-bold flex items-center justify-center text-xs shrink-0 border border-fuchsia-200">
              {member.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 truncate">{member.name}</h4>
                <span className="font-mono text-[10px] text-fuchsia-800 font-semibold bg-fuchsia-50 px-1.5 py-0.2 rounded border border-fuchsia-200">
                  {member.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{member.division}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span className="font-medium text-slate-600">{member.role}</span>
                {member.phone && <span>&bull; {member.phone}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
