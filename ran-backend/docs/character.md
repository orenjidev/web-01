# Character API Documentation

## Overview

**Base Path:** `/api/character`  
**Authentication:** Session cookie for protected routes

---

## Get Rankings

**Endpoint:**  
`GET /api/character/rankings`

**Description:**  
Returns character rankings.

**Query Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| quantity  | number | no       | Max results (default 100, max 500) |
| ctg       | string | no       | Class filter (e.g. brawler, assassin) |

---

## Get My Characters

**Endpoint:**  
`GET /api/character/my-character`

**Authentication:** Required

---

## Change School

**Endpoint:**  
`POST /api/character/change-school`

**Authentication:** Required

**Request Body**

| Field       | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| characterId | number | yes      | Character id |
| school      | number | yes      | Target school id |

---

## Reset Stats

**Endpoint:**  
`POST /api/character/reset-stats`

**Authentication:** Required

**Request Body**

| Field       | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| characterId | number | yes      | Character id |

---

## Reborn

**Endpoint:**  
`POST /api/character/reborn`

**Authentication:** Required

**Request Body**

| Field | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| char  | number | yes      | Character id |

---

## Delete Character

**Endpoint:**  
`POST /api/character/delete`

**Authentication:** Required

**Request Body**

| Field       | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| characterId | number | yes      | Character id |

