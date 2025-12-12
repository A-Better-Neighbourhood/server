# Reports API Documentation v2 - GitHub Issue Style

Base URL: `/api/reports`

All routes except `GET /api/reports` require authentication via Bearer token in the Authorization header.

---

## 🎯 Key Changes in V2

**Activity-Based Timeline**: All interactions (comments, status updates, system events) are now unified as activities, displayed in a GitHub issue-style timeline.

**Role-Based System**: Users now have roles (USER, AUTHORITY, ADMIN) instead of a simple boolean flag.

**Comments as Activities**: Comments are no longer separate entities - they're activities with images support.

**Upvote Milestones**: System automatically creates milestone activities when reports reach significant upvote counts (10, 50, 100, 500, 1000).

---

## Table of Contents

- [Reports API Documentation v2 - GitHub Issue Style](#reports-api-documentation-v2---github-issue-style)
  - [🎯 Key Changes in V2](#-key-changes-in-v2)
  - [Table of Contents](#table-of-contents)
  - [Create Report](#create-report)
  - [Get All Reports](#get-all-reports)
  - [Get Report by ID](#get-report-by-id)
  - [Get Report Activities (Timeline)](#get-report-activities-timeline)
  - [Add Comment](#add-comment)
  - [Upvote Report](#upvote-report)
  - [Mark Report as Resolved](#mark-report-as-resolved)
  - [User Role System](#user-role-system)
    - [Roles](#roles)
    - [Role in Responses](#role-in-responses)
  - [Activity Types](#activity-types)
  - [Actor Types](#actor-types)
  - [Frontend Implementation Guide](#frontend-implementation-guide)
    - [Displaying Timeline](#displaying-timeline)
    - [Styling Recommendations](#styling-recommendations)
  - [Migration from V1](#migration-from-v1)
  - [Example: Complete Report Timeline Flow](#example-complete-report-timeline-flow)
  - [Status Codes](#status-codes)

---

## Create Report

Create a new report. The system automatically checks for duplicates within a 5-meter radius with the same category.

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
- `category` (enum, required): `ROAD_ISSUE` | `GARBAGE` | `STREET_LIGHT` | `WATER_LEAK` | `NOISE_COMPLAINT` | `OTHER`

**Success Response (201):**

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
      "createdAt": "2025-12-12T10:30:00.000Z"
    },
    "deduplication": {
      "isDuplicate": false,
      "merged": false
    }
  }
}
```

---

## Get All Reports

Retrieve all non-duplicate reports.

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
      "category": "ROAD_ISSUE",
      "status": "PENDING",
      "duplicateCount": 2,
      "creator": {
        "id": "user123",
        "fullName": "John Doe"
      },
      "createdAt": "2025-12-12T10:30:00.000Z"
    }
  ]
}
```

---

## Get Report by ID

Get detailed information about a specific report.

**Endpoint:** `GET /api/reports/:reportId`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "id": "cm123abc",
    "title": "Pothole on Main Street",
    "description": "Large pothole causing traffic issues",
    "imageUrl": [
      "/uploads/reports/report-1.jpg",
      "/uploads/reports/report-2.jpg"
    ],
    "latitude": 40.7128,
    "longitude": -74.006,
    "category": "ROAD_ISSUE",
    "status": "PENDING",
    "duplicateCount": 2,
    "creator": {
      "id": "user123",
      "fullName": "John Doe",
      "role": "USER"
    },
    "createdAt": "2025-12-12T10:30:00.000Z"
  }
}
```

---

## Get Report Activities (Timeline)

Get the complete activity timeline for a report - includes creation, comments, status updates, and system events. This is displayed like a GitHub issue page.

**Endpoint:** `GET /api/reports/:id/activities`

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Report activities retrieved successfully",
  "data": [
    {
      "id": "act1",
      "type": "REPORT_CREATED",
      "actorType": "SYSTEM",
      "content": "Report \"Pothole on Main Street\" was created",
      "images": [],
      "createdAt": "2025-12-12T10:30:00.000Z",
      "createdBy": {
        "id": "user123",
        "fullName": "John Doe",
        "role": "USER"
      }
    },
    {
      "id": "act2",
      "type": "USER_COMMENTED",
      "actorType": "USER",
      "content": "This pothole is getting worse! Added more photos.",
      "images": ["/uploads/comments/img1.jpg", "/uploads/comments/img2.jpg"],
      "createdAt": "2025-12-12T11:00:00.000Z",
      "createdBy": {
        "id": "user456",
        "fullName": "Jane Smith",
        "role": "USER"
      }
    },
    {
      "id": "act3",
      "type": "UPVOTE_MILESTONE",
      "actorType": "SYSTEM",
      "content": "This report has reached 10 upvotes!",
      "images": [],
      "createdAt": "2025-12-12T12:00:00.000Z",
      "createdBy": null
    },
    {
      "id": "act4",
      "type": "AUTHORITY_COMMENTED",
      "actorType": "AUTHORITY",
      "content": "We have scheduled this for repair next week. Crew will be dispatched on Monday.",
      "images": [],
      "createdAt": "2025-12-12T14:00:00.000Z",
      "createdBy": {
        "id": "auth123",
        "fullName": "City Public Works",
        "role": "AUTHORITY"
      }
    },
    {
      "id": "act5",
      "type": "STATUS_UPDATED",
      "actorType": "AUTHORITY",
      "content": "Status changed from PENDING to IN_PROGRESS",
      "oldStatus": "PENDING",
      "newStatus": "IN_PROGRESS",
      "images": [],
      "createdAt": "2025-12-12T14:01:00.000Z",
      "createdBy": {
        "id": "auth123",
        "fullName": "City Public Works",
        "role": "AUTHORITY"
      }
    },
    {
      "id": "act6",
      "type": "DUPLICATE_MERGED",
      "actorType": "SYSTEM",
      "content": "Duplicate report merged (ID: cm789xyz)",
      "images": [],
      "createdAt": "2025-12-12T15:00:00.000Z",
      "createdBy": null
    },
    {
      "id": "act7",
      "type": "MARKED_RESOLVED",
      "actorType": "AUTHORITY",
      "content": "Report has been marked as resolved by City Public Works",
      "images": [],
      "createdAt": "2025-12-13T09:00:00.000Z",
      "createdBy": {
        "id": "auth123",
        "fullName": "City Public Works",
        "role": "AUTHORITY"
      }
    }
  ]
}
```

**Timeline Display Order:** Oldest first (chronological order) - just like GitHub issues

---

## Add Comment

Add a comment to a report (creates an activity). Supports images like GitHub issues.

**Endpoint:** `POST /api/reports/:id/comments`

**Authentication:** Required

**Request Body:**

```json
{
  "text": "I noticed this issue is getting worse. Here are updated photos.",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}
```

**Fields:**

- `text` (string, required): Comment content
- `images` (array, optional): Array of base64 encoded images

**Success Response (201):**

```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "act123",
    "type": "USER_COMMENTED",
    "actorType": "USER",
    "content": "I noticed this issue is getting worse. Here are updated photos.",
    "images": ["/uploads/comments/img1.jpg", "/uploads/comments/img2.jpg"],
    "reportId": "cm123abc",
    "createdById": "user123",
    "createdAt": "2025-12-12T11:00:00.000Z"
  }
}
```

**Authority Comments:**
If the user has role `AUTHORITY`, the activity type will be `AUTHORITY_COMMENTED` and `actorType` will be `AUTHORITY`.

**Error Responses:**

- `400`: Cannot comment on duplicate report (redirects to original)
- `401`: Unauthorized

---

## Upvote Report

Upvote a report to indicate its importance. System automatically creates milestone activities at 10, 50, 100, 500, and 1000 upvotes.

**Endpoint:** `POST /api/reports/:id/upvote`

**Authentication:** Required

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

**Milestone Creation:**
When a report reaches milestones (10, 50, 100, 500, 1000 upvotes), a system activity is automatically created:

```json
{
  "type": "UPVOTE_MILESTONE",
  "actorType": "SYSTEM",
  "content": "This report has reached 50 upvotes!"
}
```

**Error Responses:**

- `400`: Already upvoted / Cannot upvote duplicate
- `401`: Unauthorized

---

## Mark Report as Resolved

Mark a report as resolved. Creates an activity in the timeline.

**Endpoint:** `PATCH /api/reports/:reportId/resolve`

**Authentication:** Required

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

**Created Activity:**

```json
{
  "type": "MARKED_RESOLVED",
  "actorType": "AUTHORITY" or "USER",
  "content": "Report has been marked as resolved by [User Name]"
}
```

---

## User Role System

### Roles

**USER** (default)

- Regular citizens
- Can create reports
- Can comment and upvote
- Comments appear as `USER_COMMENTED`

**AUTHORITY**

- Municipal authority staff
- Can do everything users can
- Can change report status
- Comments appear as `AUTHORITY_COMMENTED` with special styling
- Status changes create `STATUS_UPDATED` activities

**ADMIN**

- System administrators
- Full access to all operations
- Reserved for future use

### Role in Responses

User role is included in activity responses:

```json
{
  "createdBy": {
    "id": "user123",
    "fullName": "John Doe",
    "role": "USER"
  }
}
```

---

## Activity Types

All activity types and their meanings:

| Type                  | Actor Type     | Description                               | Created By                    |
| --------------------- | -------------- | ----------------------------------------- | ----------------------------- |
| `REPORT_CREATED`      | SYSTEM         | Report was initially created              | System (on behalf of creator) |
| `USER_COMMENTED`      | USER           | Regular user added a comment              | Regular users                 |
| `AUTHORITY_COMMENTED` | AUTHORITY      | Official comment from municipal authority | Authority users               |
| `STATUS_UPDATED`      | AUTHORITY      | Report status changed                     | Authority users               |
| `DUPLICATE_MERGED`    | SYSTEM         | Duplicate report was merged               | Automated system              |
| `MARKED_AS_DUPLICATE` | SYSTEM         | Report marked as duplicate                | Automated system              |
| `MARKED_RESOLVED`     | AUTHORITY/USER | Report marked as resolved                 | Any user                      |
| `UPVOTE_MILESTONE`    | SYSTEM         | Report reached upvote milestone           | Automated system              |

---

## Actor Types

- `USER`: Regular user actions (comments, creating reports)
- `AUTHORITY`: Municipal authority actions (official comments, status updates)
- `SYSTEM`: Automated system actions (deduplication, milestones)

---

## Frontend Implementation Guide

### Displaying Timeline

```jsx
activities.map((activity) => {
  const isComment = activity.type.includes("COMMENTED");
  const isSystemEvent = activity.actorType === "SYSTEM";
  const isAuthority = activity.actorType === "AUTHORITY";

  return (
    <TimelineItem
      key={activity.id}
      icon={getIconForType(activity.type)}
      variant={isAuthority ? "authority" : isSystemEvent ? "system" : "user"}
    >
      {isComment ? (
        <Comment
          author={activity.createdBy}
          content={activity.content}
          images={activity.images}
          timestamp={activity.createdAt}
          isAuthority={isAuthority}
        />
      ) : (
        <SystemEvent
          type={activity.type}
          content={activity.content}
          timestamp={activity.createdAt}
        />
      )}
    </TimelineItem>
  );
});
```

### Styling Recommendations

- **Authority Comments**: Highlight with special border/badge (like GitHub's "Member" badge)
- **System Events**: Gray/subtle styling with icons
- **Milestones**: Celebration styling with special icons
- **Status Changes**: Color-coded based on status

---

## Migration from V1

**Removed Endpoints:**

- ❌ `GET /api/reports/:id/comments` - Use `GET /api/reports/:id/activities` instead

**Breaking Changes:**

- Comments are now activities - update your data models
- User `isAuthority` boolean replaced with `role` enum
- Activity timeline is chronological (oldest first) instead of reverse

**New Features:**

- ✅ Images in comments
- ✅ Upvote milestones
- ✅ Unified activity timeline
- ✅ Role-based system

---

## Example: Complete Report Timeline Flow

1. **User creates report** → `REPORT_CREATED` activity
2. **Another user comments** → `USER_COMMENTED` activity
3. **Report gets 10 upvotes** → `UPVOTE_MILESTONE` activity
4. **Duplicate report merged** → `DUPLICATE_MERGED` activity
5. **Authority comments** → `AUTHORITY_COMMENTED` activity
6. **Authority changes status** → `STATUS_UPDATED` activity
7. **Report gets 50 upvotes** → `UPVOTE_MILESTONE` activity
8. **Authority resolves** → `MARKED_RESOLVED` activity

All these events are visible in one chronological timeline at `GET /api/reports/:id/activities`

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
