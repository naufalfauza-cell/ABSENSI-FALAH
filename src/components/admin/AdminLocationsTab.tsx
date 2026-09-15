import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Edit3, Check, Navigation, AlertCircle } from 'lucide-react';
import { LocationTarget, GPSPosition } from '../../types';

interface AdminLocationsTabProps {
  locations: LocationTarget[];
  currentGps: GPSPosition | null;
  onAddLocation: (loc: Omit<LocationTarget, 'id'>) => Promise<void>;
  onUpdateLocation: (id: string, updates: Partial<LocationTarget>) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export const AdminLocationsTab: React.FC<AdminLocationsTabProps> = ({
  locations,
  currentGps,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fillWithCurrentGps = () => {
    if (currentGps) {
      setLatitude(Number(currentGps.latitude.toFixed(6)));
      setLongitude(Number(currentGps.longitude.toFixed(6)));
    } else {
      setFormError('Sinyal GPS belum terdeteksi dari browser.');
    }
  };

  const handleStartEdit = (loc: LocationTarget) => {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadiusMeters(loc.radiusMeters);
    setIsActive(loc.isActive);
    setShowAddForm(false);
    setFormError('');
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setRadiusMeters(100);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama lokasi wajib diisi.');
      return;
    }
    if (latitude === '' || longitude === '' || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      setFormError('Koordinat Latitude dan Longitude harus berupa angka valid.');
      return;
    }
    if (Number(radiusMeters) <= 0) {
      setFormError('Radius harus lebih besar dari 0 meter.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      if (editingId) {
        await onUpdateLocation(editingId, {
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          isActive,
        });
      } else {
        await onAddLocation({
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          isActive,
        });
      }
      handleCancel();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan lokasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Kustomisasi Tag Titik Lokasi Presensi</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin dapat menambah, mengubah koordinat GPS, dan mengatur radius jangkauan (geofencing).
          </p>
        </div>

        {!showAddForm && !editingId && (
          <button
            type="button"
            id="add-location-btn"
            onClick={() => {
              handleCancel();
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Titik Lokasi Baru</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Modal/Drawer */}
      {(showAddForm || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-fuchsia-50/40 border border-fuchsia-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-fuchsia-100 pb-3">
            <h4 className="font-bold text-sm text-fuchsia-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-fuchsia-600" />
              <span>{editingId ? 'Ubah Titik Lokasi' : 'Tambah Titik Lokasi Baru'}</span>
            </h4>
            <span className="text-xs text-slate-500">*Admin Tool</span>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Titik / Posko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="location-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Posko Logistik Barat / Masjid Al-Falah"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Alamat Detail
              </label>
              <input
                type="text"
                id="location-address-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Raya Darmo, Sayap Kanan Pintu 2"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Latitude <span className="text-rose-500">*</span>
                </label>
                {currentGps && (
                  <button
                    type="button"
                    onClick={fillWithCurrentGps}
                    className="text-[10px] text-fuchsia-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Navigation className="w-2.5 h-2.5" /> Pakai GPS Saya
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                id="location-lat-input"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="-7.2892"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                id="location-lng-input"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="112.7388"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Radius Geofencing (Meter) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="location-radius-input"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  min={10}
                  max={5000}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:outline-hidden"
                />
                <span className="text-xs text-slate-500 font-semibold">Meter</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="loc-active-checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-fuchsia-600 rounded border-slate-300 focus:ring-fuchsia-500"
            />
            <label htmlFor="loc-active-checkbox" className="text-xs font-medium text-slate-700">
              Aktifkan titik lokasi ini sebagai pos absensi panitia yang valid
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-fuchsia-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-location-btn"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-fuchsia-700 to-rose-600 hover:from-fuchsia-800 hover:to-rose-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Lokasi'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Locations List Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`p-4 rounded-xl border transition-all ${
              loc.isActive ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    loc.isActive ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{loc.name}</h4>
                    {loc.isPrimary && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Pusat
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{loc.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleStartEdit(loc)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-fuchsia-700 hover:bg-slate-100 transition-colors"
                  title="Edit Lokasi"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus lokasi "${loc.name}"?`)) {
                        onDeleteLocation(loc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Lokasi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 text-[11px] block">Koordinat:</span>
                <span className="font-mono text-slate-800">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Radius Izin:</span>
                <span className="font-bold text-fuchsia-800">{loc.radiusMeters} Meter</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <span
                className={`font-semibold ${loc.isActive ? 'text-emerald-700' : 'text-slate-500'}`}
              >
                {loc.isActive ? '● Aktif untuk Geofencing' : '○ Dinonaktifkan'}
              </span>
              <button
                type="button"
                onClick={() => onUpdateLocation(loc.id, { isActive: !loc.isActive })}
                className="text-fuchsia-700 hover:underline font-semibold"
              >
                {loc.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
