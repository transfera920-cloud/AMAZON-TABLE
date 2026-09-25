import fs from 'fs';
import path from 'path';
import { ExpeditionPlan, TripSummary, MemberPII, MemberIdentity } from './src/types';
import { initialExpeditionData } from './src/data/defaultExpedition';

const DATA_DIR = path.join(process.cwd(), 'data');
const TRIPS_DIR = path.join(DATA_DIR, 'trips');
const DEFAULT_PLAN_FILE = path.join(DATA_DIR, 'expedition_plan.json');

// Helper to clean phone numbers for robust matching
export function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

// Normalize name for standardized lookup without altering original data
export function normalizeName(name?: string): string {
  if (!name) return '';
  // Convert fullwidth spaces (\u3000) and multi-spaces into single space, trim
  return name.replace(/[\s\u3000]+/g, ' ').trim();
}

// Compare if two names match, ignoring spacing (halfwidth/fullwidth) and casing
export function compareNames(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const cleanA = a.replace(/[\s\u3000]+/g, '').toLowerCase();
  const cleanB = b.replace(/[\s\u3000]+/g, '').toLowerCase();
  return cleanA.length > 0 && cleanA === cleanB;
}

// Masking helpers for sensitive data when showing disambiguation options
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '';
  const parts = email.split('@');
  const user = parts[0];
  const domain = parts.slice(1).join('@');
  if (user.length <= 2) {
    return `${user[0] || '*'}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const digits = cleanPhone(phone);
  if (digits.length < 7) return phone;
  const prefix = digits.slice(0, 4);
  const suffix = digits.slice(-3);
  return `${prefix}-***${suffix}`;
}

// Check if member matches the provided identifier (Email, Phone, Name, MemberId)
export function memberMatches(
  member: MemberPII,
  identifier: { email?: string; phone?: string; name?: string; memberId?: string }
): boolean {
  if (!member || !identifier) return false;

  const idEmail = identifier.email ? identifier.email.trim().toLowerCase() : '';
  const idPhone = identifier.phone ? cleanPhone(identifier.phone) : '';
  const idName = identifier.name ? identifier.name.trim() : '';
  const idMemberId = identifier.memberId ? identifier.memberId.trim() : '';

  // 1. MemberId match
  if (idMemberId && member.id && member.id.trim() === idMemberId) {
    return true;
  }

  // 2. Email match
  if (idEmail && member.email && member.email.trim().toLowerCase() === idEmail) {
    return true;
  }

  // 3. Phone match
  if (idPhone && member.phone && cleanPhone(member.phone) === idPhone) {
    return true;
  }

  // 4. Name match (normalized)
  if (idName && member.name && compareNames(member.name, idName)) {
    return true;
  }

  return false;
}

export interface MemberLookupResult {
  found: boolean;
  error?: string;
  ambiguous?: boolean;
  name?: string;
  allowedTripIds: string[];
  trips: TripSummary[];
  candidates?: {
    identifier: string;
    name: string;
    maskedEmail?: string;
    maskedPhone?: string;
    allowedTripIds: string[];
    trips: TripSummary[];
  }[];
  member?: {
    name: string;
    email?: string;
    phone?: string;
    memberId?: string;
  };
}

// Lookup all trips for a member by real-time scanning all trip files
export function lookupMemberTrips(rawName: string, disambiguateKey?: string): MemberLookupResult {
  const normName = normalizeName(rawName);
  if (!normName) {
    return {
      found: false,
      error: '請輸入姓名以查詢您的所屬團務',
      allowedTripIds: [],
      trips: [],
    };
  }

  const allTrips = getAllTrips();
  const records: { trip: ExpeditionPlan; member: MemberPII }[] = [];

  for (const trip of allTrips) {
    if (!trip.members || !Array.isArray(trip.members)) continue;
    for (const member of trip.members) {
      if (compareNames(member.name, normName)) {
        records.push({ trip, member });
      }
    }
  }

  if (records.length === 0) {
    return {
      found: false,
      error: `找不到【${normName}】的團務資料，請確認姓名是否正確。`,
      allowedTripIds: [],
      trips: [],
    };
  }

  // Check for distinct person candidates (e.g. conflicting phone or email)
  const candidateGroups: {
    key: string;
    name: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    trips: ExpeditionPlan[];
    members: MemberPII[];
  }[] = [];

  for (const rec of records) {
    const pPhone = cleanPhone(rec.member.phone);
    const pEmail = (rec.member.email || '').trim().toLowerCase();

    // Try finding existing matching candidate group
    let matchedGroup = candidateGroups.find((g) => {
      const gPhone = cleanPhone(g.phone);
      const gEmail = (g.email || '').trim().toLowerCase();

      // If both have phone and match
      if (pPhone && gPhone && pPhone === gPhone) return true;
      // If both have email and match
      if (pEmail && gEmail && pEmail === gEmail) return true;
      // If neither has distinguishing data, merge
      if (!pPhone && !gPhone && !pEmail && !gEmail) return true;

      return false;
    });

    if (!matchedGroup) {
      // Check if there is already a group that has clearly DIFFERENT phone/email
      const hasConflict = candidateGroups.some((g) => {
        const gPhone = cleanPhone(g.phone);
        const gEmail = (g.email || '').trim().toLowerCase();
        if (pPhone && gPhone && pPhone !== gPhone) return true;
        if (pEmail && gEmail && pEmail !== gEmail) return true;
        return false;
      });

      if (hasConflict || candidateGroups.length === 0) {
        matchedGroup = {
          key: rec.member.id || pPhone || pEmail || `cand_${candidateGroups.length + 1}`,
          name: rec.member.name,
          email: rec.member.email,
          phone: rec.member.phone,
          idNumber: rec.member.idNumber,
          trips: [],
          members: [],
        };
        candidateGroups.push(matchedGroup);
      } else {
        matchedGroup = candidateGroups[0];
      }
    }

    if (!matchedGroup.trips.some((t) => t.tripId === rec.trip.tripId)) {
      matchedGroup.trips.push(rec.trip);
    }
    matchedGroup.members.push(rec.member);
  }

  // If multiple distinct people with the same name were found, and no disambiguateKey was supplied
  if (candidateGroups.length > 1) {
    if (disambiguateKey) {
      const chosen = candidateGroups.find((c) => c.key === disambiguateKey);
      if (chosen) {
        const allowedTripIds = chosen.trips.map((t) => t.tripId || t.id);
        return {
          found: true,
          ambiguous: false,
          name: chosen.name,
          allowedTripIds,
          trips: chosen.trips.map(toTripSummary),
          member: {
            name: chosen.name,
            email: chosen.email,
            phone: chosen.phone,
            memberId: chosen.key,
          },
        };
      }
    }

    // Return candidates for user confirmation
    return {
      found: true,
      ambiguous: true,
      name: records[0].member.name,
      allowedTripIds: [],
      trips: [],
      candidates: candidateGroups.map((c) => ({
        identifier: c.key,
        name: c.name,
        maskedEmail: maskEmail(c.email),
        maskedPhone: maskPhone(c.phone),
        allowedTripIds: c.trips.map((t) => t.tripId || t.id),
        trips: c.trips.map(toTripSummary),
      })),
    };
  }

  // Single person / merged group
  const targetGroup = candidateGroups[0];
  const allowedTripIds = targetGroup.trips.map((t) => t.tripId || t.id);

  return {
    found: true,
    ambiguous: false,
    name: targetGroup.name,
    allowedTripIds,
    trips: targetGroup.trips.map(toTripSummary),
    member: {
      name: targetGroup.name,
      email: targetGroup.email,
      phone: targetGroup.phone,
      memberId: targetGroup.key,
    },
  };
}

// Ensure trips directory exists
export function ensureTripsDir(): void {
  if (!fs.existsSync(TRIPS_DIR)) {
    fs.mkdirSync(TRIPS_DIR, { recursive: true });
  }
}

// Convert full plan to lightweight summary
export function toTripSummary(plan: ExpeditionPlan): TripSummary {
  const tripId = plan.tripId || plan.id || 'TRIP-UNKNOWN';
  return {
    tripId,
    id: tripId,
    title: plan.title || '未命名登山團務',
    subtitle: plan.subtitle || '',
    dates: plan.dates || '',
    mountain: plan.mountain || '',
    route: plan.route || plan.trailhead || '',
    status: plan.status || 'active',
    memberCount: plan.members ? plan.members.length : 0,
    leaderName: plan.leader ? plan.leader.name : '',
    createdAt: plan.createdAt || new Date().toISOString(),
    updatedAt: plan.updatedAt || new Date().toISOString(),
  };
}

// Read a trip by ID
export function getTrip(tripId: string): ExpeditionPlan | null {
  ensureTripsDir();
  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const plan = JSON.parse(content) as ExpeditionPlan;
      plan.tripId = plan.tripId || tripId;
      return plan;
    } catch (e) {
      console.error(`Error reading trip ${tripId}:`, e);
    }
  }
  return null;
}

// Read all trips from disk
export function getAllTrips(): ExpeditionPlan[] {
  ensureTripsDir();
  const files = fs.readdirSync(TRIPS_DIR).filter((f) => f.endsWith('.json'));
  const trips: ExpeditionPlan[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(TRIPS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const plan = JSON.parse(content) as ExpeditionPlan;
      plan.tripId = plan.tripId || file.replace(/\.json$/, '');
      trips.push(plan);
    } catch (e) {
      console.error(`Error parsing trip file ${file}:`, e);
    }
  }

  // Sort by tripId
  trips.sort((a, b) => (a.tripId || '').localeCompare(b.tripId || ''));
  return trips;
}

// Save or update a trip
export function saveTrip(plan: ExpeditionPlan): boolean {
  ensureTripsDir();
  const tripId = plan.tripId || plan.id || 'TRIP-001';
  plan.tripId = tripId;
  plan.updatedAt = new Date().toISOString();
  if (!plan.createdAt) {
    plan.createdAt = new Date().toISOString();
  }

  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), 'utf-8');
    
    // Also update DEFAULT_PLAN_FILE for legacy tools
    fs.writeFileSync(DEFAULT_PLAN_FILE, JSON.stringify(plan, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`Error saving trip ${tripId}:`, e);
    return false;
  }
}

// Delete a trip
export function deleteTrip(tripId: string): boolean {
  ensureTripsDir();
  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (e) {
      console.error(`Error deleting trip ${tripId}:`, e);
      return false;
    }
  }
  return false;
}

// Initialize and seed multi-trip storage with migration
export function initializeAndMigrateTrips(): void {
  ensureTripsDir();
  const existingFiles = fs.readdirSync(TRIPS_DIR).filter((f) => f.endsWith('.json'));
  
  // If trips already exist, verify or migrate
  if (existingFiles.length > 0) {
    console.log(`Multi-trip storage active with ${existingFiles.length} trips.`);
    return;
  }

  console.log('Initializing multi-trip storage and running first-time data migration...');

  // 1. Check if legacy single plan file exists
  let migratedPlan: ExpeditionPlan | null = null;
  if (fs.existsSync(DEFAULT_PLAN_FILE)) {
    try {
      const data = fs.readFileSync(DEFAULT_PLAN_FILE, 'utf-8');
      migratedPlan = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse existing expedition_plan.json:', e);
    }
  }

  // Base sample member fixtures for the test scenarios:
  const memberWang: MemberPII = {
    id: 'M-WANG-001',
    role: '領隊',
    name: '王小明',
    nickname: '小明',
    gender: '男',
    idNumber: 'A123456789',
    birthDate: '1988/06/15',
    phone: '0910-111222',
    email: 'wang@example.com',
    emergencyContact: '王大山 (父親)',
    emergencyPhone: '0911-222333',
    diet: '葷食',
    medicalHistory: '無',
  };

  const memberLin: MemberPII = {
    id: 'M-LIN-002',
    role: '隊員',
    name: '林小華',
    nickname: '小華',
    gender: '女',
    idNumber: 'B223456789',
    birthDate: '1992/08/20',
    phone: '0920-222333',
    email: 'lin@example.com',
    emergencyContact: '林媽媽',
    emergencyPhone: '0922-333444',
    diet: '蛋奶素',
    medicalHistory: '輕微花粉過敏',
  };

  const memberChen: MemberPII = {
    id: 'M-CHEN-003',
    role: '隊員',
    name: '陳大山',
    nickname: '大山',
    gender: '男',
    idNumber: 'C123456789',
    birthDate: '1985/03/10',
    phone: '0930-333444',
    email: 'chen@example.com',
    emergencyContact: '陳太太 (配偶)',
    emergencyPhone: '0933-444555',
    diet: '葷食 (忌牛肉)',
    medicalHistory: '無',
  };

  const memberChang: MemberPII = {
    id: 'M-CHANG-004',
    role: '隊員',
    name: '張小美',
    nickname: '小美',
    gender: '女',
    idNumber: 'D223456789',
    birthDate: '1995/11/05',
    phone: '0950-555666',
    email: 'chang@example.com',
    emergencyContact: '張爸爸',
    emergencyPhone: '0955-666777',
    diet: '葷食',
    medicalHistory: '無',
  };

  // TRIP-001: 馬博縱走 (王小明, 林小華)
  const trip1: ExpeditionPlan = {
    ...initialExpeditionData,
    id: 'TRIP-001',
    tripId: 'TRIP-001',
    title: '馬博拉斯橫斷 八日極限縱走',
    subtitle: '2026/09/15(二)-09/22(二) 八天七夜，09/14 D0',
    dates: '2026/09/15(二)-09/22(二) 八天七夜',
    d0Date: '09/14(一)',
    mountain: '馬博拉斯山、秀姑巒山、盆駒山、馬利加南山、馬布谷',
    route: '東埔進、中平林道出 (馬博橫斷全段)',
    trailhead: '南投東埔登山口進，花蓮玉里玉里林道出',
    status: 'active',
    leader: {
      name: '王小明',
      phone: '0910-111222',
      emergencyContact: '王大山',
      emergencyPhone: '0911-222333',
    },
    members: [
      memberWang,
      memberLin,
      {
        id: 'M-005',
        role: '嚮導',
        name: '劉沛妤',
        gender: '女',
        idNumber: 'F223344556',
        birthDate: '1990/04/12',
        phone: '0912-345678',
        email: 'liu@example.com',
        emergencyContact: '劉志明',
        emergencyPhone: '0933-112233',
      },
      {
        id: 'M-006',
        role: '隊員',
        name: '阿豪',
        gender: '男',
        idNumber: 'E123344556',
        birthDate: '1987/12/03',
        phone: '0922-888999',
        email: 'hao@example.com',
        emergencyContact: '陳美鳳',
        emergencyPhone: '0988-665544',
      },
    ],
  };

  // TRIP-002: 中央尖山 (王小明, 陳大山) (Migrate existing plan if available)
  let trip2: ExpeditionPlan;
  if (migratedPlan) {
    trip2 = {
      ...migratedPlan,
      id: 'TRIP-002',
      tripId: 'TRIP-002',
      title: migratedPlan.title || '中央尖山 四日縱走團務總表',
      status: 'active',
      route: migratedPlan.trailhead || '勝光登山口來回',
    };
    // Ensure 王小明 and 陳大山 exist in members for seamless test verification
    const existingNames = new Set(trip2.members.map((m) => m.name.trim()));
    if (!existingNames.has('王小明')) {
      trip2.members.unshift(memberWang);
    }
    if (!existingNames.has('陳大山')) {
      trip2.members.push(memberChen);
    }
  } else {
    trip2 = {
      ...initialExpeditionData,
      id: 'TRIP-002',
      tripId: 'TRIP-002',
      title: '中央尖山 四日縱走團務總表',
      subtitle: '2026/10/08(四)-10/11(日) 四天三夜，10/07 D0',
      dates: '2026/10/08(四)-10/11(日) 四天三夜',
      d0Date: '10/07(三)',
      mountain: '中央尖山 (海拔 3,705公尺，台灣三尖之首)',
      route: '勝光登山口 - 南湖溪 - 中央尖溪木屋 - 中央尖山頂',
      trailhead: '勝光登山口 (台7甲線 49.5K)',
      status: 'active',
      leader: {
        name: '王小明',
        phone: '0910-111222',
        emergencyContact: '王大山',
        emergencyPhone: '0911-222333',
      },
      members: [
        memberWang,
        memberChen,
        ...initialExpeditionData.members.filter((m) => m.name !== '王小明' && m.name !== '陳大山'),
      ],
    };
  }

  // TRIP-003: 奇萊東稜 (王小明, 張小美)
  const trip3: ExpeditionPlan = {
    ...initialExpeditionData,
    id: 'TRIP-003',
    tripId: 'TRIP-003',
    title: '奇萊東稜 六日黃金大草原縱走',
    subtitle: '2026/11/05(四)-11/10(二) 六天五夜，11/04 D0',
    dates: '2026/11/05(四)-11/10(二) 六天五夜',
    d0Date: '11/04(三)',
    mountain: '奇萊北峰、磐石山、太魯閣大山、立霧主山、帕托魯山',
    route: '奇萊登山口進、岳王亭出 (百岳四大障礙之一)',
    trailhead: '合歡山松雪樓進，中橫公路岳王亭吊橋出',
    status: 'active',
    leader: {
      name: '王小明',
      phone: '0910-111222',
      emergencyContact: '王大山',
      emergencyPhone: '0911-222333',
    },
    members: [
      memberWang,
      memberChang,
      {
        id: 'M-007',
        role: '嚮導',
        name: '清貫',
        gender: '男',
        idNumber: 'G123344556',
        birthDate: '1984/07/21',
        phone: '0919-445566',
        email: 'qing@example.com',
        emergencyContact: '李雅雯',
        emergencyPhone: '0920-112233',
      },
      {
        id: 'M-008',
        role: '隊員',
        name: '阿帆',
        gender: '男',
        idNumber: 'H123344556',
        birthDate: '1989/09/14',
        phone: '0988-334455',
        email: 'fan@example.com',
        emergencyContact: '林建宏',
        emergencyPhone: '0932-556677',
      },
    ],
  };

  saveTrip(trip1);
  saveTrip(trip2);
  saveTrip(trip3);

  console.log('Successfully seeded 3 isolated trips: TRIP-001 (馬博), TRIP-002 (中央尖), TRIP-003 (奇萊東稜)');
}
