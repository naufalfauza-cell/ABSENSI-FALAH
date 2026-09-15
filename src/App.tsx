import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock3, MapPin, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import type { GPSPosition, OperationalState, PublicAttendance, PublicDivision, PublicMember, PublicSession } from './types.js';
import { api, bootstrapFailure } from './lib/api.js';

type Screen = 'splash' | 'division' | 'member' | 'session' | 'attendance';
type Bootstrap = { event: { id: string; name: string; venueName: string; timezone: string }; divisions: PublicDivision[]; sessions: PublicSession[] };

const stateLabel: Record<OperationalState, string> = { closed: 'Ditutup', checkin_open: 'Check-in dibuka', checkout_open: 'Check-out dibuka', completed: 'Selesai' };
const stateColor: Record<OperationalState, string> = { closed: 'bg-slate-100 text-slate-500', checkin_open: 'bg-emerald-100 text-emerald-700', checkout_open: 'bg-amber-100 text-amber-700', completed: 'bg-indigo-100 text-indigo-700' };

function Header({ onBack, onChange }: { onBack?: () => void; onChange?: () => void }) {
  return <header className="flex items-center justify-between px-5 py-4 text-white">
    <div className="flex items-center gap-3">{onBack && <button onClick={onBack} aria-label="Kembali" className="rounded-full p-2 hover:bg-white/10"><ChevronLeft size={20} /></button>}<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl font-black">F</div><div><p className="text-xs font-medium tracking-[0.25em] text-emerald-100">FALAH 2026</p><h1 className="font-bold">Absensi Panitia</h1></div></div>
    {onChange && <button onClick={onChange} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-emerald-50">Ganti Panitia</button>}
  </header>;
}

function Shell({ children, onBack, onChange }: { children: ReactNode; onBack?: () => void; onChange?: () => void }) {
  return <main className="min-h-screen bg-slate-50"><div className="mx-auto min-h-screen max-w-md overflow-hidden bg-white shadow-xl"><div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600"><Header onBack={onBack} onChange={onChange} /></div>{children}</div></main>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [division, setDivision] = useState<PublicDivision | null>(null);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [member, setMember] = useState<PublicMember | null>(null);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [attendance, setAttendance] = useState<PublicAttendance | null>(null);
  const [gps, setGps] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api<Bootstrap>('/api/public/bootstrap').then((data) => {
      if (!data.event || !Array.isArray(data.divisions) || !Array.isArray(data.sessions)) {
        console.error('[FALAH bootstrap]', { reason: 'invalid_payload' });
        throw new Error(bootstrapFailure);
      }
      setBootstrap(data);
    }).catch(() => setError(bootstrapFailure));
    const timer = window.setTimeout(() => setScreen('division'), 700);
    return () => window.clearTimeout(timer);
  }, []);
  const selectedAttendance = useMemo(() => attendance, [attendance]);

  const chooseDivision = async (item: PublicDivision) => { setError(''); setDivision(item); setLoading(true); try { const data = await api<{ members: PublicMember[] }>(`/api/public/members?divisionId=${encodeURIComponent(item.id)}`); setMembers(data.members); setScreen('member'); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  const chooseMember = (item: PublicMember) => { setMember(item); setScreen('session'); setError(''); };
  const chooseSession = async (item: PublicSession) => { setSession(item); setLoading(true); setError(''); try { const data = await api<{ attendance: PublicAttendance[] }>(`/api/public/attendance-state?memberId=${item ? member?.id : ''}`); setAttendance(data.attendance.find((record) => record.sessionId === item.id) ?? null); setScreen('attendance'); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  const getLocation = () => { setError(''); setNotice(''); if (!navigator.geolocation) return setError('Browser ini tidak mendukung GPS.'); setLoadingText('Mengambil lokasi GPS...'); setLoading(true); navigator.geolocation.getCurrentPosition((position) => { setGps({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: position.timestamp }); setNotice('Lokasi berhasil diperbarui.'); setLoading(false); setLoadingText(''); }, (geoError) => { setError(geoError.code === 1 ? 'Izin lokasi diperlukan untuk absensi.' : 'Lokasi belum tersedia. Coba lagi di area terbuka.'); setLoading(false); setLoadingText(''); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }); };
  const submit = async (action: 'check-in' | 'check-out') => { if (!member || !session || !gps) return; setLoading(true); setLoadingText(action === 'check-in' ? 'Memproses check-in...' : 'Memproses check-out...'); setError(''); try { await api(`/api/public/attendance/${action}`, { method: 'POST', body: JSON.stringify({ memberId: member.id, sessionId: session.id, latitude: gps.latitude, longitude: gps.longitude, accuracy: gps.accuracy }) }); const data = await api<{ attendance: PublicAttendance[] }>(`/api/public/attendance-state?memberId=${member.id}`); setAttendance(data.attendance.find((record) => record.sessionId === session.id) ?? null); setNotice(action === 'check-in' ? 'Check-in berhasil disimpan oleh server.' : 'Check-out berhasil disimpan oleh server.'); } catch (e) { setError((e as Error).message); } finally { setLoading(false); setLoadingText(''); } };
  const resetMember = () => { setMember(null); setDivision(null); setSession(null); setAttendance(null); setGps(null); setScreen('division'); setError(''); setNotice(''); };
  const back = () => { setError(''); if (screen === 'member') setScreen('division'); else if (screen === 'session') setScreen('member'); else if (screen === 'attendance') setScreen('session'); };

  if (screen === 'splash') return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-800 to-teal-600 text-white"><div className="text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-5xl font-black shadow-2xl">F</div><p className="font-semibold tracking-[0.35em]">FALAH 2026</p><p className="mt-2 text-sm text-emerald-100">Absensi Panitia</p></div></main>;
  if (!bootstrap) return <Shell><div className="p-6"><Alert text={error || 'Menghubungkan ke server...'} />{error && <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">Muat ulang halaman</button>}</div></Shell>;
  return <Shell onBack={screen !== 'division' ? back : undefined} onChange={member ? resetMember : undefined}><div className="p-5">
    {screen === 'division' && <><Step title="Pilih Divisi" subtitle="Pilih divisi kepanitiaan Anda untuk melanjutkan." icon={<Users />} /><div className="space-y-3">{bootstrap.divisions.map((item) => <button key={item.id} onClick={() => chooseDivision(item)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400"><span className="font-semibold text-slate-800">{item.name}</span><ChevronRight className="text-emerald-600" size={20} /></button>)}</div></>}
    {screen === 'member' && <><Step title="Pilih Nama" subtitle={division?.name ?? ''} icon={<Users />} /><div className="space-y-3">{members.map((item) => <button key={item.id} onClick={() => chooseMember(item)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left shadow-sm"><span><span className="block font-semibold text-slate-800">{item.name}</span><span className="text-xs text-slate-500">{item.publicCode}</span></span><ChevronRight className="text-emerald-600" size={20} /></button>)}</div></>}
    {screen === 'session' && <><Step title="Pilih Sesi" subtitle={`${member?.name} · ${division?.name}`} icon={<Clock3 />} /><div className="space-y-4">{bootstrap.sessions.map((item) => <button key={item.id} onClick={() => chooseSession(item)} className="w-full rounded-2xl border border-slate-200 p-4 text-left shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.dayLabel}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${stateColor[item.operationalState]}`}>{stateLabel[item.operationalState]}</span></div><p className="mt-3 text-xs text-slate-500">Check-in {item.checkInStartTime}–{item.checkInEndTime} · Check-out {item.checkOutStartTime}–{item.checkOutEndTime}</p></button>)}</div></>}
    {screen === 'attendance' && session && <><Step title="Absensi Panitia" subtitle={`${member?.name} · ${session.name}`} icon={<ShieldCheck />} /><div className="rounded-3xl bg-emerald-50 p-5"><div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-600 p-3 text-white"><MapPin size={22} /></div><div><p className="font-bold text-emerald-900">Status lokasi</p><p className="text-sm text-emerald-700">{gps ? `Akurasi ±${Math.round(gps.accuracy)} meter` : 'Belum diperbarui'}</p></div></div><button onClick={getLocation} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-emerald-700 shadow-sm disabled:opacity-60"><RefreshCw size={17} className={loading && loadingText.includes('GPS') ? 'animate-spin' : ''} /> Refresh Lokasi</button></div><div className="mt-4 rounded-2xl border border-slate-200 p-4"><div className="flex justify-between"><span className="text-sm text-slate-500">Sesi</span><span className="text-sm font-semibold text-slate-800">{session.dayLabel}</span></div><div className="mt-3 flex justify-between"><span className="text-sm text-slate-500">Status</span><span className="text-sm font-semibold capitalize text-slate-800">{selectedAttendance?.status ?? 'Belum hadir'}</span></div></div><div className="mt-5">{session.operationalState === 'closed' || session.operationalState === 'completed' ? <Notice text={`Sesi saat ini ${stateLabel[session.operationalState].toLowerCase()}.`} /> : selectedAttendance?.checkOutAt ? <Notice text="Check-in dan check-out sudah tercatat." success /> : session.operationalState === 'checkin_open' && selectedAttendance?.checkInAt ? <Notice text="Check-in sudah tercatat. Menunggu waktu check-out dibuka." success /> : session.operationalState === 'checkout_open' && !selectedAttendance?.checkInAt ? <Notice text="Check-in belum tercatat untuk sesi ini." /> : <button onClick={() => submit(session.operationalState === 'checkout_open' ? 'check-out' : 'check-in')} disabled={!gps || loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-4 font-bold text-white shadow-lg disabled:bg-slate-300">{loading ? loadingText : session.operationalState === 'checkout_open' ? 'Check-out Sekarang' : 'Check-in Sekarang'}<Check size={19} /></button>}</div></>}
    {loading && screen !== 'attendance' && <p className="mt-4 text-center text-sm text-slate-500">Memuat data...</p>}{error && <Alert text={error} />}{notice && <Notice text={notice} success />}
  </div></Shell>;
}

function Step({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) { return <div className="mb-6"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">{icon}</div><h2 className="text-2xl font-black text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>; }
function Alert({ text }: { text: string }) { return <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{text}</div>; }
function Notice({ text, success = false }: { text: string; success?: boolean }) { return <div className={`rounded-2xl p-4 text-center text-sm font-medium ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{text}</div>; }

export default App;
