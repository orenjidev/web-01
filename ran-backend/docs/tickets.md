# Tickets API Documentation

## Overview

**Base Path:** `/api/tickets`  
**Authentication:** Session cookie for user and staff routes  
**Availability:** Requires ticket system feature to be enabled

---

## Public Routes

### Get Ticket Categories

**Endpoint:**  
`GET /api/tickets/categories`

**Description:**  
Returns active ticket categories.

**Success Response**

```json
{
  "ok": true,
  "categories": [
    {
      "CategoryID": 1,
      "CategoryName": "Billing",
      "Description": "Payments and topups"
    }
  ]
}
```

---

## User Routes (Authenticated)

### Create Ticket

**Endpoint:**  
`POST /api/tickets/create`

**Request Body**

| Field         | Type   | Required | Description |
| ------------- | ------ | -------- | ----------- |
| categoryId    | number | yes      | Ticket category id |
| subject       | string | yes      | Subject (5-200 chars) |
| description   | string | yes      | Description (10-5000 chars) |
| priority      | string | no       | Low, Medium, High, Critical |
| characterName | string | no       | Character name |
| gameId        | number | no       | Game id |

**Success Response**

```json
{
  "ok": true,
  "message": "Ticket #123 created successfully",
  "ticket": {
    "ticketId": 123,
    "subject": "Issue subject",
    "status": "Open",
    "createdAt": "2026-02-03T00:00:00.000Z"
  }
}
```

---

### Get My Tickets

**Endpoint:**  
`GET /api/tickets/my-tickets?status=Open&categoryId=1`

**Query Parameters**

| Parameter  | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| status     | string | no       | Filter by status |
| categoryId | number | no       | Filter by category id |

---

### Get Ticket Details

**Endpoint:**  
`GET /api/tickets/:ticketId`

---

### Add Ticket Reply

**Endpoint:**  
`POST /api/tickets/:ticketId/reply`

**Request Body**

| Field   | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| message | string | yes      | Reply message (5-5000 chars) |

**Success Response**

```json
{
  "ok": true,
  "message": "Reply added successfully",
  "reply": {
    "ReplyID": 1,
    "Message": "Message",
    "CreatedAt": "2026-02-03T00:00:00.000Z",
    "IsStaffReply": false
  }
}
```

---

## Staff Routes (UserType >= 50)

### Get All Tickets

**Endpoint:**  
`GET /api/tickets/staff/all?status=Open&categoryId=1&assignedToMe=true&priority=High`

**Query Parameters**

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| status       | string | no       | Filter by status |
| categoryId   | number | no       | Filter by category id |
| assignedToMe | boolean | no      | Only tickets assigned to current staff |
| priority     | string | no       | Filter by priority |

---

### Get Staff List

**Endpoint:**  
`GET /api/tickets/staff/list`

---

### Get Ticket Details (Staff)

**Endpoint:**  
`GET /api/tickets/staff/:ticketId`

---

### Update Ticket Status

**Endpoint:**  
`PUT /api/tickets/staff/:ticketId/status`

**Request Body**

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| status | string | yes      | Open, In Progress, Waiting for User, Waiting for Developer, Resolved, Closed |

---

### Assign Ticket to Staff

**Endpoint:**  
`PUT /api/tickets/staff/:ticketId/assign`

**Request Body**

| Field        | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| staffUserNum | number | yes      | Staff user id |

---

### Add Staff Reply

**Endpoint:**  
`POST /api/tickets/staff/:ticketId/reply`

**Request Body**

| Field      | Type    | Required | Description |
| ---------- | ------- | -------- | ----------- |
| message    | string  | yes      | Reply message (5-5000 chars) |
| isInternal | boolean | no       | Internal note (not visible to user) |

