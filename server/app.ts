import express from 'express';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

const app = express();
app.use(express.json({ limit: '256kb' }));

const MAX_GPS_ACCURACY_METERS = 100;
const MAX_NOTES_LENGTH = 500;

function db() {
  if (!supabaseAdmin) throw new Error('Supabase server configuration is missing');
  return supabaseAdmin;
}

function finiteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function jakartaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}:${get('second')}` };
}

function normalizeTime(value: string) { return value.length === 5 ? `${value}:00` : value; }
function inWindow(time: string, start: string, end: string) { return time >= normalizeTime(start) && time <= normalizeTime(end); }
function addMinutes(time: string, minutes: number) {
  const [h, m, s = '0'] = time.split(':').map(Number);
  const total = Math.min(86399, h * 3600 + m * 60 + s + minutes * 60);
  return `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor((total % 3600) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function publicRecord(row: any, member?: any, session?: any, locationName?: string) {
  const fmt = (iso?: string | null) => iso ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)) : undefined;
  const duration = row.work_duration_seconds == null ? undefined : `${Math.floor(row.work_duration_seconds / 3600)} jam ${Math.floor((row.work_duration_seconds % 3600) / 60)} menit`;
  return {
    id: row.id, memberId: row.member_id, memberName: member?.name || '', division: member?.division || '', role: member?.role || '',
    sessionId: row.session_id, sessionName: session?.name || '', date: session?.session_date || '',
    checkInTime: fmt(row.check_in_at), checkOutTime: fmt(row.check_out_at),
    checkInStatus: row.check_in_status === 'late' ? 'Terlambat' : row.check_in_status === 'on_time' ? 'Tepat Waktu' : row.check_in_status,
    checkInLocationName: locationName, checkInInsideRadius: row.check_in_inside_radius,
    checkOutInsideRadius: row.check_out_inside_radius, workDurationFormatted: duration,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

async function getContext(memberId: string, sessionId: string) {
  const client = db();
  const [{ data: member, error: memberError }, { data: session, error: sessionError }] = await Promise.all([
    client.from('committee_members').select('id,event_id,division_id,name,role,is_active').eq('id', memberId).maybeSingle(),
    client.from('event_sessions').select('*').eq('id', sessionId).maybeSingle(),
  ]);
  if (memberError || sessionError) throw memberError || sessionError;
  if (!member || !member.is_active) return { error: 'Data panitia tidak ditemukan atau tidak aktif' } as const;
  if (!session || !session.is_active) return { error: 'Sesi tidak ditemukan atau tidak aktif' } as const;
  if (member.event_id !== session.event_id) return { error: 'Panitia dan sesi tidak berasal dari event yang sama' } as const;

  const { data: mappings, error: mapError } = await client.from('session_locations').select('location_id').eq('session_id', sessionId);
  if (mapError) throw mapError;
  const ids = (mappings || []).map((m: any) => m.location_id);
  if (!ids.length) return { error: 'Lokasi untuk sesi ini belum dikonfigurasi' } as const;
  const { data: locations, error: locError } = await client.from('locations').select('id,event_id,name,latitude,longitude,radius_meters,is_active').in('id', ids).eq('is_active', true);
  if (locError) throw locError;
  return { member, session, locations: locations || [] } as const;
}

function validateGps(body: any) {
  const latitude = finiteNumber(body.latitude), longitude = finiteNumber(body.longitude), accuracy = finiteNumber(body.accuracy);
  if (latitude == null || longitude == null || accuracy == null) return { error: 'GPS belum tersedia. Aktifkan lokasi lalu coba lagi.' } as const;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { error: 'Koordinat GPS tidak valid.' } as const;
  if (accuracy < 0 || accuracy > MAX_GPS_ACCURACY_METERS) return { error: `Akurasi GPS terlalu rendah (${Math.round(accuracy)} m). Tunggu sinyal membaik lalu coba lagi.` } as const;
  return { latitude, longitude, accuracy } as const;
}

function nearestLocation(latitude: number, longitude: number, locations: any[]) {
  return locations.map((loc) => ({ ...loc, distance: haversineMeters(latitude, longitude, Number(loc.latitude), Number(loc.longitude)) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: !!supabaseAdmin, time: new Date().toISOString() }));

app.get('/api/data', async (_req, res) => {
  try {
    const client = db();
    const { data: event, error: eventError } = await client.from('events').select('id,name,venue_name,timezone').eq('status', 'active').limit(1).maybeSingle();
    if (eventError) throw eventError;
    if (!event) return res.status(404).json({ error: 'Event aktif tidak ditemukan' });
    const [{ data: divisions, error: divError }, { data: members, error: memberError }, { data: sessions, error: sessionError }] = await Promise.all([
      client.from('divisions').select('id,name,sort_order').eq('event_id', event.id).eq('is_active', true).order('sort_order'),
      client.from('committee_members').select('id,division_id,public_code,name,role').eq('event_id', event.id).eq('is_active', true).order('name'),
      client.from('event_sessions').select('*').eq('event_id', event.id).eq('is_active', true).order('session_number'),
    ]);
    if (divError || memberError || sessionError) throw divError || memberError || sessionError;
    const divisionMap = new Map((divisions || []).map((d: any) => [d.id, d.name]));
    const safeMembers = (members || []).map((m: any) => ({ id: m.id, publicCode: m.public_code, name: m.name, division: divisionMap.get(m.division_id) || '', role: m.role }));
    const safeSessions = (sessions || []).map((s: any) => ({ id: s.id, sessionNumber: s.session_number, name: s.name, date: s.session_date, dayLabel: s.day_label, agendaStartTime: s.agenda_start_time.slice(0,5), agendaEndTime: s.agenda_end_time.slice(0,5), checkInStartTime: s.check_in_start_time.slice(0,5), checkInEndTime: s.check_in_end_time.slice(0,5), checkInLateToleranceMinutes: s.late_tolerance_minutes, checkOutStartTime: s.check_out_start_time.slice(0,5), checkOutEndTime: s.check_out_end_time.slice(0,5), description: s.description }));
    res.json({ settings: { eventName: event.name, venueName: event.venue_name, timezone: event.timezone, sessions: safeSessions, activeSessionId: safeSessions[0]?.id, requireLocationRadius: false, allowOutsideWindow: true }, members: safeMembers, locations: [], attendance: [] });
  } catch (error) { console.error('[api/data]', error); res.status(500).json({ error: 'Gagal memuat data FALAH' }); }
});

app.get('/api/attendance/status', async (req, res) => {
  try {
    const memberId = String(req.query.memberId || ''), sessionId = String(req.query.sessionId || '');
    if (!memberId || !sessionId) return res.status(400).json({ error: 'memberId dan sessionId wajib diisi' });
    const context = await getContext(memberId, sessionId);
    if ('error' in context) return res.status(400).json({ error: context.error });
    const { data: row, error } = await db().from('attendance_records').select('*').eq('event_id', context.session.event_id).eq('session_id', sessionId).eq('member_id', memberId).maybeSingle();
    if (error) throw error;
    res.json({ record: row ? publicRecord(row, { name: context.member.name, role: context.member.role }, context.session) : null });
  } catch (error) { console.error('[attendance/status]', error); res.status(500).json({ error: 'Gagal membaca status presensi' }); }
});

app.post('/api/attendance/check-in', async (req, res) => {
  try {
    const memberId = String(req.body.memberId || ''), sessionId = String(req.body.sessionId || '');
    if (!memberId || !sessionId) return res.status(400).json({ error: 'Panitia dan sesi wajib dipilih' });
    const gps = validateGps(req.body); if ('error' in gps) return res.status(400).json({ error: gps.error });
    const context = await getContext(memberId, sessionId); if ('error' in context) return res.status(400).json({ error: context.error });
    const { date, time } = jakartaParts();
    if (date !== context.session.session_date) return res.status(400).json({ error: 'Check-in hanya dapat dilakukan pada tanggal sesi.' });
    if (!inWindow(time, context.session.check_in_start_time, context.session.check_in_end_time)) return res.status(400).json({ error: `Check-in dibuka ${context.session.check_in_start_time.slice(0,5)}–${context.session.check_in_end_time.slice(0,5)} WIB.` });
    const nearest = nearestLocation(gps.latitude, gps.longitude, context.locations);
    if (!nearest || nearest.distance > nearest.radius_meters) return res.status(400).json({ error: `Anda berada di luar radius lokasi sesi (jarak sekitar ${Math.round(nearest?.distance || 0)} m).` });
    const { data: existing, error: existingError } = await db().from('attendance_records').select('id,check_in_at').eq('event_id', context.session.event_id).eq('session_id', sessionId).eq('member_id', memberId).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.check_in_at) return res.status(409).json({ error: 'Anda sudah melakukan check-in untuk sesi ini.' });
    const lateAfter = addMinutes(normalizeTime(context.session.check_in_start_time), context.session.late_tolerance_minutes || 0);
    const status = time > lateAfter ? 'late' : 'on_time';
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, MAX_NOTES_LENGTH) : '';
    const now = new Date().toISOString();
    const payload = { event_id: context.session.event_id, session_id: sessionId, member_id: memberId, overall_status: status === 'late' ? 'late' : 'present', check_in_status: status, check_in_at: now, check_in_location_id: nearest.id, check_in_latitude: gps.latitude, check_in_longitude: gps.longitude, check_in_accuracy_meters: gps.accuracy, check_in_distance_meters: Math.round(nearest.distance * 100) / 100, check_in_inside_radius: true, check_in_notes: notes, source: 'public', updated_at: now };
    const query = existing ? db().from('attendance_records').update(payload).eq('id', existing.id) : db().from('attendance_records').insert(payload);
    const { data: row, error } = await query.select('*').single();
    if (error) { if ((error as any).code === '23505') return res.status(409).json({ error: 'Presensi sesi ini sudah tercatat.' }); throw error; }
    res.json({ success: true, record: publicRecord(row, { name: context.member.name, role: context.member.role }, context.session, nearest.name) });
  } catch (error) { console.error('[attendance/check-in]', error); res.status(500).json({ error: 'Gagal menyimpan check-in' }); }
});

app.post('/api/attendance/check-out', async (req, res) => {
  try {
    const memberId = String(req.body.memberId || ''), sessionId = String(req.body.sessionId || '');
    if (!memberId || !sessionId) return res.status(400).json({ error: 'Panitia dan sesi wajib dipilih' });
    const gps = validateGps(req.body); if ('error' in gps) return res.status(400).json({ error: gps.error });
    const context = await getContext(memberId, sessionId); if ('error' in context) return res.status(400).json({ error: context.error });
    const { date, time } = jakartaParts();
    if (date !== context.session.session_date) return res.status(400).json({ error: 'Check-out hanya dapat dilakukan pada tanggal sesi.' });
    if (!inWindow(time, context.session.check_out_start_time, context.session.check_out_end_time)) return res.status(400).json({ error: `Check-out dibuka ${context.session.check_out_start_time.slice(0,5)}–${context.session.check_out_end_time.slice(0,5)} WIB.` });
    const nearest = nearestLocation(gps.latitude, gps.longitude, context.locations);
    if (!nearest || nearest.distance > nearest.radius_meters) return res.status(400).json({ error: `Anda berada di luar radius lokasi sesi (jarak sekitar ${Math.round(nearest?.distance || 0)} m).` });
    const { data: existing, error: existingError } = await db().from('attendance_records').select('*').eq('event_id', context.session.event_id).eq('session_id', sessionId).eq('member_id', memberId).maybeSingle();
    if (existingError) throw existingError;
    if (!existing?.check_in_at) return res.status(400).json({ error: 'Anda belum melakukan check-in untuk sesi ini.' });
    if (existing.check_out_at) return res.status(409).json({ error: 'Anda sudah melakukan check-out untuk sesi ini.' });
    const now = new Date();
    const duration = Math.max(0, Math.floor((now.getTime() - new Date(existing.check_in_at).getTime()) / 1000));
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim().slice(0, MAX_NOTES_LENGTH) : '';
    const { data: row, error } = await db().from('attendance_records').update({ check_out_status: 'valid', check_out_at: now.toISOString(), check_out_location_id: nearest.id, check_out_latitude: gps.latitude, check_out_longitude: gps.longitude, check_out_accuracy_meters: gps.accuracy, check_out_distance_meters: Math.round(nearest.distance * 100) / 100, check_out_inside_radius: true, check_out_notes: notes, work_duration_seconds: duration, updated_at: now.toISOString() }).eq('id', existing.id).is('check_out_at', null).select('*').single();
    if (error) throw error;
    res.json({ success: true, record: publicRecord(row, { name: context.member.name, role: context.member.role }, context.session, nearest.name) });
  } catch (error) { console.error('[attendance/check-out]', error); res.status(500).json({ error: 'Gagal menyimpan check-out' }); }
});

// Phase 3 will replace these legacy admin routes with Supabase Auth protected endpoints.
app.all(['/api/settings', '/api/locations', '/api/locations/:id', '/api/members', '/api/attendance/manual', '/api/attendance/:id', '/api/reset-data'], (_req, res) => res.status(401).json({ error: 'Fitur admin sedang diamankan. Login admin baru akan tersedia pada Phase 3.' }));

export default app;
