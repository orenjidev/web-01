# Shop API Documentation

## Overview

**Base Path:** `/api/shop`  
**Authentication:** Session cookie  
**Availability:** Requires shop feature to be enabled

Provides in-game shop categories, items, and purchase actions.

---

## Get Full Shop

**Endpoint:**  
`GET /api/shop`

**Description:**  
Returns the full shop data including categories and items.

---

## Get Categories

**Endpoint:**  
`GET /api/shop/categories`

**Description:**  
Returns all shop categories.

---

## Get Items by Category

**Endpoint:**  
`GET /api/shop/items?category=1`

**Query Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| category  | number | yes      | Category id |

---

## Purchase Item

**Endpoint:**  
`POST /api/shop/purchase`

**Request Body**

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| productNum | number | yes      | Shop product identifier |

**Success Response**

```json
{
  "success": true,
  "message": "PURCHASE_SUCCESS"
}
```

**Error Response**

```json
{
  "error": "<error message>"
}
```

