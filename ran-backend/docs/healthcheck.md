# Healthcheck API Documentation

## Overview

**Base Path:** `/api/healthcheck`  
**Authentication:** None

Lightweight health endpoint for monitoring.

---

## Healthcheck

**Endpoint:**  
`GET /api/healthcheck`

**Success Response**

```json
{
  "status": "ok",
  "uptime": 12345,
  "maintenance": false,
  "timestamp": 1738540800000
}
```

