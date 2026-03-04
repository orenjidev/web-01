import { ClassValue } from "@/constants/character.constant";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

export interface PublicConfig {
  serverName: string;
  serverWebsite: string;
  serverMotto: string;
  ePointsName: string;
  footertext: string;
  highlights: string[];
  defaultLanguage: string;

  sliderConfig: {
    bannerSlides: { src: string; caption: string; enabled: boolean; link?: string }[];
    contentSlides: { src: string; caption: string; enabled: boolean; link?: string }[];
  };

  systemRequirements: {
    rows: { component: string; min: string; rec: string }[];
  };

  features: {
    changePassword: boolean;
    changePin: boolean;
    changeEmail: boolean;
    topUp: boolean;
    characterDelete: boolean;
    ticketSystem: boolean;
  };

  shop: {
    enabled: boolean;
    voteShop: boolean;
    premiumShop: boolean;
  };

  gameoptions: {
    changeSchool: {
      enabled: boolean;
      fee: number;
      currency: "ep" | "vp" | "gold";
    };

    changeClass: {
      enabled: boolean;
      fee: number;
      currency: "ep" | "vp" | "gold";
    };

    resetStats: {
      enabled: boolean;
      fee: number;
      currency: "ep" | "vp" | "gold";
    };

    reborn: {
      enabled: boolean;
      currency: "ep" | "vp" | "gold";
      maxReborn: number;
      tiers: {
        stage: number;
        from: number;
        to: number;
        levelReq: number;
        fee: number;
        statReward: number;
      }[];
    };

    vp2ep: {
      enabled: boolean;
      min: number;
      rate: number;
    };

    ep2vp: {
      enabled: boolean;
      min: number;
      rate: number;
    };

    uihelper: {
      max_topnews: number;
      max_toprank: number;
      max_rankall: number;
    };

    classes: Record<ClassValue, boolean>;

    social: {
      enabled: boolean;
      facebook: string;
      x: string;
      youtube: string;
      twitch: string;
      steam: string;
    };
  };
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  const res = await fetch(`${API_BASE_URL}/api/public/config`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load public config");
  }

  const json = await res.json();

  return json;
}
