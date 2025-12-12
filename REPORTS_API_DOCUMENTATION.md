# Reports API Documentation

Base URL: `/api/reports`

All routes except `GET /api/reports` require authentication via Bearer token in the Authorization header.

---

## Table of Contents

- [Reports API Documentation](#reports-api-documentation)
  - [Table of Contents](#table-of-contents)
  - [Create Report](#create-report)
  - [Get All Reports](#get-all-reports)
  - [Get Report by ID](#get-report-by-id)
  - [Get User Reports](#get-user-reports)
  - [Get User Resolved Reports](#get-user-resolved-reports)
  - [Get User Unresolved Reports](#get-user-unresolved-reports)
  - [Get All Unresolved Reports](#get-all-unresolved-reports)
  - [Get Nearby Reports](#get-nearby-reports)
  - [Mark Report as Resolved](#mark-report-as-resolved)
  - [Get Report Activities](#get-report-activities)
  - [Add Comment](#add-comment)
  - [Get Comments](#get-comments)
  - [Upvote Report](#upvote-report)
  - [Status Codes](#status-codes)
  - [Report Categories](#report-categories)
  - [Report Status](#report-status)
  - [Deduplication System](#deduplication-system)
  - [Authentication](#authentication)
  - [Error Response Format](#error-response-format)

---

## Create Report

Create a new report. The system automatically checks for duplicates within a 5-meter radius with the same category. If a duplicate is found, the report is merged with the original.

**Endpoint:** `POST /api/reports`

**Authentication:** Required

**Request Body:**

```json
{
  "title": "Pothole on Main Street",
  "description": "Large pothole causing traffic issues",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "location": [40.7128, -74.006],
  "category": "ROAD_ISSUE"
}
```

**Fields:**

- `title` (string, required): Report title (3-200 characters)
- `description` (string, required): Detailed description (10-1000 characters)
- `image` (string, required): Base64 encoded image with data URI prefix
- `location` (array, required): [latitude, longitude] coordinates
- `category` (enum, required): One of:
  - `ROAD_ISSUE`
  - `GARBAGE`
  - `STREET_LIGHT`
  - `WATER_LEAK`
  - `NOISE_COMPLAINT`
  - `OTHER`

**Success Response (201 - Unique Report):**

```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "report": {
      "id": "cm123abc",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing traffic issues",
      "imageUrl": ["/uploads/reports/report-1234567890.jpg"],
      "latitude": 40.7128,
      "longitude": -74.006,
      "category": "ROAD_ISSUE",
      "status": "PENDING",
      "isDuplicate": false,
      "creatorId": "user123",
      "createdAt": "2025-12-12T10:30:00.000Z",
      "updatedAt": "2025-12-12T10:30:00.000Z"
    },
    "deduplication": {
      "isDuplicate": false,
      "merged": false
    }
  }
}
```

**Success Response (201 - Duplicate Report):**

```json
{
  "success": true,
  "message": "Report created and merged with existing duplicate",
  "data": {
    "report": {
      "id": "cm456def",
      "title": "Original Report Title",
      "duplicateCount": 2,
      "imageUrl": [
        "/uploads/reports/original.jpg",
        "/uploads/reports/duplicate.jpg"
      ],
      ...
    },
    "deduplication": {
      "isDuplicate": true,
      "originalReport": {
        "id": "cm456def",
        "title": "Original Report Title",
        ...
      },
      "merged": true
    }
  }
}
```

**Error Responses:**

- `400`: Validation error (invalid category, missing fields, etc.)
- `401`: Unauthorized (missing or invalid token)
- `500`: Server error

---

## Get All Reports

Retrieve all non-duplicate reports, ordered by creation date (newest first).

**Endpoint:** `GET /api/reports`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": [
    {
      "id": "cm123abc",
      "title": "Pothole on Main Street",
      "description": "Large pothole causing traffic issues",
      "imageUrl": ["/uploads/reports/report-1234567890.jpg"],
      "latitude": 40.7128,
      "longitude": -74.006,
      "category": "ROAD_ISSUE",
      "status": "PENDING",
      "isDuplicate": false,
      "duplicateCount": 0,
      "creatorId": "user123",
      "creator": {
        "id": "user123",
        "fullName": "John Doe"
      },
      "createdAt": "2025-12-12T10:30:00.000Z",
      "updatedAt": "2025-12-12T10:30:00.000Z"
    }
  ]
}
```

---

## Get Report by ID

Get detailed information about a specific report, including the original report if it's a duplicate.

**Endpoint:** `GET /api/reports/:reportId`

**Authentication:** Required

**Parameters:**

- `reportId` (path): Report ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "id": "cm123abc",
    "title": "Pothole on Main Street",
    "description": "Large pothole causing traffic issues",
    "imageUrl": ["/uploads/reports/report-1234567890.jpg"],
    "latitude": 40.7128,
    "longitude": -74.006,
    "category": "ROAD_ISSUE",
    "status": "PENDING",
    "isDuplicate": false,
    "duplicateCount": 2,
    "originalReportId": null,
    "creator": {
      "id": "user123",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "originalReport": null,
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `404`: Report not found
- `401`: Unauthorized

---

## Get User Reports

Get all non-duplicate reports created by the authenticated user.

**Endpoint:** `GET /api/reports/user`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "User reports retrieved successfully",
  "data": [
    {
      "id": "cm123abc",
      "title": "Pothole on Main Street",
      ...
    }
  ]
}
```

---

## Get User Resolved Reports

Get all resolved reports created by the authenticated user.

**Endpoint:** `GET /api/reports/user/resolved`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "User resolved reports retrieved successfully",
  "data": [...]
}
```

---

## Get User Unresolved Reports

Get all unresolved (PENDING or IN_PROGRESS) reports created by the authenticated user.

**Endpoint:** `GET /api/reports/user/unresolved`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "User unresolved reports retrieved successfully",
  "data": [...]
}
```

---

## Get All Unresolved Reports

Get all unresolved (PENDING status) reports from all users.

**Endpoint:** `GET /api/reports/unresolved`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Unresolved reports retrieved successfully",
  "data": [...]
}
```

---

## Get Nearby Reports

Find reports within a specified radius of a location using PostGIS spatial queries. Only returns non-duplicate, unresolved reports.

**Endpoint:** `GET /api/reports/nearby`

**Authentication:** Required

**Query Parameters:**

- `lat` (number, required): Latitude (-90 to 90)
- `lng` (number, required): Longitude (-180 to 180)
- `radius` (number, optional): Search radius in kilometers (0.1 to 100, default: 5)

**Example:** `GET /api/reports/nearby?lat=40.7128&lng=-74.0060&radius=2`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Found 3 reports within 2km",
  "data": {
    "reports": [
      {
        "id": "cm123abc",
        "title": "Pothole on Main Street",
        "description": "Large pothole causing traffic issues",
        "latitude": 40.7130,
        "longitude": -74.0058,
        "distance": 0.23,
        "creator": {
          "id": "user123",
          "fullName": "John Doe"
        },
        ...
      }
    ],
    "metadata": {
      "location": {
        "latitude": 40.7128,
        "longitude": -74.006
      },
      "radiusKm": 2,
      "count": 3
    }
  }
}
```

**Error Responses:**

- `400`: Invalid query parameters
- `401`: Unauthorized

---

## Mark Report as Resolved

Mark a report as resolved.

**Endpoint:** `PATCH /api/reports/:reportId/resolve`

**Authentication:** Required

**Parameters:**

- `reportId` (path): Report ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report marked as resolved successfully",
  "data": {
    "id": "cm123abc",
    "status": "RESOLVED",
    ...
  }
}
```

**Error Responses:**

- `404`: Report not found
- `401`: Unauthorized

---

## Get Report Activities

Get the activity log for a report (creation, comments, status updates, duplicates merged, etc.).

**Endpoint:** `GET /api/reports/:id/activities`

**Authentication:** Required

**Parameters:**

- `id` (path): Report ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report activities retrieved successfully",
  "data": [
    {
      "id": "act123",
      "reportId": "cm123abc",
      "type": "CREATED",
      "message": "Report \"Pothole on Main Street\" was created",
      "createdById": "user123",
      "createdBy": {
        "id": "user123",
        "fullName": "John Doe"
      },
      "createdAt": "2025-12-12T10:30:00.000Z"
    },
    {
      "id": "act124",
      "type": "COMMENT_ADDED",
      "message": "New comment added",
      "createdById": "user456",
      "createdBy": {
        "id": "user456",
        "fullName": "Jane Smith"
      },
      "createdAt": "2025-12-12T11:00:00.000Z"
    },
    {
      "id": "act125",
      "type": "ADDED_DUPLICATE",
      "message": "Duplicate report merged from user789",
      "createdById": null,
      "createdBy": null,
      "createdAt": "2025-12-12T12:00:00.000Z"
    }
  ]
}
```

**Activity Types:**

- `CREATED`: Report was created
- `COMMENT_ADDED`: Comment was added
- `AUTHORITY_COMMENTED`: Authority added a comment
- `STATUS_UPDATED`: Report status changed
- `ADDED_DUPLICATE`: Duplicate report was merged
- `MARKED_RESOLVED`: Report was marked as resolved
- `MARKED_AS_DUPLICATE`: Report was marked as duplicate

**Error Responses:**

- `404`: Report not found
- `401`: Unauthorized

---

## Add Comment

Add a comment to a report. Cannot comment on duplicate reports.

**Endpoint:** `POST /api/reports/:id/comments`

**Authentication:** Required

**Parameters:**

- `id` (path): Report ID

**Request Body:**

```json
{
  "text": "This issue has been getting worse"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "cmt123",
    "reportId": "cm123abc",
    "userId": "user123",
    "text": "This issue has been getting worse",
    "createdAt": "2025-12-12T10:30:00.000Z",
    "updatedAt": "2025-12-12T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Missing or empty comment text / Report is a duplicate
- `401`: Unauthorized
- `500`: Server error

**Note:** If the report is a duplicate, the error message will include the original report ID:

```json
{
  "success": false,
  "message": "Cannot comment on duplicate report. Please comment on the original report: cm456def"
}
```

---

## Get Comments

Get all comments for a report.

**Endpoint:** `GET /api/reports/:id/comments`

**Authentication:** Required

**Parameters:**

- `id` (path): Report ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": "cmt123",
      "reportId": "cm123abc",
      "userId": "user123",
      "text": "This issue has been getting worse",
      "user": {
        "id": "user123",
        "fullName": "John Doe"
      },
      "createdAt": "2025-12-12T10:30:00.000Z",
      "updatedAt": "2025-12-12T10:30:00.000Z"
    }
  ]
}
```

---

## Upvote Report

Upvote a report to indicate its importance. Each user can only upvote a report once. Cannot upvote duplicate reports.

**Endpoint:** `POST /api/reports/:id/upvote`

**Authentication:** Required

**Parameters:**

- `id` (path): Report ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report upvoted successfully",
  "data": {
    "id": "upv123",
    "reportId": "cm123abc",
    "userId": "user123",
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Already upvoted / Report is a duplicate
- `401`: Unauthorized
- `500`: Server error

**Note:** If the report is a duplicate, the error message will include the original report ID:

```json
{
  "success": false,
  "message": "Cannot upvote duplicate report. Please upvote the original report: cm456def"
}
```

If the user already upvoted:

```json
{
  "success": false,
  "message": "You have already upvoted this report"
}
```

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error, duplicate action, etc.)
- `401`: Unauthorized (missing or invalid auth token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Report Categories

All reports must have one of these categories:

- `ROAD_ISSUE`: Potholes, road damage, traffic issues
- `GARBAGE`: Waste management, littering, overflowing bins
- `STREET_LIGHT`: Broken or malfunctioning street lights
- `WATER_LEAK`: Water pipe leaks, flooding
- `NOISE_COMPLAINT`: Excessive noise disturbances
- `OTHER`: Other civic issues

---

## Report Status

- `PENDING`: Initial status when created
- `IN_PROGRESS`: Being worked on by authorities
- `RESOLVED`: Issue has been fixed
- `ARCHIVED`: Duplicate reports are automatically archived

---

## Deduplication System

The system automatically detects duplicate reports using:

- **Geographic proximity**: Within 5 meters of an existing report
- **Same category**: Must be the same issue type
- **Only non-duplicates**: Only checks against original reports, not other duplicates

When a duplicate is detected:

1. The new report is created with `isDuplicate: true` and `status: ARCHIVED`
2. It's merged with the original report
3. Images from the duplicate are added to the original
4. Upvotes are transferred to the original
5. Activities are logged on both reports
6. The response includes deduplication information with the original report

**Important:** Duplicate reports cannot receive comments or upvotes. Users will be redirected to interact with the original report instead.

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

You can obtain a token from the `/api/auth/login` endpoint.

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```
