# Debug API Documentation

## Overview

**Base Path:** `/api/debug`  
**Authentication:** None

Debug utilities intended for development use.

---

## Session Debug

**Endpoint:**  
`GET /api/debug/session`

**Description:**  
Returns session and cookie presence info.

**Success Response**

```json
{
  "hasCookie": true,
  "sessionID": "session-id",
  "user": {
    "userid": "exampleUser",
    "userNum": 123,
    "type": 1
  }
}
```

