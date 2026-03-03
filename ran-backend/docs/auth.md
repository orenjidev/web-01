# Auth API Documentation

## Overview

**Base Path:** `/api/auth`  
**Authentication:** None (session created on login)

This module provides authentication endpoints for login, registration, password reset, and logout.

---

## Login

**Endpoint:**  
`POST /api/auth/login`

**Description:**  
Authenticates a user and creates a session.

### Request Body

| Field   | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| userid  | string | yes      | Account username |
| password| string | yes      | Account password |

### Success Response

```json
{
  "ok": true,
  "message": "Login successful",
  "user": {
    "userid": "exampleUser",
    "userNum": 123,
    "type": 1
  }
}
```

### Error Response

```json
{
  "ok": false,
  "message": "<error message>"
}
```

---

## Register

**Endpoint:**  
`POST /api/auth/register`

**Description:**  
Creates a new account.

### Request Body

| Field           | Type   | Required | Description |
| --------------- | ------ | -------- | ----------- |
| userid          | string | yes      | Account username |
| password        | string | yes      | Account password |
| confirmPassword | string | yes      | Confirm password |
| pincode         | string | yes      | Account PIN |
| confirmPincode  | string | yes      | Confirm PIN |
| email           | string | yes      | Account email |

### Success Response

```json
{
  "ok": true,
  "message": "Registration successful"
}
```

---

## Forgot Password

**Endpoint:**  
`POST /api/auth/forgotpass`

**Description:**  
Resets password using PIN confirmation.

### Request Body

| Field              | Type   | Required | Description |
| ------------------ | ------ | -------- | ----------- |
| userid             | string | yes      | Account username |
| pincode            | string | yes      | Account PIN |
| confirmPincode     | string | yes      | Confirm PIN |
| newPassword        | string | yes      | New password |
| confirmNewPassword | string | yes      | Confirm new password |

### Success Response

```json
{
  "ok": true,
  "message": "Password reset successful"
}
```

---

## Logout

**Endpoint:**  
`POST /api/auth/logout`

**Description:**  
Destroys the session, clears the auth cookie, and redirects to the login page.

### Response

- `302` redirect to the configured login URL.

