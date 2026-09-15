import express, { type Request, type Response } from 'express';
import { requireSupabaseAdmin, supabaseAdmin } from './lib/supabaseAdmin.js';
import { distanceMeters, isValidGps, isWithinTimeWindow, jakartaParts, lateMinutes, minutesFromTime, type RawGpsInput } from './lib/attendancePolicy.js';

const app = express();
app.use(express.json({ limit: '32kb' }));
const eventFields = 'id,name,venue_name,timezone,status';
const sessionFields = 'id,session_number,name,session_date,day_label,agenda_start_time,agenda_end_time,check_in_start_time,check_in_end_time,late_tolerance_minutes,check_out_start_time,check_out_end_time,description,is_active,operational_state';

const errorText = (error: unknown) => error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
const fail = (res: Response, status: number, error: string) => res.status(status).json({ error });
const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function getActiveEvent() {
  const db = requireSupabaseAdmin();
  const { data, error } = await db.from('events').select(eventFields).eq('status', 'active').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

const safeSession = (s: Record<string, unknown>) => ({
  id: s.id, sessionNumber: s.session_number, name: s.name, date: s.session_date, dayLabel: s.day_label,
  agendaStartTime: s.agenda_start_time, agendaEndTime: s.agenda_end_time, checkInStartTime: s.check_in_start_time,
  checkInEndTime: s.check_in_end_time, lateToleranceMinutes: s.late_tolerance_minutes,
  checkOutStartTime: s.check_out_start_time, checkOutEndTime: s.check_out_end_time,
  description: s.description, operationalState: s.operational_state,
});

const safeAttendance = (r: Record<string, unknown> | null, session?: Record<string, unknown>) => r ? ({
  id: r.id, sessionId: r.session_id, status: r.overall_status, checkInStatus: r.check_in_status,
  checkOutStatus: r.check_out_status, checkInAt: r.check_in_at, checkOutAt: r.check_out_at,
  workDurationSeconds: r.work_duration_seconds, sessionName: session?.name, date: session?.session_date,
  operationalState: session?.operational_state,
}) : null;

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: !!supabaseAdmin, service: 'falah-attendance-api', time: new Date().toISOString() }));

app.get('/api/public/bootstrap', async (_req, res) => {
  try {
    const db = requireSupabaseAdmin();
    const event = await getActiveEvent();
    if (!event) return fail(res, 503, 'Event aktif belum dikonfigurasi');
    const [{ data: divisions, error: dError }, { data: sessions, error: sError }] = await Promise.all([
      db.from('divisions').select('id,name,sort_order').eq('event_id', event.id).eq('is_active', true).order('sort_order'),
      db.from('event_sessions').select(sessionFields).eq('event_id', event.id).eq('is_active', true).order('session_number'),
    ]);
    if (dError) throw dError; if (sError) throw sError;
    return res.json({ event: { id: event.id, name: event.name, venueName: event.venue_name, timezone: event.timezone }, divisions: (divisions ?? []).map((d) => ({ id: d.id, name: d.name })), sessions: (sessions ?? []).map(safeSession) });
  } catch (error) { return res.status(503).json({ error: errorText(error) }); }
});

app.get('/api/public/members', async (req, res) => {
  const divisionId = req.query.divisionId;
  if (!isUuid(divisionId)) return fail(res, 400, 'Divisi tidak valid');
  try {
    const db = requireSupabaseAdmin(); const event = await getActiveEvent();
    if (!event) return fail(res, 503, 'Event aktif belum dikonfigurasi');
    const { data, error } = await db.from('committee_members').select('id,name,public_code,division_id').eq('event_id', event.id).eq('division_id', divisionId).eq('is_active', true).order('name');
    if (error) throw error;
    return res.json({ members: (data ?? []).map((m) => ({ id: m.id, name: m.name, publicCode: m.public_code, divisionId: m.division_id })) });
  } catch (error) { return res.status(503).json({ error: errorText(error) }); }
});

app.get('/api/public/attendance-state', async (req, res) => {
  const memberId = req.query.memberId;
  if (!isUuid(memberId)) return fail(res, 400, 'Panitia tidak valid');
  try {
    const db = requireSupabaseAdmin(); const event = await getActiveEvent();
    if (!event) return fail(res, 503, 'Event aktif belum dikonfigurasi');
    const { data: member, error: mError } = await db.from('committee_members').select('id,name,division_id').eq('id', memberId).eq('event_id', event.id).eq('is_active', true).maybeSingle();
    if (mError) throw mError; if (!member) return fail(res, 404, 'Data panitia tidak ditemukan');
    const [{ data, error }, { data: sessions, error: sessionsError }] = await Promise.all([
      db.from('attendance_records').select('id,session_id,overall_status,check_in_status,check_out_status,check_in_at,check_out_at,work_duration_seconds').eq('event_id', event.id).eq('member_id', memberId),
      db.from('event_sessions').select(sessionFields).eq('event_id', event.id).eq('is_active', true).order('session_number'),
    ]);
    if (error) throw error; if (sessionsError) throw sessionsError;
    const sessionMap = new Map((sessions ?? []).map((item) => [item.id, item]));
    return res.json({ member: { id: member.id, name: member.name, divisionId: member.division_id }, attendance: (data ?? []).map((record) => safeAttendance(record, sessionMap.get(record.session_id))) });
  } catch (error) { return res.status(503).json({ error: errorText(error) }); }
});

type Context = { event: Record<string, any>; member: Record<string, any>; session: Record<string, any>; locations: Record<string, any>[] } | { error: string };
async function getContext(memberId: string, sessionId: string): Promise<Context> {
  const db = requireSupabaseAdmin(); const event = await getActiveEvent();
  if (!event) return { error: 'Event aktif belum dikonfigurasi' };
  const [{ data: member, error: mError }, { data: session, error: sError }] = await Promise.all([
    db.from('committee_members').select('id,name,division_id,is_active').eq('id', memberId).eq('event_id', event.id).eq('is_active', true).maybeSingle(),
    db.from('event_sessions').select(sessionFields).eq('id', sessionId).eq('event_id', event.id).eq('is_active', true).maybeSingle(),
  ]);
  if (mError) throw mError; if (sError) throw sError;
  if (!member) return { error: 'Data panitia tidak ditemukan' }; if (!session) return { error: 'Sesi tidak ditemukan' };
  const { data: mappings, error: mapError } = await db.from('session_locations').select('location_id').eq('session_id', session.id);
  if (mapError) throw mapError;
  const locationIds = (mappings ?? []).map((mapping) => mapping.location_id);
  if (!locationIds.length) return { error: 'Lokasi sesi belum dikonfigurasi oleh admin' };
  const { data: locations, error: lError } = await db.from('locations').select('id,latitude,longitude,radius_meters,max_gps_accuracy_meters,is_active').in('id', locationIds).eq('event_id', event.id).eq('is_active', true);
  if (lError) throw lError; if (!locations?.length) return { error: 'Lokasi sesi tidak tersedia' };
  return { event, member, session, locations };
}

function gpsFromBody(body: Record<string, unknown>): RawGpsInput | null {
  const gps = { latitude: Number(body.latitude), longitude: Number(body.longitude), accuracy: Number(body.accuracy) };
  return isValidGps(gps) ? gps : null;
}

async function mutate(action: 'checkin' | 'checkout', req: Request, res: Response) {
  const body = req.body as Record<string, unknown>; const memberId = body.memberId; const sessionId = body.sessionId;
  if (!isUuid(memberId) || !isUuid(sessionId)) return fail(res, 400, 'Panitia dan sesi wajib dipilih');
  const gps = gpsFromBody(body); if (!gps) return fail(res, 422, 'Lokasi GPS tidak valid. Silakan refresh lokasi dan coba lagi.');
  try {
    const db = requireSupabaseAdmin(); const context = await getContext(memberId, sessionId);
    if ('error' in context) return fail(res, 409, context.error);
    const { event, session, locations } = context; const wantedState = action === 'checkin' ? 'checkin_open' : 'checkout_open';
    if (session.operational_state !== wantedState) return fail(res, 409, action === 'checkin' ? 'Check-in belum dibuka untuk sesi ini.' : 'Check-out belum dibuka untuk sesi ini.');
    const now = new Date(); const local = jakartaParts(now);
    if (local.date !== session.session_date) return fail(res, 409, 'Sesi ini belum aktif pada tanggal operasionalnya.');
    if (action === 'checkin' && minutesFromTime(local.time) < minutesFromTime(session.check_in_start_time)) return fail(res, 409, 'Check-in belum masuk waktu yang ditentukan.');
    if (action === 'checkout' && !isWithinTimeWindow(local.time, session.check_out_start_time, session.check_out_end_time)) return fail(res, 409, 'Check-out belum masuk atau sudah melewati waktu yang ditentukan.');
    const maxAccuracy = Math.min(...locations.map((location) => Number(location.max_gps_accuracy_meters ?? 100)));
    if (gps.accuracy > maxAccuracy) return fail(res, 422, 'Akurasi lokasi belum cukup baik. Refresh lokasi dan coba lagi.');
    const nearest = locations.map((location) => ({ location, distance: distanceMeters(gps.latitude, gps.longitude, Number(location.latitude), Number(location.longitude)) })).sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > Number(nearest.location.radius_meters)) return fail(res, 403, 'Anda berada di luar radius lokasi absensi.');
    const location = nearest.location; const distance = nearest.distance;
    const { data: existing, error: eError } = await db.from('attendance_records').select('*').eq('event_id', event.id).eq('session_id', session.id).eq('member_id', memberId).maybeSingle();
    if (eError) throw eError;
    if (action === 'checkin') {
      if (existing?.check_in_at) return fail(res, 409, 'Panitia sudah melakukan check-in untuk sesi ini.');
      const late = lateMinutes(local.time, session.check_in_end_time, session.late_tolerance_minutes) > 0;
      const record = { event_id: event.id, session_id: session.id, member_id: memberId, overall_status: late ? 'late' : 'present', check_in_status: late ? 'late' : 'on_time', check_in_at: now.toISOString(), check_in_location_id: location.id, check_in_latitude: gps.latitude, check_in_longitude: gps.longitude, check_in_accuracy_meters: gps.accuracy, check_in_distance_meters: Math.round(distance * 100) / 100, check_in_inside_radius: true, check_in_notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null, source: 'public' };
      const { data, error } = await db.from('attendance_records').insert(record).select('id,session_id,overall_status,check_in_status,check_in_at').single();
      if (error) { if (error.code === '23505') return fail(res, 409, 'Panitia sudah melakukan check-in untuk sesi ini.'); throw error; }
      return res.status(201).json({ success: true, attendance: safeAttendance(data, session), lateMinutes: lateMinutes(local.time, session.check_in_end_time, session.late_tolerance_minutes) });
    }
    if (!existing?.check_in_at) return fail(res, 409, 'Check-in wajib dilakukan sebelum check-out.'); if (existing.check_out_at) return fail(res, 409, 'Panitia sudah melakukan check-out untuk sesi ini.');
    const duration = Math.max(0, Math.floor((now.getTime() - new Date(existing.check_in_at).getTime()) / 1000));
    const { data, error } = await db.from('attendance_records').update({ check_out_status: 'valid', check_out_at: now.toISOString(), check_out_location_id: location.id, check_out_latitude: gps.latitude, check_out_longitude: gps.longitude, check_out_accuracy_meters: gps.accuracy, check_out_distance_meters: Math.round(distance * 100) / 100, check_out_inside_radius: true, check_out_notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null, work_duration_seconds: duration, updated_at: now.toISOString() }).eq('id', existing.id).is('check_out_at', null).select('id,session_id,overall_status,check_in_status,check_out_status,check_in_at,check_out_at,work_duration_seconds').maybeSingle();
    if (error) throw error; if (!data) return fail(res, 409, 'Check-out sudah diproses atau data berubah.');
    return res.json({ success: true, attendance: safeAttendance(data, session) });
  } catch (error) { return res.status(503).json({ error: errorText(error) }); }
}

app.post('/api/public/attendance/check-in', (req, res) => mutate('checkin', req, res));
app.post('/api/public/attendance/check-out', (req, res) => mutate('checkout', req, res));
app.all('/api/data', (_req, res) => fail(res, 410, 'Endpoint lama tidak tersedia.'));
app.all(['/api/attendance/*', '/api/settings', '/api/locations*', '/api/members', '/api/reset-data'], (_req, res) => fail(res, 403, 'Akses admin belum tersedia pada endpoint publik.'));

export default app;
