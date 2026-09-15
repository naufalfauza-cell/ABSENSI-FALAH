import { AppSettings, CommitteeMember, LocationTarget, EventSession } from '../types';

export const DEFAULT_SESSIONS: EventSession[] = [
  {
    id: 'sesi-1',
    sessionNumber: 1,
    name: 'Gladi Bersih (Malam)',
    date: '2026-09-24',
    dayLabel: 'Kamis, 24 Sept 2026',
    agendaStartTime: '16:00',
    agendaEndTime: '21:00',
    checkInStartTime: '16:00',
    checkInEndTime: '18:00', // 2 jam pertama
    checkInLateToleranceMinutes: 15,
    checkOutStartTime: '19:00', // 2 jam terakhir (19:00 - 21:00)
    checkOutEndTime: '21:00',
    description: 'Gladi Bersih & Briefing Lapangan Panitia Falah di Kampus B Universitas Airlangga',
  },
  {
    id: 'sesi-2',
    sessionNumber: 2,
    name: 'Hari Ke-1 Acara Utama',
    date: '2026-09-25',
    dayLabel: 'Jumat, 25 Sept 2026',
    agendaStartTime: '06:00',
    agendaEndTime: '17:00',
    checkInStartTime: '06:00',
    checkInEndTime: '08:00', // 2 jam pertama
    checkInLateToleranceMinutes: 15,
    checkOutStartTime: '15:00', // 2 jam terakhir (15:00 - 17:00)
    checkOutEndTime: '17:00',
    description: 'Pelaksanaan Hari Pertama Acara Falah di Kampus B Universitas Airlangga',
  },
  {
    id: 'sesi-3',
    sessionNumber: 3,
    name: 'Hari Ke-2 & Penutupan',
    date: '2026-09-26',
    dayLabel: 'Sabtu, 26 Sept 2026',
    agendaStartTime: '06:00',
    agendaEndTime: '14:00',
    checkInStartTime: '06:00',
    checkInEndTime: '08:00', // 2 jam pertama
    checkInLateToleranceMinutes: 15,
    checkOutStartTime: '12:00', // 2 jam terakhir (12:00 - 14:00)
    checkOutEndTime: '14:00',
    description: 'Pelaksanaan Hari Kedua, Evaluasi, dan Penutupan Kepanitiaan di Kampus B Universitas Airlangga',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  eventName: 'Kepanitiaan Falah Akbar 2026',
  venueName: 'Kampus B Universitas Airlangga',
  activeSessionId: 'sesi-1',
  sessions: DEFAULT_SESSIONS,
  eventDate: '2026-09-24',
  checkInStartTime: '16:00',
  checkInEndTime: '18:00',
  checkInLateToleranceMinutes: 15,
  checkOutStartTime: '19:00',
  checkOutEndTime: '21:00',
  requireLocationRadius: true,
  allowOutsideWindow: true,
  adminPin: '1945',
};

// Default locations in Kampus B Universitas Airlangga (UNAIR), Dharmawangsa Surabaya
export const DEFAULT_LOCATIONS: LocationTarget[] = [
  {
    id: 'loc-unair-1',
    name: 'Posko Utama & Aula Kampus B UNAIR',
    address: 'Jl. Dharmawangsa Dalam Selatan, Surabaya (Pusat Posko Panitia Falah)',
    latitude: -7.2725,
    longitude: 112.7568,
    radiusMeters: 150,
    isActive: true,
    isPrimary: true,
  },
  {
    id: 'loc-unair-2',
    name: 'Gedung Serbaguna & Sekretariat Falah UNAIR',
    address: 'Kompleks Sayap Timur Kampus B Universitas Airlangga',
    latitude: -7.2720,
    longitude: 112.7573,
    radiusMeters: 120,
    isActive: true,
  },
  {
    id: 'loc-unair-3',
    name: 'Area Parkir & Pos Lapangan Barat UNAIR',
    address: 'Pintu Gerbang Barat & Lapangan Parkir Kampus B UNAIR',
    latitude: -7.2732,
    longitude: 112.7562,
    radiusMeters: 150,
    isActive: true,
  },
  {
    id: 'loc-unair-4',
    name: 'Masjid Ulul Azmi & Koridor Utama UNAIR',
    address: 'Masjid Kampus B UNAIR & Ruang Transit Panitia',
    latitude: -7.2715,
    longitude: 112.7578,
    radiusMeters: 120,
    isActive: true,
  },
];

// Seed list of 100 committee members (Panitia Falah)
const DIVISIONS = [
  { name: 'Badan Pengurus Harian (BPH)', count: 6 },
  { name: 'Sie Acara & Protokoler', count: 14 },
  { name: 'Sie Logistik & Perlengkapan', count: 16 },
  { name: 'Sie Konsumsi & Logistik Pangan', count: 16 },
  { name: 'Sie Keamanan & Ketertiban', count: 12 },
  { name: 'Sie Humas & Publikasi', count: 12 },
  { name: 'Sie Dokumentasi & Multimedia', count: 8 },
  { name: 'Sie Medis & P3K', count: 8 },
  { name: 'Sie Kebersihan & Akomodasi', count: 8 },
];

const INDONESIAN_NAMES = [
  'Ahmad Fauzi', 'Rizky Pratama', 'Muhammad Falah', 'Nurul Hidayah', 'Siti Rahmawati',
  'Budi Santoso', 'Dimas Anggara', 'Fajar Ramadhan', 'Tri Wahyuni', 'Eko Prasetyo',
  'Annisa Larasati', 'Bambang Wijaya', 'Dewi Lestari', 'Hendra Kurniawan', 'Indah Permata',
  'Joko Susilo', 'Kartika Putri', 'Lukman Hakim', 'Mega Utami', 'Naufal Almaroqi',
  'Oki Setiawan', 'Putri Ayu', 'Rahmat Hidayat', 'Safira Maharani', 'Teguh Wibowo',
  'Umar Faruq', 'Vina Melati', 'Wahyu Hidayat', 'Yusuf Maulana', 'Zahra Amelia',
  'Aditya Rahman', 'Bagas Saputra', 'Citra Kirana', 'Dian Sastro', 'Farhan Nugraha',
  'Gita Gutawa', 'Hadi Sucipto', 'Irfan Bachdim', 'Julia Perez', 'Kurniawan Dwi',
  'Lestari Utami', 'Mochamad Ridwan', 'Nadia Safitri', 'Oktavian Dwi', 'Panji Gumilang',
  'Qoriatul Aini', 'Rendra Pratama', 'Surya Saputra', 'Taufiq Ismail', 'Ulfa Dwiyanti',
  'Vicky Prasetyo', 'Wulan Guritno', 'Xavier Danu', 'Yosep Rizal', 'Zulhasan Syah',
  'Agus Salim', 'Bella Novita', 'Chandra Wijaya', 'Dedi Mizwar', 'Endang Suhartini',
  'Fitriani Rahayu', 'Galih Permana', 'Hamzah Fansuri', 'Iqbal Ramadhan', 'Jihan Fahira',
  'Kusuma Wardani', 'Latifah Hanum', 'Muhamad Ilham', 'Novita Anggraini', 'Omar Daniel',
  'Pramoedya Ananta', 'Qonita Mufida', 'Rian D’Masiv', 'Shinta Bachir', 'Tantri Syalindri',
  'Usman Harun', 'Vino Bastian', 'Wira Nagara', 'Yahya Waloni', 'Zaskia Sungkar',
  'Akbar Tanjung', 'Bayu Skak', 'Chairul Tanjung', 'Deni Sumargo', 'Erina Gudono',
  'Fauzan Nasrul', 'Gofar Hilman', 'Hatta Rajasa', 'Iis Dahlia', 'Judika Sihotang',
  'Kezia Karamoy', 'Luna Maya', 'Marcell Darwin', 'Najwa Shihab', 'Once Mekel',
  'Pevita Pearce', 'Raffi Ahmad', 'Sule Prikitiw', 'Tora Sudiro', 'Vicky Shu'
];

export function generateInitialMembers(): CommitteeMember[] {
  const members: CommitteeMember[] = [];
  let nameIndex = 0;

  DIVISIONS.forEach((div, divIndex) => {
    for (let i = 0; i < div.count; i++) {
      const isLead = i === 0;
      const isVice = i === 1 && div.count > 5;
      let role = 'Anggota';
      if (divIndex === 0) {
        if (i === 0) role = 'Ketua Umum Panitia';
        else if (i === 1) role = 'Wakil Ketua Panitia';
        else if (i === 2) role = 'Sekretaris 1';
        else if (i === 3) role = 'Sekretaris 2';
        else if (i === 4) role = 'Bendahara 1';
        else if (i === 5) role = 'Bendahara 2';
      } else {
        if (isLead) role = 'Koordinator Divisi';
        else if (isVice) role = 'Wakil Koordinator';
      }

      const name = INDONESIAN_NAMES[nameIndex % INDONESIAN_NAMES.length];
      const memberId = `FLH-${String(nameIndex + 1).padStart(3, '0')}`;
      members.push({
        id: memberId,
        name: name,
        division: div.name,
        role: role,
        phone: `0812${String(10000000 + nameIndex).slice(0, 8)}`,
      });
      nameIndex++;
    }
  });

  return members;
}
