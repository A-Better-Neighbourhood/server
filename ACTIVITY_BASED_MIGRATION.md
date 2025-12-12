# Migration to Activity-Based System - Summary

## 🎯 Overview

Successfully restructured the reports system to work like GitHub issues, with a unified activity timeline that includes comments, status updates, and system events.

---

## ✅ Schema Changes

### Added Enums

**UserRole**

```prisma
enum UserRole {
  USER       // Regular citizen
  AUTHORITY  // Municipal authority staff
  ADMIN      // System administrator
}
```

**ActorType**

```prisma
enum ActorType {
  USER       // Regular user actions
  AUTHORITY  // Municipal authority actions
  SYSTEM     // Automated system actions
}
```

**Updated ActivityType**

```prisma
enum ActivityType {
  REPORT_CREATED           // System: Report was created
  USER_COMMENTED          // User: Regular user added a comment
  AUTHORITY_COMMENTED     // Authority: Official comment from municipal authority
  STATUS_UPDATED          // Authority: Report status changed
  DUPLICATE_MERGED        // System: Duplicate report was merged
  MARKED_RESOLVED         // Authority/User: Report marked as resolved
  MARKED_AS_DUPLICATE     // System: Report marked as duplicate
  UPVOTE_MILESTONE        // System: Report reached upvote milestone
}
```

### Updated Models

**User Model**

- ❌ Removed: `isAuthority Boolean`
- ✅ Added: `role UserRole @default(USER)`
- ❌ Removed: `comments Comment[]` relation

**Activity Model**

- ✅ Added: `actorType ActorType @default(USER)`
- ✅ Added: `content String?` (replaces `message`)
- ✅ Added: `images String[] @default([])` (support for comment images)
- ✅ Added: `oldStatus String?` (for status change tracking)
- ✅ Added: `newStatus String?` (for status change tracking)
- ✅ Added: Index on `[reportId, createdAt]` for timeline queries

**Removed Models**

- ❌ **Comment Model** (merged into Activity)

---

## 📝 Service Changes

### ReportsService

**Modified Methods:**

1. **`createReport()`**

   - Now creates `REPORT_CREATED` activity with `SYSTEM` actor type

2. **`markReportAsResolved(userId)`**

   - Added `userId` parameter
   - Determines actor type based on user role
   - Creates `MARKED_RESOLVED` activity with proper actor type

3. **`logActivity()`**

   - Complete rewrite to match new schema
   - Parameters: `reportId`, `type`, `actorType`, `content`, `userId?`, `images?`, `statusChange?`
   - Supports images and status change tracking

4. **`getReportActivities()`**

   - Now includes user `role` in response
   - Returns activities in chronological order (oldest first)
   - Includes all activity types (comments + system events)

5. **`addComment(text, images?)`**

   - Added `images` parameter for image support
   - Creates `USER_COMMENTED` or `AUTHORITY_COMMENTED` activity based on user role
   - Returns activity instead of comment object

6. **`upvoteReport()`**
   - Added milestone tracking
   - Creates `UPVOTE_MILESTONE` activity at 10, 50, 100, 500, 1000 upvotes

**Removed Methods:**

- ❌ `getComments()` - Use `getReportActivities()` instead

### DeduplicationService

**Modified Methods:**

1. **`mergeReports()`**
   - Updated to create activities with new structure:
     - `DUPLICATE_MERGED` with `SYSTEM` actor type
     - `MARKED_AS_DUPLICATE` with `SYSTEM` actor type
   - Uses `content` field instead of `message`
   - Sets `actorType: "SYSTEM"`

---

## 🔌 Controller Changes

### ReportsController

**Modified Endpoints:**

1. **`markReportAsResolved`**

   - Now passes `userId` to service method

2. **`addComment`**
   - Added support for `images` array in request body
   - Returns activity object instead of comment object
   - Better error handling for duplicate reports

**Removed Endpoints:**

- ❌ `getComments` - Comments are now part of activities

---

## 🛣️ Route Changes

### Reports Router

**Removed Routes:**

- ❌ `GET /api/reports/:id/comments`

**Existing Routes (unchanged):**

- ✅ `GET /api/reports/:id/activities` - Now returns comments as activities
- ✅ `POST /api/reports/:id/comments` - Now creates activity instead of comment
- ✅ `POST /api/reports/:id/upvote` - Now tracks milestones

---

## 📊 Data Migration

**Migration Name:** `20251212152706_restructure_to_activity_based_system`

**Changes Applied:**

1. Added `UserRole` enum
2. Added `ActorType` enum
3. Updated `ActivityType` enum
4. Modified `users` table:
   - Added `role` column (default: USER)
   - Removed `isAuthority` column
5. Modified `activities` table:
   - Added `actorType` column
   - Renamed `message` to `content`
   - Added `images` column
   - Added `oldStatus` column
   - Added `newStatus` column
   - Added index on `[reportId, createdAt]`
6. Dropped `comments` table

---

## 🎨 Frontend Impact

### Breaking Changes

1. **Comments Endpoint Removed**

   ```js
   // ❌ Old way
   fetch("/api/reports/123/comments");

   // ✅ New way
   fetch("/api/reports/123/activities")
     .then((res) => res.json())
     .then((data) => {
       const comments = data.filter(
         (a) => a.type === "USER_COMMENTED" || a.type === "AUTHORITY_COMMENTED"
       );
     });
   ```

2. **Activity Data Structure**

   ```js
   // ❌ Old comment structure
   {
     id: "cmt123",
     text: "Comment text",
     user: { fullName: "John" }
   }

   // ✅ New activity structure
   {
     id: "act123",
     type: "USER_COMMENTED",
     actorType: "USER",
     content: "Comment text",
     images: [],
     createdBy: {
       fullName: "John",
       role: "USER"
     }
   }
   ```

3. **Timeline Order**

   ```js
   // ❌ Old: Newest first
   activities.sort((a, b) => b.createdAt - a.createdAt);

   // ✅ New: Oldest first (like GitHub)
   // No sorting needed - API returns in correct order
   ```

### New Features to Implement

1. **Comment Images Display**

   ```jsx
   {
     activity.images.map((img) => <Image key={img} src={img} />);
   }
   ```

2. **Authority Badge**

   ```jsx
   {
     activity.createdBy?.role === "AUTHORITY" && (
       <Badge>Municipal Authority</Badge>
     );
   }
   ```

3. **Milestone Celebrations**

   ```jsx
   {
     activity.type === "UPVOTE_MILESTONE" && (
       <MilestoneCard>
         <CelebrationIcon />
         {activity.content}
       </MilestoneCard>
     );
   }
   ```

4. **Status Change Display**
   ```jsx
   {
     activity.type === "STATUS_UPDATED" && (
       <StatusChange from={activity.oldStatus} to={activity.newStatus} />
     );
   }
   ```

---

## 🧪 Testing Updates Needed

### Updated Test Files

1. **`deduplication.service.test.ts`**

   - ✅ Updated activity expectations to use new structure
   - ✅ Changed `ADDED_DUPLICATE` to `DUPLICATE_MERGED`
   - ✅ Added `actorType` and `content` fields

2. **`report.helper.ts`**
   - Needs update to new ActivityType enum values
   - Should add ActorType type

### New Tests to Add

1. **Role-based comment creation**

   ```typescript
   test("should create AUTHORITY_COMMENTED for authority users");
   test("should create USER_COMMENTED for regular users");
   ```

2. **Upvote milestones**

   ```typescript
   test("should create milestone activity at 10 upvotes");
   test("should create milestone activity at 50 upvotes");
   ```

3. **Activity timeline ordering**
   ```typescript
   test("should return activities in chronological order");
   ```

---

## 📚 Documentation Updates

### Created Files

- ✅ `REPORTS_API_V2_DOCUMENTATION.md` - Complete API documentation with examples
- ✅ `ACTIVITY_BASED_MIGRATION.md` - This summary document

### Updated Files

- ⚠️ `REPORTS_API_DOCUMENTATION.md` - Should be deprecated or updated

---

## 🚀 Deployment Checklist

- [x] Schema updated
- [x] Migration created and tested
- [x] Services updated
- [x] Controllers updated
- [x] Routes updated
- [x] Build passing
- [x] API documentation created
- [ ] Frontend updated
- [ ] Tests updated
- [ ] Old API docs deprecated

---

## 🔄 Rollback Plan

If issues arise:

1. **Database Rollback**

   ```bash
   npx prisma migrate resolve --rolled-back 20251212152706_restructure_to_activity_based_system
   ```

2. **Code Rollback**

   ```bash
   git revert HEAD
   ```

3. **Prisma Regenerate**
   ```bash
   npx prisma generate
   ```

---

## 💡 Future Enhancements

Possible improvements now that we have the activity system:

1. **Reactions**: Add emoji reactions to activities (like GitHub)
2. **Edit History**: Track edits to comments as activities
3. **Mentions**: Support @mentions in comments
4. **Webhooks**: Send webhooks for certain activity types
5. **Email Notifications**: Notify users of new activities on their reports
6. **Activity Filters**: Filter timeline by activity type
7. **Cross-references**: Reference other reports in comments with #ID syntax

---

## 📞 Support

For questions about this migration:

- Check `REPORTS_API_V2_DOCUMENTATION.md` for API details
- Review schema changes in `prisma/schema.prisma`
- See migration SQL in `prisma/migrations/20251212152706_restructure_to_activity_based_system/migration.sql`
