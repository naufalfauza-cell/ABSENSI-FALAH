/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SessionSelectorBar } from './components/SessionSelectorBar';
import { MemberSelector } from './components/MemberSelector';
import { LocationStatusCard } from './components/LocationStatusCard';
import { TimeWindowCard } from './components/TimeWindowCard';
import { CheckInActionCard } from './components/CheckInActionCard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { NewMemberModal } from './components/NewMemberModal';
import { SuccessToast } from './components/SuccessToast';
import {
  AppSettings,
  CommitteeMember,
  LocationTarget,
  AttendanceRecord,
  GPSPosition,
  EventSession,
} from './types';
import { DEFAULT_SETTINGS, DEFAULT_LOCATIONS, DEFAULT_SESSIONS, generateInitialMembers } from './data/defaultData';
import {
  findNearestLocation,
  getCurrentTimeWIB,
  getCurrentDateFormatted,
  evaluateCheckInWindow,
  calculateDuration,
} from './utils/geo';
import { Users, Shield, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Application Data States
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [locations, setLocations] = useState<LocationTarget[]>(DEFAULT_LOCATIONS);
  const [members, setMembers] = useState<CommitteeMember[]>(generateInitialMembers());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Time States
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeWIB());
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDateFormatted());

  // Geolocation States
  const [gps, setGps] = useState<GPSPosition | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulatedLocation, setIsSimulatedLocation] = useState(false);

  // User Interaction States
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [activeSessionId, setActiveSessionId] = useState<string>(settings.activeSessionId || 'sesi-1');
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync activeSessionId if settings updates
  useEffect(() => {
    if (settings.sessions && settings.sessions.length > 0) {
      const exists = settings.sessions.some((s) => s.id === activeSessionId);
      if (!exists) {
        setActiveSessionId(settings.activeSessionId || settings.sessions[0].id);
      }
    }
  }, [settings.sessions, settings.activeSessionId, activeSessionId]);

  // Current active session
  const activeSession: EventSession = useMemo(() => {
    const list = settings.sessions && settings.sessions.length > 0 ? settings.sessions : DEFAULT_SESSIONS;
    return list.find((s) => s.id === activeSessionId) || list[0];
  }, [settings.sessions, activeSessionId]);

  // Modals
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    record: AttendanceRecord;
    actionType: 'check-in' | 'check-out';
  } | null>(null);

  // 1. Fetch server state
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.locations) setLocations(data.locations);
        if (data.members) setMembers(data.members);
        if (data.attendance) setAttendance(data.attendance);
      }
    } catch (err) {
      console.warn('Backend API connection offline, using fallback in-memory cache:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeWIB());
      setCurrentDate(getCurrentDateFormatted());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Geolocation fetcher
  const acquireGPS = useCallback(() => {
    if (isSimulatedLocation) {
      // Simulate center coordinate of primary location (e.g. Masjid Al-Falah)
      const primary = locations.find((l) => l.isPrimary && l.isActive) || locations[0];
      if (primary) {
        setGps({
          latitude: primary.latitude,
          longitude: primary.longitude,
          accuracy: 8,
          timestamp: Date.now(),
        });
        setGpsError(null);
        setGpsLoading(false);
        return;
      }
    }

    if (!('geolocation' in navigator)) {
      setGpsError('Browser tidak mendukung pendeteksian lokasi Geolocation.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsLoading(false);
        let msg = 'Gagal mendeteksi koordinat GPS';
        if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser/pengguna';
        else if (err.code === 2) msg = 'Sinyal posisi GPS tidak tersedia';
        else if (err.code === 3) msg = 'Waktu permintaan posisi GPS habis (timeout)';
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, [isSimulatedLocation, locations]);

  useEffect(() => {
    acquireGPS();
  }, [acquireGPS]);

  // Handle simulation toggle
  const handleToggleSimulateLocation = (useTarget: boolean) => {
    setIsSimulatedLocation(useTarget);
    if (useTarget) {
      const primary = locations.find((l) => l.isPrimary && l.isActive) || locations[0];
      if (primary) {
        setGps({
          latitude: primary.latitude,
          longitude: primary.longitude,
          accuracy: 5,
          timestamp: Date.now(),
        });
        setGpsError(null);
      }
    } else {
      acquireGPS();
    }
  };

  // 4. Calculate Geofencing match
  const locationMatchResult = useMemo(() => {
    if (!gps) {
      return {
        nearestLocation: null,
        distanceMeters: Infinity,
        isInsideRadius: false,
        allowedLocationsCount: locations.filter((l) => l.isActive).length,
      };
    }
    return findNearestLocation(gps.latitude, gps.longitude, locations);
  }, [gps, locations]);

  // 5. Restore selected member from local storage if available
  useEffect(() => {
    const savedMemberId = localStorage.getItem('panitia_falah_member_id');
    if (savedMemberId && members.length > 0) {
      const found = members.find((m) => m.id === savedMemberId);
      if (found) setSelectedMember(found);
    }
  }, [members]);

  const handleSelectMember = (member: CommitteeMember) => {
    setSelectedMember(member);
    localStorage.setItem('panitia_falah_member_id', member.id);
  };

  // Selected member's active session attendance record
  const selectedMemberAttendance = useMemo(() => {
    if (!selectedMember) return undefined;
    return attendance.find(
      (a) =>
        a.memberId === selectedMember.id &&
        (a.sessionId ? a.sessionId === activeSession.id : a.date === activeSession.date)
    );
  }, [selectedMember, attendance, activeSession]);

  // Attendance records for the active session
  const sessionAttendance = useMemo(() => {
    return attendance.filter((a) =>
      a.sessionId ? a.sessionId === activeSession.id : a.date === activeSession.date
    );
  }, [attendance, activeSession]);

  const totalPresentThisSession = useMemo(() => {
    return sessionAttendance.filter((a) => a.checkInTime).length;
  }, [sessionAttendance]);

  // Check-In Action
  const handleCheckIn = async (notes: string, photo?: string, sessionId?: string, sessionName?: string) => {
    if (!selectedMember) return;
    const targetSessionId = sessionId || activeSession.id;
    const targetSession = settings.sessions?.find((s) => s.id === targetSessionId) || activeSession;

    const checkInStatusResult = evaluateCheckInWindow(
      currentTime,
      targetSession.checkInStartTime,
      targetSession.checkInEndTime,
      targetSession.checkInLateToleranceMinutes
    );

    let statusText: 'Tepat Waktu' | 'Terlambat' | 'Di Luar Jam' = 'Tepat Waktu';
    if (checkInStatusResult.isLate) statusText = 'Terlambat';
    else if (checkInStatusResult.isBefore || checkInStatusResult.isAfter) statusText = 'Di Luar Jam';

    const payload = {
      memberId: selectedMember.id,
      date: targetSession.date,
      sessionId: targetSession.id,
      sessionName: sessionName || targetSession.name,
      checkInTime: currentTime,
      checkInStatus: statusText,
      locationId: locationMatchResult.nearestLocation?.id,
      locationName: locationMatchResult.nearestLocation?.name || 'Titik Luar',
      latitude: gps?.latitude,
      longitude: gps?.longitude,
      distanceMeters: locationMatchResult.distanceMeters,
      insideRadius: locationMatchResult.isInsideRadius,
      notes,
      photo,
    };

    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal check-in');
      }

      const data = await res.json();
      setAttendance((prev) => {
        const filtered = prev.filter(
          (a) =>
            !(
              a.memberId === selectedMember.id &&
              (a.sessionId ? a.sessionId === targetSession.id : a.date === targetSession.date)
            )
        );
        return [data.record, ...filtered];
      });

      setSuccessModalData({
        record: data.record,
        actionType: 'check-in',
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat check-in');
    } finally {
      setActionLoading(false);
    }
  };

  // Check-Out Action
  const handleCheckOut = async (notes: string, sessionId?: string) => {
    if (!selectedMember || !selectedMemberAttendance) return;
    const targetSessionId = sessionId || activeSession.id;
    const targetSession = settings.sessions?.find((s) => s.id === targetSessionId) || activeSession;

    const workDuration = calculateDuration(selectedMemberAttendance.checkInTime || '', currentTime);

    const payload = {
      memberId: selectedMember.id,
      date: targetSession.date,
      sessionId: targetSession.id,
      checkOutTime: currentTime,
      locationId: locationMatchResult.nearestLocation?.id,
      locationName: locationMatchResult.nearestLocation?.name || 'Titik Luar',
      latitude: gps?.latitude,
      longitude: gps?.longitude,
      distanceMeters: locationMatchResult.distanceMeters,
      insideRadius: locationMatchResult.isInsideRadius,
      notes,
      workDurationFormatted: workDuration,
    };

    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal check-out');
      }

      const data = await res.json();
      setAttendance((prev) =>
        prev.map((a) => (a.id === data.record.id ? data.record : a))
      );

      setSuccessModalData({
        record: data.record,
        actionType: 'check-out',
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat check-out');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!res.ok) throw new Error('Gagal memperbarui pengaturan');
    const data = await res.json();
    setSettings(data.settings);
  };

  const handleAddLocation = async (loc: Omit<LocationTarget, 'id'>) => {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc),
    });
    if (!res.ok) throw new Error('Gagal menambah lokasi');
    const data = await res.json();
    setLocations((prev) => [...prev, data.location]);
  };

  const handleUpdateLocation = async (id: string, updates: Partial<LocationTarget>) => {
    const res = await fetch(`/api/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Gagal update lokasi');
    const data = await res.json();
    setLocations((prev) => prev.map((l) => (l.id === id ? data.location : l)));
  };

  const handleDeleteLocation = async (id: string) => {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal hapus lokasi');
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddMember = async (member: Omit<CommitteeMember, 'id'>) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Gagal menambah panitia');
    const data = await res.json();
    setMembers((prev) => [...prev, data.member]);
    setSelectedMember(data.member);
  };

  const handleDeleteAttendanceRecord = async (id: string) => {
    const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus data presensi');
    setAttendance((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveManualAttendance = async (data: {
    memberId: string;
    date: string;
    sessionId?: string;
    sessionName?: string;
    checkInTime: string;
    checkOutTime?: string;
    checkInStatus: 'Tepat Waktu' | 'Terlambat';
    notes: string;
  }) => {
    const res = await fetch('/api/attendance/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal menyimpan presensi manual');
    const result = await res.json();
    setAttendance((prev) => {
      const filtered = prev.filter(
        (a) =>
          !(
            a.memberId === data.memberId &&
            (data.sessionId && a.sessionId ? a.sessionId === data.sessionId : a.date === data.date)
          )
      );
      return [result.record, ...filtered];
    });
  };

  const handleResetData = async () => {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    if (!res.ok) throw new Error('Gagal reset');
    await fetchData();
  };

  // Total present today
  const totalPresentToday = useMemo(() => {
    return attendance.filter((a) => a.checkInTime).length;
  }, [attendance]);

  const uniqueDivisions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => set.add(m.division));
    return Array.from(set);
  }, [members]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        currentTime={currentTime}
        currentDate={currentDate}
        totalMembers={members.length}
        totalPresent={totalPresentToday}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={() => setIsAdminLoginModalOpen(true)}
        onLogoutAdmin={() => {
          setIsAdminLoggedIn(false);
          setActiveTab('user');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'user' ? (
          <div className="space-y-6">
            {/* Top Overview Banner for User */}
            <div className="bg-gradient-to-r from-fuchsia-950 via-purple-950 to-pink-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-fuchsia-900/40 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-gradient-to-br from-fuchsia-600/20 to-pink-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-1/3 -top-12 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-xs mb-3 border border-white/15">
                  <Shield className="w-3.5 h-3.5 text-pink-300" />
                  <span>Presensi Resmi Panitia Falah 2026</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Portal Presensi Panitia Falah
                </h2>
                <p className="text-pink-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
                  Lakukan check-in dan check-out penugasan kepanitiaan dengan verifikasi otomatis tag lokasi
                  GPS di <strong>{settings.venueName || 'Kampus B Universitas Airlangga'}</strong> dan batasan waktu jadwal yang telah ditentukan.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 mt-5 text-xs">
                  <div className="flex items-center gap-1.5 bg-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-xs border border-white/15 font-bold shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                    <span>
                      Sesi Aktif: Sesi {activeSession.sessionNumber} ({activeSession.name})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-pink-300" />
                    <span>
                      Cekin: <strong>{activeSession.checkInStartTime} - {activeSession.checkInEndTime} WIB</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      Cekout: <strong>{activeSession.checkOutStartTime} - {activeSession.checkOutEndTime} WIB</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>Posko: <strong>{locations.filter((l) => l.isActive).length} Titik Kampus B</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Selector Bar (3 Sesi: 24 Malam Gladi Bersih, 25, 26) */}
            <SessionSelectorBar
              sessions={settings.sessions && settings.sessions.length > 0 ? settings.sessions : DEFAULT_SESSIONS}
              activeSessionId={activeSession.id}
              onSelectSession={(id) => setActiveSessionId(id)}
              attendance={attendance}
              venueName={settings.venueName || 'Kampus B Universitas Airlangga'}
            />

            {/* Grid Layout: Form Column & Info Column */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form: Step 1 & Step 2 (Panitia + Check-In/Out) */}
              <div className="lg:col-span-7 space-y-6">
                <MemberSelector
                  members={members}
                  selectedMember={selectedMember}
                  onSelectMember={handleSelectMember}
                  todayAttendance={sessionAttendance}
                  sessionLabel={`Sesi ${activeSession.sessionNumber}: ${activeSession.name}`}
                  onAddNewMemberModal={() => setIsNewMemberModalOpen(true)}
                />

                <CheckInActionCard
                  member={selectedMember}
                  attendanceRecord={selectedMemberAttendance}
                  settings={settings}
                  activeSession={activeSession}
                  gps={gps}
                  matchResult={locationMatchResult}
                  currentTime={currentTime}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  loading={actionLoading}
                />
              </div>

              {/* Right Column: Location Status & Time Schedule & Live Feed */}
              <div className="lg:col-span-5 space-y-6">
                <LocationStatusCard
                  gps={gps}
                  gpsLoading={gpsLoading}
                  gpsError={gpsError}
                  matchResult={locationMatchResult}
                  locations={locations}
                  onRefreshGPS={acquireGPS}
                  isSimulatedLocation={isSimulatedLocation}
                  onToggleSimulateLocation={handleToggleSimulateLocation}
                  requireLocationRadius={settings.requireLocationRadius}
                />

                <TimeWindowCard
                  settings={settings}
                  activeSession={activeSession}
                  currentTime={currentTime}
                  currentDate={currentDate}
                />

                {/* Recent Attendance Activity Feed */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-fuchsia-600" />
                      <span>Presensi Sesi {activeSession.sessionNumber} ({totalPresentThisSession} Panitia)</span>
                    </h4>
                    <span className="text-[10px] text-fuchsia-700 font-bold bg-fuchsia-50 border border-fuchsia-100 px-2 py-0.5 rounded-full">
                      Real-time
                    </span>
                  </div>

                  {sessionAttendance.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center italic">
                      Belum ada presensi untuk Sesi {activeSession.sessionNumber} ({activeSession.name}). Silakan lakukan presensi!
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                      {sessionAttendance.slice(0, 6).map((att) => (
                        <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs">
                              {att.memberName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 truncate max-w-[130px]">
                                {att.memberName}
                              </p>
                              <span className="text-[10px] text-slate-500">{att.division}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <span className="font-mono font-bold text-slate-800 text-[11px]">
                                {att.checkOutTime ? att.checkOutTime : att.checkInTime}
                              </span>
                              <span className="text-[10px] text-slate-400">WIB</span>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                att.checkOutTime
                                  ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200'
                                  : att.checkInStatus === 'Tepat Waktu'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.checkOutTime ? 'Check-Out' : att.checkInStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Admin View */
          <AdminDashboard
            settings={settings}
            locations={locations}
            members={members}
            attendance={attendance}
            currentGps={gps}
            currentDate={currentDate}
            onUpdateSettings={handleUpdateSettings}
            onAddLocation={handleAddLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onAddMember={handleAddMember}
            onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
            onSaveManualAttendance={handleSaveManualAttendance}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            &copy; 2026 <strong>Panitia Falah</strong> &bull; Sistem Absensi Berbasis Geofencing &amp; Batasan Waktu.
          </p>
          <div className="flex items-center gap-4">
            <span>Kapasitas: 100+ Panitia Terdaftar</span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                if (!isAdminLoggedIn) setIsAdminLoginModalOpen(true);
                else setActiveTab(activeTab === 'admin' ? 'user' : 'admin');
              }}
              className="text-fuchsia-700 hover:underline font-bold"
            >
              {isAdminLoggedIn ? 'Beralih ke Panel Admin' : 'Login Admin Falah'}
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setActiveTab('admin');
        }}
        correctPin={settings.adminPin}
      />

      {/* New Member Modal */}
      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
        onAddMember={handleAddMember}
        divisions={uniqueDivisions}
      />

      {/* Success Notification Modal */}
      {successModalData && (
        <SuccessToast
          record={successModalData.record}
          actionType={successModalData.actionType}
          onClose={() => setSuccessModalData(null)}
        />
      )}
    </div>
  );
}
