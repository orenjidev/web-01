# Account API Documentation

## Overview

**Base Path:** `/api/account`  
**Authentication:** Session cookie (required for all endpoints)

This module provides endpoints for authenticated user account management, including
password updates, PIN changes, email updates, and retrieving account information.

All requests require a valid authenticated session cookie.

---

## Change Password

**Endpoint:**  
`POST /api/account/change-password`

**Description:**  
Changes the password of the authenticated user.

### Request Body

| Field       | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| oldPassword | string | yes      | Current account password |
| confirmOldPassword | string | yes | Confirm current password |
| pincode | string | yes | Current account PIN |
| confirmPincode | string | yes | Confirm current PIN |
| newPassword | string | yes | New password |
| confirmNewPassword | string | yes | Confirm new password |

### Success Response

```json
{
  "message": "Password changed successfully"
}
```

### Error Cases

- Incorrect old password
- New password does not meet security rules

---

## Change PIN Code

**Endpoint:**  
`POST /api/account/change-pincode`

**Description:**  
Changes the PIN code of the authenticated user.

### Request Body

| Field  | Type   | Required | Description      |
| ------ | ------ | -------- | ---------------- |
| pincode | string | yes | Current PIN code |
| confirmPincode | string | yes | Confirm current PIN |
| newPincode | string | yes | New PIN code |
| confirmNewPincode | string | yes | Confirm new PIN |
| email | string | yes | Account email |
| confirmEmail | string | yes | Confirm account email |

### Success Response

```json
{
  "message": "PIN code updated successfully"
}
```

### Error Cases

- Incorrect old PIN
- Invalid PIN format

---

## Change Email Address

**Endpoint:**  
`POST /api/account/change-email`

**Description:**  
Changes the email address associated with the authenticated account.
Password confirmation is required.

### Request Body

| Field    | Type   | Required | Description       |
| -------- | ------ | -------- | ----------------- |
| email        | string | yes      | New email address |
| confirmEmail | string | yes      | Confirm new email |
| pincode      | string | yes      | Account PIN code  |

### Success Response

```json
{
  "message": "Email updated successfully"
}
```

### Error Cases

- Incorrect password
- Email already in use
- Invalid email format

---

## Get Account Information

**Endpoint:**  
`GET /api/account/me`

**Description:**  
Retrieves information about the authenticated user.

### Success Response

```json
{
  "ok": true,
  "message": "Success",
  "account": {
    "userid": "exampleUser",
    "type": 1,
    "available": 1,
    "blocked": 0,
    "chaRemain": 3,
    "email": "user@example.com"
  }
}
```

---

## Notes

- All endpoints require authentication.
- Responses may include standard HTTP error codes (`400`, `401`, `403`, `500`).
- Field validation errors should be handled client-side before submission.
