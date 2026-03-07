// config/baseServerConfig.js

export const baseServerConfig = {
  /**
   * =====================================================
   * Server Definitions (Public Metadata)
   * =====================================================
   */
  definitions: {
    serverName: "Kronos RAN",
    serverWebsite: "https://example.com",
    serverMotto: "",
    ePointsName: "E-Points",
    vPointsName: "V-Points",
    footer: "© RNG Development",
    highlights: [
      "Official Ran GS Server - 2015",
      "Optimized Render (GPU Based)",
      "8 Class Gameplay (Magician)",
      "Official Items - Item Set Option",
      "Official Skill Effect",
      "Official Contribution System and Accessories",
      "Official Item Compound",
    ],
  },

  /**
   * =====================================================
   * Core Server Options
   * =====================================================
   */
  coreOptions: {
    maintenanceMode: false,
    enableLogs: true,
    ismd5: true, // legacy compatibility only
    defaultLanguage: "en", // supported: "en", "th"
  },

  /**
   * =====================================================
   * Feature Toggles
   * =====================================================
   */
  features: {
    changePassword: true,
    changePin: true,
    changeEmail: true,
    topup: true,
    webMarket: false,
    characterDelete: true,
    ticketSystem: true,
  },

  /**
   * =====================================================
   * Game Version
   * =====================================================
   * Controls how character data is stored / retrieved.
   *
   * "new"    — Items in DB tables via stored procedures
   *            (sp_ItemGetItemList, sp_ItemSave, etc.)
   *
   * "legacy" — Items stored as binary blobs (Image columns)
   *            (ChaPutOnItems, ChaInvenItems, etc.)
   *            Requires blob deserializers per version.
   */
  gameVersion: {
    itemStorage: "new", // "new" | "legacy"
  },

  /**
   * =====================================================
   * Character Systems
   * =====================================================
   */
  changeSchool: {
    title: "Change School",
    enabled: true,
    fee: 0,
    currency: "ep", // ep | vp | gold
  },

  changeClass: {
    title: "Change Class",
    enabled: true,
    fee: 0,
    currency: "ep", // ep | vp | gold
  },

  resetStats: {
    title: "Reset Stats",
    enabled: true,
    fee: 1,
    currency: "gold", // ep | vp | gold
  },

  reborn: {
    title: "Reborn",
    enabled: true,
    currency: "gold",
    maxReborn: 50,
    tiers: [
      { from: 0, to: 20, levelReq: 170, fee: 1, statReward: 150 },
      { from: 21, to: 30, levelReq: 180, fee: 1, statReward: 150 },
      { from: 31, to: 40, levelReq: 190, fee: 1, statReward: 150 },
      { from: 41, to: 50, levelReq: 200, fee: 1, statReward: 150 },
    ],
  },

  /**
   * =====================================================
   * Conversion Systems (Pending)
   * =====================================================
   */
  convertfeature: {
    vp2ep: {
      enabled: false,
      min: 20,
      rate: 1,
    },
    ep2vp: {
      enabled: false,
      min: 20,
      rate: 1,
    },
  },

  /**
   * =====================================================
   * Voting System (Pending)
   * =====================================================
   */
  votingSystem: {
    enabled: false,
    levelRequirement: 200,
    voteIntervalHours: 12,
    reward: 2,
  },

  /**
   * =====================================================
   * System Requirements
   * =====================================================
   */
  systemRequirements: {
    rows: [
      { component: "Operating System", min: "Windows 7/10", rec: "Windows 11" },
      { component: "CPU", min: "Intel Pentium 3 1.2GHz or AMD Athlon 1500", rec: "Intel Pentium 4 2.4GHz, or higher" },
      { component: "MEMORY", min: "4GB RAM", rec: "16GB RAM" },
      { component: "GRAPHICS CARD", min: "NVIDIA 1050TI/RX570", rec: "RTX 30 SERIES / RX6000 SERIES" },
      { component: "HARD DRIVE", min: "6GB of available hard drive space", rec: "" },
      { component: "CONNECTION SPEED", min: "500KBPS", rec: "100MBPS" },
    ],
  },

  /**
   * =====================================================
   * Slider Configuration
   * =====================================================
   */
  sliderConfig: {
    bannerSlides: [
      { src: "/images/slider/slide_1.jpeg", caption: "Chapter 18: Paragon", enabled: true, link: "" },
    ],
    contentSlides: [
      { src: "/images/slider/slide_1.jpeg", caption: "Chapter 18: Paragon", enabled: true, link: "" },
      { src: "/images/slider/slide_2.jpeg", caption: "Chapter 19: Revelation", enabled: true, link: "" },
    ],
  },

  /**
   * =====================================================
   * Shop Configuration
   * =====================================================
   */
  shop: {
    enabled: true,
    voteShop: true,
    premiumShop: true,
  },

  /**
   * =====================================================
   * UI Helper Limits
   * =====================================================
   */
  uihelper: {
    max_topnews: 5,
    max_toprank: 10,
    max_rankall: 50,
  },

  /**
   * =====================================================
   * Class Availability
   * =====================================================
   */
  classes: {
    brawler: true,
    swordsman: true,
    archer: true,
    shaman: true,
    extreme: true,
    gunner: true,
    assassin: false,
    magician: false,
  },

  /**
   * =====================================================
   * Social Links
   * =====================================================
   */
  social: {
    enabled: true,
    facebook: "https://facebook.com/",
    x: "",
    youtube: "",
    twitch: "",
    steam: "",
  },

  /**
   * =====================================================
   * Site Images (overrides for static assets)
   * Empty string = use default static file from public/images/
   * =====================================================
   */
  siteImages: {
    logoUrl: "",
    metaTitle: "",
    metaTitlePerPath: {},
    metaIconEnabled: false,
    metaIconUrl: "",
    metaIconPaths: {
      "/": true,
      "/dashboard": true,
    },
    metaIconPerPath: {},
    classImages: {},
    schoolImages: {},
  },
};
