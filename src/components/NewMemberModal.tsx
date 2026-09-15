import React, { useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import { CommitteeMember } from '../types';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Omit<CommitteeMember, 'id'>) => Promise<void>;
  divisions: string[];
}

export const NewMemberModal: React.FC<NewMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  divisions,
}) => {
  const [name, setName] = useState('');
  const [division, setDivision] = useState(divisions[1] || 'Sie Acara & Protokoler');
  const [role, setRole] = useState('Anggota');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
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
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan panitia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrasi Panitia Falah</h3>
              <p className="text-xs text-slate-500">Tambahkan panitia baru ke sistem presensi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Ihsan"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi Kepanitiaan *</label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Posisi</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Anggota Lapangan"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Mendaftar...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
