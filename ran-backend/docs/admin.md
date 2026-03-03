# Admin API Documentation

## Overview

**Base Path:** `/api/admin`  
**Authentication:** Session cookie  
**Authorization:** Staff access required

This module provides administrative endpoints used by staff members to manage
downloads, news posts, and in-game shop data such as categories and items.

All requests must include a valid `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

- `POST /api/admin/download`
- `POST /api/admin/news`
- `POST /api/admin/edit-download`
- `POST /api/admin/edit-news`
- `POST /api/admin/shop/category`
- `PUT /api/admin/shop/category/:categoryNum`
- `POST /api/admin/shop/item`
- `PUT /api/admin/shop/item/:productNum`

---

## Request Body Summary (Required Fields)

- `POST /api/admin/download`: `title`, `downloadLink`
- `POST /api/admin/news`: `type`, `title`, `longDescriptionBase64`
- `POST /api/admin/edit-download`: `id`
- `POST /api/admin/edit-news`: `id`
- `POST /api/admin/shop/category`: `categoryNum`, `name`
- `PUT /api/admin/shop/category/:categoryNum`: none
- `POST /api/admin/shop/item`: `itemMain`, `itemSub`, `itemName`, `itemCategory`, `itemMoney`, `shopType`
- `PUT /api/admin/shop/item/:productNum`: none

---

## Create Download Entry

**Endpoint:**  
`POST /api/admin/download`

**Description:**  
Creates a new downloadable entry (e.g. client, patch, resource).

### Access

- Staff only

### Request Body

| Field             | Type    | Required | Description                                   |
| ----------------- | ------- | -------- | --------------------------------------------- |
| title             | string  | yes      | Download title                                |
| descriptionBase64 | string  | no       | Base64-encoded description                    |
| downloadLink      | string  | yes      | Download URL                                  |
| downloadType      | string  | no       | Download category (default: `other`)          |
| visible           | number  | no       | `1` visible, `0` hidden (default: `1`)        |

### Success Response

```json
{
  "ok": true,
  "id": 123,
  "message": "Download entry created successfully"
}
```

### Error Responses

```json
{
  "ok": false,
  "message": "<error message>"
}
```

---

## Create News Entry

**Endpoint:**  
`POST /api/admin/news`

**Description:**  
Creates a new news post.

### Access

- Staff only

### Request Body

| Field                 | Type    | Required | Description                                          |
| --------------------- | ------- | -------- | ---------------------------------------------------- |
| type                  | string  | yes      | News type/category                                   |
| title                 | string  | yes      | News title                                           |
| author                | string  | no       | Author display name                                  |
| bannerImg             | string  | no       | Banner image URL                                     |
| bannerImg2            | string  | no       | Secondary banner image URL                           |
| shortDescription      | string  | no       | Short summary                                        |
| longDescriptionBase64 | string  | yes      | Base64-encoded content                               |
| isPinned              | number  | no       | `1` pinned, `0` not pinned (default: `0`)            |
| pinPriority           | number  | no       | Pin priority (default: `0`)                          |
| visible               | number  | no       | `1` visible, `0` hidden (default: `1`)               |

### Success Response

```json
{
  "ok": true,
  "id": 123,
  "message": "News entry created successfully"
}
```

### Error Responses

```json
{
  "ok": false,
  "message": "<error message>"
}
```

---

## Update Download Entry

**Endpoint:**  
`POST /api/admin/edit-download`

**Description:**  
Updates an existing download entry.

### Access

- Staff only

### Request Body

| Field             | Type   | Required | Description                        |
| ----------------- | ------ | -------- | ---------------------------------- |
| id                | number | yes      | Download ID                        |
| title             | string | no       | Download title                     |
| descriptionBase64 | string | no       | Base64-encoded description         |
| downloadLink      | string | no       | Download URL                       |
| downloadType      | string | no       | Download category                  |
| visible           | number | no       | `1` visible, `0` hidden            |

### Success Response

```json
{
  "ok": true,
  "message": "Download entry updated successfully"
}
```

### Error Responses

```json
{
  "ok": false,
  "message": "<error message>"
}
```

---

## Update News Entry

**Endpoint:**  
`POST /api/admin/edit-news`

**Description:**  
Updates an existing news post.

### Access

- Staff only

### Request Body

| Field                 | Type   | Required | Description                               |
| --------------------- | ------ | -------- | ----------------------------------------- |
| id                    | number | yes      | News ID                                   |
| type                  | string | no       | News type/category                        |
| title                 | string | no       | News title                                |
| author                | string | no       | Author display name                       |
| bannerImg             | string | no       | Banner image URL                          |
| bannerImg2            | string | no       | Secondary banner image URL                |
| shortDescription      | string | no       | Short summary                             |
| longDescriptionBase64 | string | no       | Base64-encoded content                    |
| isPinned              | number | no       | `1` pinned, `0` not pinned                |
| pinPriority           | number | no       | Pin priority                              |
| visible               | number | no       | `1` visible, `0` hidden                   |

### Success Response

```json
{
  "ok": true,
  "message": "News entry updated successfully"
}
```

### Error Responses

```json
{
  "ok": false,
  "message": "<error message>"
}
```

---

## Create Shop Category

**Endpoint:**  
`POST /api/admin/shop/category`

**Description:**  
Creates a new shop category.

### Access

- Staff only

### Request Body

| Field       | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| categoryNum | number | yes      | Shop category identifier |
| name        | string | yes      | Category name            |

### Success Response

```json
{
  "success": true
}
```

### Error Responses

```json
{
  "error": "<error message>"
}
```

---

## Update Shop Category

**Endpoint:**  
`PUT /api/admin/shop/category/:categoryNum`

**Description:**  
Updates an existing shop category.

### Path Parameters

| Parameter   | Type   | Description              |
| ----------- | ------ | ------------------------ |
| categoryNum | number | Shop category identifier |

### Access

- Staff only

### Request Body

| Field   | Type    | Required | Description               |
| ------- | ------- | -------- | ------------------------- |
| name    | string  | no       | Category name             |
| enabled | boolean | no       | `true` enabled, `false` disabled |

### Success Response

```json
{
  "success": true
}
```

### Error Responses

```json
{
  "error": "<error message>"
}
```

---

## Create Shop Item

**Endpoint:**  
`POST /api/admin/shop/item`

**Description:**  
Creates a new shop item mapping.

### Access

- Staff only

### Request Body

| Field        | Type   | Required | Description                      |
| ------------ | ------ | -------- | -------------------------------- |
| itemMain     | number | yes      | Item main ID                     |
| itemSub      | number | yes      | Item sub ID                      |
| itemName     | string | yes      | Item display name                |
| itemCategory | number | yes      | Shop category identifier         |
| itemStock    | number | no       | Stock amount (default: `0`)      |
| itemMoney    | number | yes      | Price                            |
| shopType     | number | yes      | Shop type identifier             |

### Success Response

```json
{
  "success": true,
  "productNum": 456
}
```

### Error Responses

```json
{
  "error": "<error message>"
}
```

---

## Update Shop Item

**Endpoint:**  
`PUT /api/admin/shop/item/:productNum`

**Description:**  
Updates an existing shop item mapping.

### Path Parameters

| Parameter  | Type   | Description             |
| ---------- | ------ | ----------------------- |
| productNum | number | Shop product identifier |

### Access

- Staff only

### Request Body

| Field        | Type   | Required | Description              |
| ------------ | ------ | -------- | ------------------------ |
| itemMain     | number | no       | Item main ID             |
| itemSub      | number | no       | Item sub ID              |
| itemName     | string | no       | Item display name        |
| itemCategory | number | no       | Shop category identifier |
| itemStock    | number | no       | Stock amount             |
| itemMoney    | number | no       | Price                    |
| shopType     | number | no       | Shop type identifier     |

### Success Response

```json
{
  "success": true
}
```

### Error Responses

```json
{
  "error": "<error message>"
}
```

---

## Notes

- All endpoints require authenticated staff access.
- Authorization failures return `401` or `403`.
- Validation errors return `400`.
- Internal errors return `500`.
