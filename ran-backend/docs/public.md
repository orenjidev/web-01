# Public Config API Documentation

## Overview

**Base Path:** `/api/public`  
**Authentication:** None

Provides public server configuration and feature flags for the frontend.

---

## Get Public Config

**Endpoint:**  
`GET /api/public/config`

**Description:**  
Returns public server settings and feature flags.

### Success Response (Example)

```json
{
  "serverName": "Example Server",
  "serverWebsite": "https://example.com",
  "serverMotto": "Play fair",
  "ePointsName": "EP",
  "footertext": "Footer text",
  "features": {
    "changePassword": true,
    "changePin": true,
    "changeEmail": true,
    "topUp": true,
    "characterDelete": true,
    "ticketSystem": true
  },
  "gameoptions": {
    "changeSchool": {
      "enabled": true,
      "fee": 1000,
      "currency": "EP"
    },
    "resetStats": {
      "enabled": true,
      "fee": 500,
      "currency": "EP"
    },
    "reborn": {
      "enabled": true,
      "tiers": [
        {
          "stage": 1,
          "from": 1,
          "to": 2,
          "levelReq": 120,
          "fee": 1000,
          "statReward": 5
        }
      ]
    },
    "vp2ep": {
      "enabled": true,
      "min": 1,
      "rate": 10
    },
    "ep2vp": {
      "enabled": true,
      "min": 1,
      "rate": 10
    },
    "uihelper": {
      "max_topnews": 5,
      "max_toprank": 50,
      "max_rankall": 100
    },
    "classes": {
      "brawler": true,
      "swordsman": true,
      "archer": true,
      "shaman": true,
      "extreme": true,
      "gunner": true,
      "assassin": true,
      "magician": true,
      "shaper": true
    },
    "social": {
      "enabled": true,
      "facebook": "",
      "x": "",
      "youtube": "",
      "twitch": "",
      "steam": ""
    }
  }
}
```

