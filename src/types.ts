export interface MemberPII {
  id: string;
  role: '領隊' | '副領隊' | '嚮導' | '隊員' | '留守人' | string;
  name: string;
  nickname?: string;
  gender: '男' | '女' | '其他' | string;
  idNumber: string; // 身分證字號 (個資)
  birthDate: string; // 出生年月日 (個資)
  phone: string; // 聯絡電話 (個資)
  email: string; // Email (個資)
  emergencyContact: string; // 緊急聯絡人 (個資)
  emergencyPhone: string; // 緊急聯絡人電話 (個資)
  address?: string; // 住址 (個資)
  bloodType?: string; // 血型 (個資)
  medicalHistory?: string; // 病史/過敏/特殊用藥 (個資)
  diet?: string; // 飲食習慣 (葷/素/忌牛等)
  insuranceBeneficiary?: string; // 保險受益人 (個資)
  customFields?: Record<string, string>; // 自訂欄位
}

export interface ProgressTask {
  id: string;
  key: string;
  label: string; // 標題名稱 (可修改)
  category?: string;
}

export interface MemberProgress {
  memberId: string;
  tasks: Record<string, boolean | string>; // key -> checked / note
  paidAmount?: number;
  paidStatus?: '未付款' | '已付訂金' | '已結清' | '退款' | string;
  exerciseRecorded?: string; // 每週運動紀錄
  notes?: string;
}

export interface PickupLocation {
  id: string;
  time: string;
  locationName: string;
  passengers: string[]; // member names or IDs
  driverName?: string;
  notes?: string;
}

export interface ShuttleRoute {
  id: string;
  title: string; // e.g. "8/18 (二) D0上車時間地點 台北出發"
  departureDate: string;
  stops: PickupLocation[];
}

export interface ItineraryDay {
  id: string;
  dayLabel: string; // e.g. "D0", "DAY1", "DAY2"
  title: string;
  estimatedTime?: string; // e.g. "06:30"
  altitudeGain?: string;
  distance?: string;
  milestones: {
    time: string;
    location: string;
    notes?: string;
  }[];
  waterAndCamp?: string;
  notes?: string;
}

export interface NoticeSection {
  id: string;
  title: string; // 可修改標題
  iconName?: string;
  content: string[]; // 條款內容
}

export interface EquipmentItem {
  id: string;
  category: string;
  name: string;
  required: boolean;
  notes?: string;
  weightGrams?: number;
}

export interface MemberSurvey {
  memberId: string;
  name: string;
  timestamp?: string; // 時間戳記
  mutualCareAgreement?: string; // 是否可以互相照顧隊員以及遵守大家共同決定的事情
  longHikeExp?: string; // 是否有長程縱走經歷(若有請回復行程及是否自理)
  routeKnowledgeConfirmed?: string; // 是否確實知道所前往的路線的基本資料及難度等級
  offlineMapSkill?: string; // 是否能夠判讀離線地圖以及發報位置座標
  rainHikingAcceptable?: string; // 是否可以接受有時候必須於雨中行走的狀況
  paceAgreement?: string; // 是否可以配合隊伍行進大約一小時休息一次的節奏
  heavyPackStamina?: string; // 是否具備一天至少能重裝行走10小時的能力
  medicalAndAltitudeHistory?: string; // 有無高山反應，或其他影響登山安全的病史，以及有無藥物過敏狀況
  spareDayAgreement?: string; // 攀登百岳尤其長程縱走是否可配合預留一天預備日
  weeklyExerciseReport?: string; // 是否可在出發前一個月，於每週日結算一次該週的運動狀況公布於群組
  firstAidCert?: string; // 是否有緊急救護相關證照
  peaksCount?: number | string; // 百岳數(僅供參考)
  
  // additional profile fields
  region?: string;
  ageRange?: string;
  zodiac?: string;
  occupation?: string;
  experienceYears?: string;
  completedTypes?: string[];
  preferredTypes?: string[];
  hobbies?: string;
  hikingStyle?: string;
  volunteerRoles?: string[];
  focusFactors?: string[];
  selfIntro?: string;
  rawAnswers?: Record<string, string>;
}

export interface DynamicSheet {
  id: string;
  name: string; // The exact Sheet Name from Excel or custom
  sheetType: 'overview' | 'progress' | 'pii' | 'shuttle' | 'itinerary' | 'equipment' | 'notices' | 'safety' | 'survey' | 'mutualAid' | 'customTable';
  rawHeaders?: string[];
  rawRows?: (string | number | boolean)[][];
  description?: string;
}

export interface TripSummary {
  tripId: string;
  id: string;
  title: string;
  subtitle?: string;
  dates: string;
  mountain: string;
  route?: string;
  status: 'active' | 'archived';
  memberCount: number;
  leaderName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberIdentity {
  name: string;
  email?: string;
  phone?: string;
  memberId?: string;
  allowedTripIds?: string[];
}

export interface MemberLookupCandidate {
  identifier: string;
  name: string;
  maskedEmail?: string;
  maskedPhone?: string;
  allowedTripIds: string[];
  trips: TripSummary[];
}

export interface ExpeditionPlan {
  id: string;
  tripId?: string; // 唯一團務代號 (例如 TRIP-001, TRIP-002)
  status?: 'active' | 'archived';
  route?: string; // 路線摘要
  createdAt?: string;
  updatedAt?: string;
  title: string; // 活動名稱 (可自訂)
  subtitle?: string;
  dates: string; // 活動日期
  d0Date?: string;
  mountain: string; // 攀登山岳
  trailhead: string; // 入山與下山地點
  leader: {
    name: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  stayBehindPerson?: {
    name: string;
    phone: string;
    deadlineTime?: string;
    instructions?: string;
  };
  radioFrequency: string; // 無線電頻率
  satelliteDevice: string; // 衛星通訊設備 (如 Garmin inReach mini2)
  parkPermitNumber: string; // 入園證/入山證編號
  gpxUrl: string; // GPX 地圖連結
  lineGroupUrl?: string;
  sheets?: DynamicSheet[]; // 所有解析自 Excel 或自訂的工作表清單 (標題完全按照 SHEET 名稱)
  pricing: {
    generalPrice: string;
    regionalPricing?: { region: string; price: string }[];
    includedServices: string[];
    mealAddons?: { label: string; price: string }[];
  };
  customHeaders: {
    overviewTitle?: string;
    progressTitle?: string;
    piiTitle?: string;
    shuttleTitle?: string;
    itineraryTitle?: string;
    equipmentTitle?: string;
    noticesTitle?: string;
    surveyTitle?: string;
    safetyPlanTitle?: string;
  };
  customColumns: {
    tableKey: string; // 'pii' | 'progress' | 'survey' | 'shuttle'
    key: string;
    label: string;
    isPII: boolean; // 是否為機密個資
    type: 'text' | 'checkbox' | 'number' | 'select' | 'date';
  }[];
  progressTasks: ProgressTask[];
  shuttleRoutes: ShuttleRoute[];
  itinerary: ItineraryDay[];
  equipmentList: EquipmentItem[];
  notices: NoticeSection[];
  members: MemberPII[];
  progressData: Record<string, MemberProgress>; // memberId -> progress
  surveyData: Record<string, MemberSurvey>;
  safetyAndRetreatPlan: {
    title: string;
    criteria: string[];
    procedures: string[];
    individualVsGroup?: string[];
    waterAndFoodSOP?: string[];
  };
  weatherCheckLinks: {
    name: string;
    url: string;
    description?: string;
  }[];
}
