import { unpack, pack } from "msgpackr";

export const VERSION = 0x1000;
export const FIELD_COUNT = 27;

export function decode(buffer) {
  const arr = unpack(buffer, { useBigInt64: true });

  if (!Array.isArray(arr) || arr.length !== FIELD_COUNT) {
    throw new Error(
      `Invalid SITEMCUSTOM payload (expected ${FIELD_COUNT} fields)`,
    );
  }

  return mapSITEMCUSTOM(arr);
}

export function encode(obj) {
  const arr = unmapSITEMCUSTOM(obj);

  if (!Array.isArray(arr) || arr.length !== FIELD_COUNT) {
    throw new Error(
      `Invalid SITEMCUSTOM encode (expected ${FIELD_COUNT} fields)`,
    );
  }

  return pack(arr, { useBigInt64: true });
}

/* =========================
   TOP LEVEL
========================= */

function mapSITEMCUSTOM(a) {
  return {
    sNativeID: mapNativeId(a[0]),
    nidDISGUISE: mapNativeId(a[1]),

    tBORNTIME: a[2],
    tDISGUISE: a[3],
    tPERIODEX_BASIC: a[4],
    tPERIODEX_DISGUISE: a[5],

    wTurnNum: a[6],
    cGenType: a[7],
    cPeriodExtensionCount: a[8],
    cCostumePeriodExtensionCount: a[9],

    itemGrade: mapItemGrade(a[10]),
    randomOption: mapRandomOpt(a[11]),

    m_PetDbNum: a[12],
    m_VehicleDbNum: a[13],
    bBoxLocked: a[14],

    dwMainColor: a[15],
    dwSubColor: a[16],

    wDurability: a[17],
    dwDurabilityCount: a[18],
    wRanPointTradeCount: a[19],

    costumeUser: mapCostumeUser(a[20]),
    sTLGrind: mapTLGrind(a[21]),

    guid: mapMGUID(a[22]),
    itemState: mapDbState(a[23]),

    sBasicInfo: mapBasicInfo(a[24]),
    sAddonInfo: mapAddonInfo(a[25]),
    gemSlotItem: mapGemSlotItem(a[26]),
  };
}

function unmapSITEMCUSTOM(o) {
  return [
    unmapNativeId(o.sNativeID),
    unmapNativeId(o.nidDISGUISE),

    o.tBORNTIME ?? 0n,
    o.tDISGUISE ?? 0n,
    o.tPERIODEX_BASIC ?? 0n,
    o.tPERIODEX_DISGUISE ?? 0n,

    o.wTurnNum ?? 0,
    o.cGenType ?? 0,
    o.cPeriodExtensionCount ?? 0,
    o.cCostumePeriodExtensionCount ?? 0,

    unmapItemGrade(o.itemGrade),
    unmapRandomOpt(o.randomOption),

    o.m_PetDbNum ?? 0,
    o.m_VehicleDbNum ?? 0,
    o.bBoxLocked ?? false,

    o.dwMainColor ?? 0,
    o.dwSubColor ?? 0,

    o.wDurability ?? 0,
    o.dwDurabilityCount ?? 0,
    o.wRanPointTradeCount ?? 0,

    unmapCostumeUser(o.costumeUser),
    unmapTLGrind(o.sTLGrind),

    unmapMGUID(o.guid),
    unmapDbState(o.itemState),

    unmapBasicInfo(o.sBasicInfo),
    unmapAddonInfo(o.sAddonInfo),
    unmapGemSlotItem(o.gemSlotItem),
  ];
}

/* =========================
   SNATIVEID
========================= */

function mapNativeId(v) {
  const dwID = Array.isArray(v) ? v[0] : v;
  const n = Number(dwID ?? 0);

  return {
    dwID: n >>> 0,
    wMainID: n & 0xffff,
    wSubID: (n >>> 16) & 0xffff,
  };
}

function unmapNativeId(o) {
  const dwID = o?.dwID ?? ((o?.wSubID ?? 0) << 16) | (o?.wMainID ?? 0);

  return [dwID >>> 0];
}

/* =========================
   ITEM GRADE
========================= */

function mapItemGrade(arr) {
  return {
    cDAMAGE: arr[0] ?? 0,
    cDEFENSE: arr[1] ?? 0,
    cRESIST_FIRE: arr[2] ?? 0,
    cRESIST_ICE: arr[3] ?? 0,
    cRESIST_ELEC: arr[4] ?? 0,
    cRESIST_POISON: arr[5] ?? 0,
    cRESIST_SPIRIT: arr[6] ?? 0,
  };
}

function unmapItemGrade(o) {
  return [
    o?.cDAMAGE ?? 0,
    o?.cDEFENSE ?? 0,
    o?.cRESIST_FIRE ?? 0,
    o?.cRESIST_ICE ?? 0,
    o?.cRESIST_ELEC ?? 0,
    o?.cRESIST_POISON ?? 0,
    o?.cRESIST_SPIRIT ?? 0,
  ];
}

/* =========================
   RANDOM OPTION
========================= */

function mapRandomOpt(arr) {
  return {
    options: arr.map((opt) => ({
      nOptValue: opt[0] ?? 0,
      cOptType: opt[1] ?? 0,
      cOptCount: opt[2] ?? 0,
    })),
  };
}

function unmapRandomOpt(o) {
  return (o?.options ?? []).map((opt) => [
    opt?.nOptValue ?? 0,
    opt?.cOptType ?? 0,
    opt?.cOptCount ?? 0,
  ]);
}

/* =========================
   COSTUME USER
========================= */

function mapCostumeUser(arr) {
  return {
    invest: arr.slice(0, 7).map((inv) => ({
      cStatType: inv[0] ?? 0,
      wInvestPt: inv[1] ?? 0,
    })),
    tEndTime: arr[7] ?? 0n,
  };
}

function unmapCostumeUser(o) {
  const invests = (o?.invest ?? []).map((inv) => [
    inv?.cStatType ?? 0,
    inv?.wInvestPt ?? 0,
  ]);

  while (invests.length < 7) invests.push([0, 0]);

  return [...invests.slice(0, 7), o?.tEndTime ?? 0n];
}

/* =========================
   TL GRIND
========================= */

function mapTLGrind(arr) {
  return {
    cGradeValue: arr[0] ?? 0,
    tFireTime: arr[1] ?? 0n,
  };
}

function unmapTLGrind(o) {
  return [o?.cGradeValue ?? 0, o?.tFireTime ?? 0n];
}

/* =========================
   GUID
========================= */

function mapMGUID(arr) {
  return {
    Data1: arr[0],
    Data2: arr[1],
    Data3: arr[2],
    Data4: arr.slice(3, 11),
  };
}

function unmapMGUID(o) {
  return [
    o?.Data1 ?? 0,
    o?.Data2 ?? 0,
    o?.Data3 ?? 0,
    ...(o?.Data4 ?? Array(8).fill(0)),
  ];
}

/* =========================
   DB STATE
========================= */

function mapDbState(v) {
  return { m_nState: Array.isArray(v) ? v[0] : v };
}

function unmapDbState(o) {
  return [o?.m_nState ?? 0];
}

/* =========================
   BASIC INFO
========================= */

function mapBasicInfo(arr) {
  const attack = Array.isArray(arr[0]) ? arr[0][0] : arr[0];

  return {
    m_sBasicAttackDamage_dwData: attack ?? 0,
    m_wBasicDefence: arr[1] ?? 0,
    m_emLinkSkillTarget: arr[2] ?? 0,
    m_sLinkSkillID: mapNativeId(arr[3]),
    m_wLinkSkillLevel: arr[4] ?? 0,
    m_fLinkSkillOccurRate: arr[5] ?? 0,
  };
}

function unmapBasicInfo(o) {
  return [
    [o?.m_sBasicAttackDamage_dwData ?? 0],
    o?.m_wBasicDefence ?? 0,
    o?.m_emLinkSkillTarget ?? 0,
    unmapNativeId(o?.m_sLinkSkillID),
    o?.m_wLinkSkillLevel ?? 0,
    o?.m_fLinkSkillOccurRate ?? 0,
  ];
}

/* =========================
   ADDON (6 SADDON)
========================= */

function mapAddonInfo(arr) {
  return {
    addons: arr.map((slot) => ({
      emTYPE: slot[0] ?? 0,
      value: slot[1] ?? 0,
    })),
  };
}

function unmapAddonInfo(o) {
  const addons = o?.addons ?? [];
  const out = [];

  for (let i = 0; i < 6; i++) {
    const a = addons[i] ?? {};
    out.push([a?.emTYPE ?? 0, a?.value ?? 0]);
  }

  return out;
}

/* =========================
   GEM SLOT
========================= */

function mapGemSlotItem(arr) {
  return {
    wGemSlotCount: arr[0] ?? 0,
    sGemStone_ID: [
      mapNativeId(arr[1]),
      mapNativeId(arr[2]),
      mapNativeId(arr[3]),
    ],
  };
}

function unmapGemSlotItem(o) {
  return [
    o?.wGemSlotCount ?? 0,
    unmapNativeId(o?.sGemStone_ID?.[0]),
    unmapNativeId(o?.sGemStone_ID?.[1]),
    unmapNativeId(o?.sGemStone_ID?.[2]),
  ];
}
