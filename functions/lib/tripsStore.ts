import { ExpeditionPlan, TripSummary, MemberPII } from '../../src/types';
import { initialExpeditionData } from '../../src/data/defaultExpedition';

// ==========================================
// Cloudflare KV & Pages Types
// ==========================================

export interface KVNamespace {
  get(key: string, options?: any): Promise<string | null>;
  put(key: string, value: string, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: any }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface Env {
  TRIPS_KV: KVNamespace;
  [key: string]: any;
}

export interface EventContext<Env, P extends string = any, Data = any> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

export type PagesFunction<
  E = Env,
  P extends string = any,
  D extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<E, P, D>) => Response | Promise<Response>;

// ==========================================
// Helper functions for formatting responses & auth
// ==========================================

export function jsonResponse(data: any, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...init?.headers,
    },
    ...init,
  });
}

export function checkIsAdmin(request: Request): boolean {
  const adminHeader = request.headers.get('x-admin-auth');
  const url = new URL(request.url);
  const adminQuery = url.searchParams.get('adminAuth');
  return adminHeader === 'true' || adminQuery === 'true';
}

export function extractMemberIdentity(request: Request) {
  const url = new URL(request.url);
  const email = request.headers.get('x-member-email') || url.searchParams.get('email');
  const phone = request.headers.get('x-member-phone') || url.searchParams.get('phone');
  const name = request.headers.get('x-member-name') || url.searchParams.get('name');
  const memberId = request.headers.get('x-member-id') || url.searchParams.get('memberId');

  if (!email && !phone && !name && !memberId) {
    return null;
  }

  return {
    email: email ? decodeURIComponent(email).trim() : undefined,
    phone: phone ? decodeURIComponent(phone).trim() : undefined,
    name: name ? decodeURIComponent(name).trim() : undefined,
    memberId: memberId ? decodeURIComponent(memberId).trim() : undefined,
  };
}

// ==========================================
// Pure logic functions (preserved identically)
// ==========================================

export function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

export function normalizeName(name?: string): string {
  if (!name) return '';
  return name.replace(/[\s\u3000]+/g, ' ').trim();
}

export function compareNames(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const cleanA = a.replace(/[\s\u3000]+/g, '').toLowerCase();
  const cleanB = b.replace(/[\s\u3000]+/g, '').toLowerCase();
  return cleanA.length > 0 && cleanA === cleanB;
}

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

export function lookupMemberTripsFromList(
  allTrips: ExpeditionPlan[],
  rawName: string,
  disambiguateKey?: string
): MemberLookupResult {
  const normName = normalizeName(rawName);
  if (!normName) {
    return {
      found: false,
      error: '請輸入姓名以查詢您的所屬團務',
      allowedTripIds: [],
      trips: [],
    };
  }

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

    let matchedGroup = candidateGroups.find((g) => {
      const gPhone = cleanPhone(g.phone);
      const gEmail = (g.email || '').trim().toLowerCase();

      if (pPhone && gPhone && pPhone === gPhone) return true;
      if (pEmail && gEmail && pEmail === gEmail) return true;
      if (!pPhone && !gPhone && !pEmail && !gEmail) return true;

      return false;
    });

    if (!matchedGroup) {
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

export async function lookupMemberTrips(
  kv: KVNamespace,
  rawName: string,
  disambiguateKey?: string
): Promise<MemberLookupResult> {
  const allTrips = await getAllTrips(kv);
  return lookupMemberTripsFromList(allTrips, rawName, disambiguateKey);
}

// ==========================================
// Cloudflare KV CRUD operations
// ==========================================

export async function getTrip(kv: KVNamespace, tripId: string): Promise<ExpeditionPlan | null> {
  try {
    const raw = await kv.get(`trip:${tripId}`);
    if (!raw) return null;
    const plan = JSON.parse(raw) as ExpeditionPlan;
    plan.tripId = plan.tripId || tripId;
    return plan;
  } catch (e) {
    console.error(`Error reading trip ${tripId} from KV:`, e);
    return null;
  }
}

export async function getAllTrips(kv: KVNamespace): Promise<ExpeditionPlan[]> {
  try {
    const listResult = await kv.list({ prefix: 'trip:' });
    const trips: ExpeditionPlan[] = [];
    if (listResult && listResult.keys) {
      for (const key of listResult.keys) {
        const raw = await kv.get(key.name);
        if (raw) {
          try {
            const plan = JSON.parse(raw) as ExpeditionPlan;
            const tripIdFromKey = key.name.replace(/^trip:/, '');
            plan.tripId = plan.tripId || tripIdFromKey;
            trips.push(plan);
          } catch (err) {
            console.error(`Error parsing trip from KV key ${key.name}:`, err);
          }
        }
      }
    }
    trips.sort((a, b) => (a.tripId || '').localeCompare(b.tripId || ''));
    return trips;
  } catch (e) {
    console.error('Error listing trips from KV:', e);
    return [];
  }
}

export async function saveTrip(kv: KVNamespace, plan: ExpeditionPlan): Promise<boolean> {
  const tripId = plan.tripId || plan.id || 'TRIP-001';
  plan.tripId = tripId;
  plan.updatedAt = new Date().toISOString();
  if (!plan.createdAt) {
    plan.createdAt = new Date().toISOString();
  }
  try {
    await kv.put(`trip:${tripId}`, JSON.stringify(plan));
    return true;
  } catch (e) {
    console.error(`Error saving trip ${tripId} to KV:`, e);
    return false;
  }
}

export async function deleteTrip(kv: KVNamespace, tripId: string): Promise<boolean> {
  try {
    await kv.delete(`trip:${tripId}`);
    return true;
  } catch (e) {
    console.error(`Error deleting trip ${tripId} from KV:`, e);
    return false;
  }
}

// ==========================================
// Seed Data Fixtures (TRIP-001, TRIP-002, TRIP-003)
// ==========================================

export function getSeedTrips(): ExpeditionPlan[] {
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

  // TRIP-001: 馬博橫斷 (王小明, 林小華)
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

  // TRIP-002: 中央尖山 (王小明, 陳大山)
  const trip2: ExpeditionPlan = {
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

  return [trip1, trip2, trip3];
}

// Seed trips into KV if KV is completely empty
export async function seedTripsIfEmpty(kv: KVNamespace): Promise<boolean> {
  const listResult = await kv.list({ prefix: 'trip:' });
  if (listResult && listResult.keys && listResult.keys.length > 0) {
    return false;
  }
  const seedTrips = getSeedTrips();
  for (const trip of seedTrips) {
    await saveTrip(kv, trip);
  }
  return true;
}

// Reset trips in KV to the initial 3 seed trips
export async function resetTrips(kv: KVNamespace): Promise<void> {
  const listResult = await kv.list({ prefix: 'trip:' });
  if (listResult && listResult.keys) {
    for (const key of listResult.keys) {
      await kv.delete(key.name);
    }
  }
  const seedTrips = getSeedTrips();
  for (const trip of seedTrips) {
    await saveTrip(kv, trip);
  }
}
