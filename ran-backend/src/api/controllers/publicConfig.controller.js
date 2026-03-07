import { baseServerConfig } from "../../config/server.config.js";
import { getPublicStats as fetchPublicStats } from "../../services/admin-panel/dashboard.service.js";

export function getPublicConfig(req, res) {
  res.json({
    serverName: baseServerConfig.definitions.serverName,
    serverWebsite: baseServerConfig.definitions.serverWebsite,
    serverMotto: baseServerConfig.definitions.serverMotto,
    ePointsName: baseServerConfig.definitions.ePointsName,
    vPointsName: baseServerConfig.definitions.vPointsName ?? "V-Points",
    footertext: baseServerConfig.definitions.footer,
    highlights: baseServerConfig.definitions.highlights ?? [],
    defaultLanguage: baseServerConfig.coreOptions.defaultLanguage ?? "en",

    sliderConfig: {
      bannerSlides: baseServerConfig.sliderConfig.bannerSlides ?? [],
      contentSlides: baseServerConfig.sliderConfig.contentSlides ?? [],
    },

    features: {
      changePassword: baseServerConfig.features.changePassword,
      changePin: baseServerConfig.features.changePin,
      changeEmail: baseServerConfig.features.changeEmail,
      topUp: baseServerConfig.features.topup,
      characterDelete: baseServerConfig.features.characterDelete,
      ticketSystem: baseServerConfig.features.ticketSystem,
    },

    shop: {
      enabled: baseServerConfig.shop.enabled,
      voteShop: baseServerConfig.shop.voteShop,
      premiumShop: baseServerConfig.shop.premiumShop,
    },

    systemRequirements: {
      rows: baseServerConfig.systemRequirements?.rows ?? [],
    },

    ...(() => {
      const raw = baseServerConfig.locales;
      if (!raw) {
        return {
          locales: null,
          enabledLocales: [{ code: "en", displayName: "English" }],
        };
      }
      const { _meta = {}, ...localeData } = raw;
      const hasMeta = Object.keys(_meta).length > 0;
      const enabledLocales = hasMeta
        ? Object.entries(_meta)
            .filter(([, m]) => m.enabled !== false)
            .map(([code, m]) => ({ code, displayName: m.displayName ?? code.toUpperCase() }))
        : Object.keys(localeData).map((code) => ({
            code,
            displayName: code.toUpperCase(),
          }));

      // English is the built-in base language — always present
      if (!enabledLocales.find((l) => l.code === "en")) {
        enabledLocales.unshift({ code: "en", displayName: "English" });
      }

      const filteredLocales = {};
      for (const { code } of enabledLocales) {
        if (localeData[code]) filteredLocales[code] = localeData[code];
      }
      return {
        locales: Object.keys(filteredLocales).length > 0 ? filteredLocales : null,
        enabledLocales,
      };
    })(),

    siteImages: {
      logoUrl: baseServerConfig.siteImages?.logoUrl ?? "",
      metaTitle: baseServerConfig.siteImages?.metaTitle ?? "",
      metaTitlePerPath: baseServerConfig.siteImages?.metaTitlePerPath ?? {},
      metaIconEnabled: baseServerConfig.siteImages?.metaIconEnabled ?? false,
      metaIconUrl: baseServerConfig.siteImages?.metaIconUrl ?? "",
      metaIconPaths: baseServerConfig.siteImages?.metaIconPaths ?? {},
      metaIconPerPath: baseServerConfig.siteImages?.metaIconPerPath ?? {},
      classImages: baseServerConfig.siteImages?.classImages ?? {},
      schoolImages: baseServerConfig.siteImages?.schoolImages ?? {},
    },

    gameoptions: {
      changeSchool: {
        enabled: baseServerConfig.changeSchool.enabled,
        fee: baseServerConfig.changeSchool.fee,
        currency: baseServerConfig.changeSchool.currency,
      },
      resetStats: {
        enabled: baseServerConfig.resetStats.enabled,
        fee: baseServerConfig.resetStats.fee,
        currency: baseServerConfig.resetStats.currency,
      },
      changeClass: {
        enabled: baseServerConfig.changeClass.enabled,
        fee: baseServerConfig.changeClass.fee,
        currency: baseServerConfig.changeClass.currency,
      },

      reborn: {
        enabled: baseServerConfig.reborn.enabled,
        currency: baseServerConfig.reborn.currency,
        maxReborn: baseServerConfig.reborn.maxReborn,

        // UI-safe tier info
        tiers: baseServerConfig.reborn.tiers.map((tier, index) => ({
          stage: index + 1,
          from: tier.from,
          to: tier.to,
          levelReq: tier.levelReq,
          fee: tier.fee,
          statReward: tier.statReward,
        })),
      },

      vp2ep: {
        enabled: baseServerConfig.convertfeature.vp2ep.enabled,
        min: baseServerConfig.convertfeature.vp2ep.min,
        rate: baseServerConfig.convertfeature.vp2ep.rate,
      },

      ep2vp: {
        enabled: baseServerConfig.convertfeature.ep2vp.enabled,
        min: baseServerConfig.convertfeature.ep2vp.min,
        rate: baseServerConfig.convertfeature.ep2vp.rate,
      },

      uihelper: {
        max_topnews: baseServerConfig.uihelper.max_topnews,
        max_toprank: baseServerConfig.uihelper.max_toprank,
        max_rankall: baseServerConfig.uihelper.max_rankall,
      },

      classes: {
        brawler: baseServerConfig.classes.brawler,
        swordsman: baseServerConfig.classes.swordsman,
        archer: baseServerConfig.classes.archer,
        shaman: baseServerConfig.classes.shaman,
        extreme: baseServerConfig.classes.extreme,
        gunner: baseServerConfig.classes.gunner,
        assassin: baseServerConfig.classes.assassin,
        magician: baseServerConfig.classes.magician,
        shaper: baseServerConfig.classes.shaper,
      },

      social: {
        enabled: baseServerConfig.social.enabled,
        facebook: baseServerConfig.social.facebook,
        x: baseServerConfig.social.x,
        youtube: baseServerConfig.social.youtube,
        twitch: baseServerConfig.social.twitch,
        steam: baseServerConfig.social.steam,
      },
    },
  });
}

export async function getPublicStats(req, res) {
  try {
    const stats = await fetchPublicStats();
    res.json(stats);
  } catch {
    res.json({ totalAccounts: 0, totalCharacters: 0, activePlayers: 0 });
  }
}
