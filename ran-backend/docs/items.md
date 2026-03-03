# Items API Documentation

## Overview

**Base Path:** `/api/getshop`  
**Authentication:** None

Read-only, cacheable item data.

---

## Get Item By Id

**Endpoint:**  
`GET /api/getshop/items/:mid/:sid`

**Description:**  
Returns a single item by main/sub id.

### Path Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| mid       | number | Item main id |
| sid       | number | Item sub id |

### Success Response

```json
{
  "itemId": "2-5",
  "name": "Item Name"
}
```

### Error Responses

```json
{
  "error": "INVALID_ITEM_ID",
  "mid": "x",
  "sid": "y"
}
```

```json
{
  "error": "ITEM_NOT_FOUND",
  "itemId": "2-5"
}
```

