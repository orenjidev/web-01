# Topup API Documentation

## Overview

**Base Path:** `/api/topup`  
**Authentication:** Session cookie for user and staff routes  
**Availability:** Requires topup feature to be enabled

---

## Check Topup Code

**Endpoint:**  
`GET /api/topup/check?code=XXXX&pin=YYYY`

**Authentication:** Required

**Query Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| code      | string | yes      | Topup code |
| pin       | string | yes      | Topup pin |

**Success Response**

```json
{
  "success": true,
  "value": 100
}
```

---

## Redeem Topup Code

**Endpoint:**  
`POST /api/topup/redeem`

**Authentication:** Required

**Request Body**

| Field | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| code  | string | yes      | Topup code |
| pin   | string | yes      | Topup pin |

**Success Response**

```json
{
  "success": true,
  "message": "TOPUP_SUCCESS"
}
```

---

## Admin: List Topups

**Endpoint:**  
`GET /api/topup/admin/list?used=0`

**Authentication:** Staff only

**Query Parameters**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| used      | number | no       | `0` unused, `1` used |

**Success Response**

```json
{
  "success": true,
  "cards": []
}
```

---

## Admin: Generate Topups

**Endpoint:**  
`POST /api/topup/admin/generate`

**Authentication:** Staff only

**Request Body**

| Field | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| count | number | yes      | Number of codes |
| value | number | yes      | Value per code |

**Success Response**

```json
{
  "success": true,
  "message": "TOPUP_GENERATION_REQUESTED"
}
```

