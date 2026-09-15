import React, { useState } from 'react';
import { Table, MapPin, Clock, Users, RefreshCw } from 'lucide-react';
import { AppSettings, CommitteeMember, LocationTarget, AttendanceRecord, GPSPosition } from '../../types';
import { AdminAttendanceTable } from './AdminAttendanceTable';
import { AdminLocationsTab } from './AdminLocationsTab';
import { AdminScheduleTab } from './AdminScheduleTab';
import { AdminMembersTab } from './AdminMembersTab';
import { ManualAttendanceModal } from './ManualAttendanceModal';

interface AdminDashboardProps {
  settings: AppSettings;
  locations: LocationTarget[];
  members: CommitteeMember[];
  attendance: AttendanceRecord[];
  currentGps: GPSPosition | null;
  currentDate: string;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onAddLocation: (loc: Omit<LocationTarget, 'id'>) => Promise<void>;
  onUpdateLocation: (id: string, updates: Partial<LocationTarget>) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
  onAddMember: (member: Omit<CommitteeMember, 'id'>) => Promise<void>;
  onDeleteAttendanceRecord: (id: string) => Promise<void>;
  onSaveManualAttendance: (data: {
    memberId: string;
    date: string;
    sessionId?: string;
    sessionName?: string;
    checkInTime: string;
    checkOutTime?: string;
    checkInStatus: 'Tepat Waktu' | 'Terlambat';
    notes: string;
  }) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  locations,
  members,
  attendance,
  currentGps,
  currentDate,
  onUpdateSettings,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onAddMember,
  onDeleteAttendanceRecord,
  onSaveManualAttendance,
  onResetData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'locations' | 'schedule' | 'members'>('attendance');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="subtab-attendance-btn"
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'attendance'
                ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Rekap Kehadiran (Live)</span>
          </button>

          <button
            type="button"
            id="subtab-locations-btn"
            onClick={() => setActiveSubTab('locations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'locations'
                ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Kustomisasi Tag Lokasi ({locations.length})</span>
          </button>

          <button
            type="button"
            id="subtab-schedule-btn"
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'schedule'
                ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Batasan Waktu Cekin/Cekout</span>
          </button>

          <button
            type="button"
            id="subtab-members-btn"
            onClick={() => setActiveSubTab('members')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'members'
                ? 'bg-gradient-to-r from-fuchsia-700 to-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data 100 Panitia</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Kembalikan semua data ke pengaturan default demo (100 panitia)?')) {
              onResetData();
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          title="Reset ke data bawaan"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === 'attendance' && (
          <AdminAttendanceTable
            members={members}
            attendance={attendance}
            sessions={settings.sessions}
            activeSessionId={settings.activeSessionId}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onDeleteRecord={onDeleteAttendanceRecord}
            currentDate={currentDate}
          />
        )}

        {activeSubTab === 'locations' && (
          <AdminLocationsTab
            locations={locations}
            currentGps={currentGps}
            onAddLocation={onAddLocation}
            onUpdateLocation={onUpdateLocation}
            onDeleteLocation={onDeleteLocation}
          />
        )}

        {activeSubTab === 'schedule' && (
          <AdminScheduleTab settings={settings} onUpdateSettings={onUpdateSettings} />
        )}

        {activeSubTab === 'members' && (
          <AdminMembersTab members={members} onAddMember={onAddMember} />
        )}
      </div>

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        members={members}
        currentDate={currentDate}
        sessions={settings.sessions}
        activeSessionId={settings.activeSessionId}
        onSaveManual={onSaveManualAttendance}
      />
    </div>
  );
};
