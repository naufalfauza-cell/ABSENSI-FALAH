import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_SETTINGS, DEFAULT_LOCATIONS, DEFAULT_SESSIONS, generateInitialMembers } from './src/data/defaultData';
import { AttendanceRecord, AppSettings, CommitteeMember, LocationTarget, EventSession } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File storage path for durable persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'attendance_store.json');

// In-memory cache
interface StoreState {
  settings: AppSettings;
  locations: LocationTarget[];
  members: CommitteeMember[];
  attendance: AttendanceRecord[];
}

let store: StoreState = {
  settings: DEFAULT_SETTINGS,
  locations: DEFAULT_LOCATIONS,
  members: generateInitialMembers(),
  attendance: [],
};

// Load saved data if exists
function loadSavedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.settings) {
        store.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        // Ensure 3 sessions exist
        if (!store.settings.sessions || !Array.isArray(store.settings.sessions) || store.settings.sessions.length === 0) {
          store.settings.sessions = DEFAULT_SESSIONS;
          store.settings.activeSessionId = DEFAULT_SETTINGS.activeSessionId;
        }
        if (!store.settings.venueName) {
          store.settings.venueName = DEFAULT_SETTINGS.venueName;
        }
      }
      if (Array.isArray(parsed.locations) && parsed.locations.length > 0) {
        // If loaded locations are the old Darmo sample, upgrade them to UNAIR Kampus B
        const hasDarmo = parsed.locations.some((l: LocationTarget) => l.address?.includes('Darmo') || l.name?.includes('Darmo'));
        if (hasDarmo) {
          store.locations = DEFAULT_LOCATIONS;
        } else {
          store.locations = parsed.locations;
        }
      } else {
        store.locations = DEFAULT_LOCATIONS;
      }
      if (Array.isArray(parsed.members) && parsed.members.length > 0) store.members = parsed.members;
      if (Array.isArray(parsed.attendance)) store.attendance = parsed.attendance;
      console.log(`[Store] Successfully loaded persisted data (${store.members.length} members, ${store.attendance.length} attendance records)`);
    } else {
      saveData();
    }
  } catch (err) {
    console.error('[Store] Error loading store file, initializing defaults:', err);
  }
}

function saveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Error saving store file:', err);
  }
}

loadSavedData();

// ==================== API ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Full state sync
app.get('/api/data', (req, res) => {
  res.json({
    settings: store.settings,
    locations: store.locations,
    members: store.members,
    attendance: store.attendance,
  });
});

// Check-in
app.post('/api/attendance/check-in', (req, res) => {
  const {
    memberId,
    date,
    sessionId,
    sessionName,
    checkInTime,
    checkInStatus,
    locationId,
    locationName,
    latitude,
    longitude,
    distanceMeters,
    insideRadius,
    notes,
    photo,
  } = req.body;

  const member = store.members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Data panitia tidak ditemukan' });
  }

  // Check if already checked in for this session (or date)
  let record = store.attendance.find((a) => {
    if (a.memberId !== memberId) return false;
    if (sessionId && a.sessionId) {
      return a.sessionId === sessionId;
    }
    return a.date === date;
  });

  if (record && record.checkInTime) {
    return res.status(400).json({ error: `Panitia sudah melakukan check-in untuk sesi ${record.sessionName || 'ini'}` });
  }

  if (!record) {
    record = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      memberId: member.id,
      memberName: member.name,
      division: member.division,
      role: member.role,
      sessionId: sessionId || store.settings.activeSessionId,
      sessionName: sessionName || (store.settings.sessions?.find(s => s.id === sessionId)?.name || 'Sesi Falah'),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
    };
    store.attendance.unshift(record);
  }

  record.sessionId = sessionId || record.sessionId || store.settings.activeSessionId;
  record.sessionName = sessionName || record.sessionName || (store.settings.sessions?.find(s => s.id === record?.sessionId)?.name);
  record.checkInTime = checkInTime;
  record.checkInStatus = checkInStatus || 'Tepat Waktu';
  record.checkInLocationId = locationId;
  record.checkInLocationName = locationName;
  record.checkInLatitude = latitude;
  record.checkInLongitude = longitude;
  record.checkInDistanceMeters = distanceMeters;
  record.checkInInsideRadius = insideRadius;
  record.checkInNotes = notes || '';
  if (photo) record.checkInPhoto = photo;

  saveData();
  res.json({ success: true, record });
});

// Check-out
app.post('/api/attendance/check-out', (req, res) => {
  const {
    memberId,
    date,
    sessionId,
    checkOutTime,
    locationId,
    locationName,
    latitude,
    longitude,
    distanceMeters,
    insideRadius,
    notes,
    workDurationFormatted,
  } = req.body;

  const record = store.attendance.find((a) => {
    if (a.memberId !== memberId) return false;
    if (sessionId && a.sessionId) {
      return a.sessionId === sessionId;
    }
    return a.date === date;
  });

  if (!record) {
    return res.status(400).json({ error: 'Belum ada data check-in untuk panitia pada sesi ini' });
  }

  record.checkOutTime = checkOutTime;
  record.checkOutLocationId = locationId;
  record.checkOutLocationName = locationName;
  record.checkOutLatitude = latitude;
  record.checkOutLongitude = longitude;
  record.checkOutDistanceMeters = distanceMeters;
  record.checkOutInsideRadius = insideRadius;
  record.checkOutNotes = notes || '';
  if (workDurationFormatted) {
    record.workDurationFormatted = workDurationFormatted;
  }

  saveData();
  res.json({ success: true, record });
});

// Admin manual entry / edit
app.post('/api/attendance/manual', (req, res) => {
  const { memberId, date, sessionId, sessionName, checkInTime, checkOutTime, checkInStatus, notes } = req.body;
  const member = store.members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Panitia tidak ditemukan' });
  }

  let record = store.attendance.find((a) => {
    if (a.memberId !== memberId) return false;
    if (sessionId && a.sessionId) {
      return a.sessionId === sessionId;
    }
    return a.date === date;
  });

  if (!record) {
    record = {
      id: `att-manual-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      division: member.division,
      role: member.role,
      sessionId: sessionId || store.settings.activeSessionId,
      sessionName: sessionName || (store.settings.sessions?.find(s => s.id === sessionId)?.name || 'Sesi Falah'),
      date: date,
      createdAt: Date.now(),
    };
    store.attendance.unshift(record);
  }

  if (sessionId) record.sessionId = sessionId;
  if (sessionName) record.sessionName = sessionName;

  if (checkInTime) {
    record.checkInTime = checkInTime;
    record.checkInStatus = checkInStatus || 'Tepat Waktu';
    record.checkInInsideRadius = true;
    record.checkInLocationName = 'Verifikasi Admin (Manual)';
  }
  if (checkOutTime) {
    record.checkOutTime = checkOutTime;
    record.checkOutInsideRadius = true;
    record.checkOutLocationName = 'Verifikasi Admin (Manual)';
  }
  if (notes) {
    record.checkInNotes = (record.checkInNotes ? record.checkInNotes + ' | ' : '') + notes;
  }

  saveData();
  res.json({ success: true, record });
});

// Delete attendance record
app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  store.attendance = store.attendance.filter((a) => a.id !== id);
  saveData();
  res.json({ success: true });
});

// Settings update
app.put('/api/settings', (req, res) => {
  store.settings = { ...store.settings, ...req.body };
  saveData();
  res.json({ success: true, settings: store.settings });
});

// Locations CRUD
app.post('/api/locations', (req, res) => {
  const newLoc: LocationTarget = {
    id: `loc-${Date.now()}`,
    name: req.body.name || 'Titik Lokasi Baru',
    address: req.body.address || '',
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
    radiusMeters: Number(req.body.radiusMeters) || 100,
    isActive: req.body.isActive !== false,
  };
  store.locations.push(newLoc);
  saveData();
  res.json({ success: true, location: newLoc });
});

app.put('/api/locations/:id', (req, res) => {
  const { id } = req.params;
  const index = store.locations.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lokasi tidak ditemukan' });
  }
  store.locations[index] = { ...store.locations[index], ...req.body };
  saveData();
  res.json({ success: true, location: store.locations[index] });
});

app.delete('/api/locations/:id', (req, res) => {
  const { id } = req.params;
  store.locations = store.locations.filter((l) => l.id !== id);
  saveData();
  res.json({ success: true });
});

// Member registration / addition
app.post('/api/members', (req, res) => {
  const { name, division, role, phone } = req.body;
  if (!name || !division) {
    return res.status(400).json({ error: 'Nama dan Divisi wajib diisi' });
  }
  const newMember: CommitteeMember = {
    id: `FLH-${String(store.members.length + 1).padStart(3, '0')}`,
    name,
    division,
    role: role || 'Anggota',
    phone: phone || '',
  };
  store.members.push(newMember);
  saveData();
  res.json({ success: true, member: newMember });
});

// Reset data back to defaults
app.post('/api/reset-data', (req, res) => {
  store = {
    settings: DEFAULT_SETTINGS,
    locations: DEFAULT_LOCATIONS,
    members: generateInitialMembers(),
    attendance: [],
  };
  saveData();
  res.json({ success: true });
});

// ==================== VITE MIDDLEWARE SETUP ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Absensi Panitia Falah server running on http://localhost:${PORT}`);
  });
}

startServer();
