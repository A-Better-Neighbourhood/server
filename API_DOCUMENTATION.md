<!-- @format -->

# ABN Server API Documentation

## Base URL

```
http://localhost:3080/api
```

## Authentication

This API uses JWT (JSON Web Token) based authentication. For protected routes, include the token in the request:

- **Cookie**: `token=<jwt_token>` (set automatically on sign in)
- **Header**: `Authorization: Bearer <jwt_token>`

---

# Response Format

All API responses follow a standardized format:

## Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation successful",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

## Error Response

```json
{
  "success": false,
  "error": "Error description",
  "data": {
    /* optional error details */
  },
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

# Authentication Endpoints

## 1. Sign Up

Create a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**

```json
{
  "phoneNumber": "1234567890",
  "password": "password123",
  "name": "John Doe",
  "address": "123 Main Street, City"
}
```

**Schema Validation:**

- `phoneNumber`: String, exactly 10 characters
- `password`: String, minimum 6 characters
- `name`: String, minimum 1 character (required)
- `address`: String, minimum 1 character (required)

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "contactNo": "1234567890",
      "fullName": "John Doe",
      "address": "123 Main Street, City"
    }
  },
  "message": "Account created successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Error Responses:**

- `400`: Validation error or user already exists
- `500`: Server error

---

## 2. Sign In

Authenticate user and get access token.

**Endpoint:** `POST /auth/signin`

**Request Body:**

```json
{
  "phoneNumber": "1234567890",
  "password": "password123"
}
```

**Schema Validation:**

- `phoneNumber`: String, exactly 10 characters
- `password`: String (required)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "contactNo": "1234567890",
    "fullName": "John Doe",
    "address": "123 Main Street, City"
  },
  "message": "Sign in successful",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Notes:**

- JWT token is automatically set as an HTTP-only cookie
- Cookie expires in 7 days

**Error Responses:**

- `400`: Validation error
- `401`: Invalid credentials
- `500`: Server error

---

## 3. Get Profile

Get current user profile information.

**Endpoint:** `GET /auth/profile`
**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "contactNo": "1234567890",
    "fullName": "John Doe",
    "address": "123 Main Street, City",
    "createdAt": "2025-09-24T10:00:00.000Z"
  },
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized (no token or invalid token)
- `404`: User not found
- `500`: Server error

---

# Issues Endpoints

## 1. Get All Issues

Retrieve all issues in the system.

**Endpoint:** `GET /issues/`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "issue_123",
      "title": "Broken streetlight",
      "upvotes": 123,
      "description": "Street light is not working on Main St",
      "imageUrl": "https://example.com/image.jpg",
      "latitude": 40.7128,
      "longitude": -74.006,
      "status": "PENDING",
      "createdAt": "2025-09-24T10:00:00.000Z",
      "creatorId": "user_123",
      "creator": {
        "id": "user_123",
        "fullName": "John Doe",
        "contactNo": "1234567890"
      }
    }
  ],
  "message": "Issues retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

## 2. Get Issue by ID

Retrieve a specific issue by its ID.

**Endpoint:** `GET /issues/:issueId`

**Path Parameters:**

- `issueId`: String (required) - The unique identifier of the issue

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "issue_123",
    "title": "Broken streetlight",
    "description": "Street light is not working on Main St",
    "imageUrl": "https://example.com/image.jpg",
    "latitude": 40.7128,
    "longitude": -74.006,
    "status": "PENDING",
    "createdAt": "2025-09-24T10:00:00.000Z",
    "creatorId": "user_123",
    "creator": {
      "id": "user_123",
      "fullName": "John Doe",
      "contactNo": "1234567890"
    }
  },
  "message": "Issue retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Error Responses:**

- `404`: Issue not found
- `500`: Server error

---

## 3. Create Issue

Create a new issue report.

**Endpoint:** `POST /issues/`
**Authentication:** Required

**Request Body:**

```json
{
  "title": "Broken streetlight",
  "description": "The street light on Main St is not working",
  "image": "https://example.com/image.jpg",
  "location": [40.7128, -74.006]
}
```

**Schema Validation:**

- `title`: String, minimum 1 character (required)
- `description`: String, minimum 1 character (required)
- `image`: String, minimum 1 character (required) - Image URL or base64
- `location`: Array of exactly 2 numbers [latitude, longitude] (required)

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "issue_123",
    "title": "Broken streetlight",
    "description": "The street light on Main St is not working",
    "imageUrl": "https://example.com/image.jpg",
    "latitude": 40.7128,
    "longitude": -74.006,
    "status": "PENDING",
    "createdAt": "2025-09-24T12:00:00.000Z",
    "creatorId": "user_123"
  },
  "message": "Issue created successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `400`: Validation error
- `500`: Server error

---

## 4. Get User Issues

Get all issues created by the current user.

**Endpoint:** `GET /issues/user`
**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "issue_123",
      "title": "Broken streetlight",
      "upvotes": 123,
      "description": "Street light is not working",
      "imageUrl": "https://example.com/image.jpg",
      "latitude": 40.7128,
      "longitude": -74.006,
      "status": "PENDING",
      "createdAt": "2025-09-24T10:00:00.000Z",
      "creatorId": "user_123"
    }
  ],
  "message": "User issues retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

## 5. Get Unresolved Issues

Get all issues with status "PENDING" or "IN_PROGRESS".

**Endpoint:** `GET /issues/unresolved`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "issue_123",
      "title": "Broken streetlight",
      "upvotes": 123,
      "status": "PENDING",
      "createdAt": "2025-09-24T10:00:00.000Z"
      // ... other issue fields
    }
  ],
  "message": "Unresolved issues retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

## 6. Get User Resolved Issues

Get all resolved issues created by the current user.

**Endpoint:** `GET /issues/user/resolved`
**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "issue_123",
      "title": "Fixed streetlight",
      "status": "RESOLVED",
      "createdAt": "2025-09-24T10:00:00.000Z"
      // ... other issue fields
    }
  ],
  "message": "User resolved issues retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

## 7. Get User Unresolved Issues

Get all unresolved issues created by the current user.

**Endpoint:** `GET /issues/user/unresolved`
**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "issue_123",
      "title": "Broken streetlight",
      "upvotes": 123,
      "status": "PENDING",
      "createdAt": "2025-09-24T10:00:00.000Z"
      // ... other issue fields
    }
  ],
  "message": "User unresolved issues retrieved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

---

## 8. Mark Issue as Resolved

Mark a specific issue as resolved.

**Endpoint:** `PATCH /issues/:issueId/resolve`
**Authentication:** Required

**Path Parameters:**

- `issueId`: String (required) - The unique identifier of the issue

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "issue_123",
    "title": "Fixed streetlight",
    "status": "RESOLVED",
    "updatedAt": "2025-09-24T12:00:00.000Z"
    // ... other issue fields
  },
  "message": "Issue marked as resolved successfully",
  "timestamp": "2025-09-24T12:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `404`: Issue not found
- `500`: Server error

---

## 9. Update Issue

Update an existing issue (endpoint exists but not implemented).

**Endpoint:** `PATCH /issues/:issueId`
**Authentication:** Required
**Status:** Not implemented

---

# Data Models

## User Model

```typescript
{
  id: string; // Unique identifier
  fullName: string; // User's full name
  address: string; // User's address
  password: string; // Hashed password (not returned in responses)
  contactNo: string; // Phone number (unique)
  createdAt: Date; // Account creation timestamp
}
```

## Issue Model

```typescript
{
  id: string;           // Unique identifier
  title: string;        // Issue title
  description?: string; // Issue description (optional)
  imageUrl: string;     // Image URL
  latitude: number;     // GPS latitude coordinate
  longitude: number;    // GPS longitude coordinate
  status: IssueStatus;  // Current status
  createdAt: Date;      // Issue creation timestamp
  creatorId: string;    // ID of user who created the issue
  creator?: User;       // User object (included in some responses)
}
```

## Issue Status Enum

```typescript
enum IssueStatus {
  RESOLVED = "RESOLVED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
}
```

---

# Error Codes

| Status Code | Description                            |
| ----------- | -------------------------------------- |
| 200         | Success                                |
| 201         | Created successfully                   |
| 400         | Bad request / Validation error         |
| 401         | Unauthorized / Authentication required |
| 403         | Forbidden                              |
| 404         | Resource not found                     |
| 429         | Rate limit exceeded                    |
| 500         | Internal server error                  |

---

# Health Check

## Health Status

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

# Notes for Frontend Integration

## Authentication Flow

1. User signs up → Receives JWT token in response + HTTP-only cookie
2. User signs in → JWT token automatically set as cookie
3. For subsequent requests → Token sent automatically via cookie
4. Optional: Extract token from response and send in Authorization header

## Image Handling

- Images should be uploaded to a file storage service
- Send the image URL in the `image` field when creating issues
- Alternatively, send base64 encoded image data

## Location Data

- Location should be sent as `[latitude, longitude]` array
- Both values must be numbers
- Coordinates can be `[0, 0]` if location is unavailable

## Response Parsing

All responses include:

- `success`: Boolean indicating if request was successful
- `data`: The actual response data (on success)
- `error`: Error message (on failure)
- `message`: Human-readable message
- `timestamp`: ISO timestamp of the response
