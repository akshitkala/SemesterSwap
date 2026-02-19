**SEMESTER SWAP**

Build Roadmap --- Version 2.0

Phased Development Plan with Test Prompts

8 Phases · Security Checkpoints · AI Test Prompts after each phase

This document breaks the Semester Swap V2 build into 8 sequential
phases. Each phase contains a clear task list, dependencies, and a
ready-to-use AI testing prompt you can paste directly into an AI
assistant (Claude, GPT-4, etc.) to validate your implementation before
moving to the next phase.

The hard rule: do not begin a phase until the testing prompt for the
previous phase returns all-pass results.

**Roadmap Overview**

  ----------- ------------------ -------------------------------------------
  **Phase**   **Title**          **Goal**

  Phase 0     Paper Alignment    Resolve all conflicts in docs before
                                 touching code

  Phase 1     Auth + RBAC        Google Sign-In, middleware stack, role
                                 enforcement, ban gate

  Phase 2     DB Migration       Rename fields, seed SystemConfig, verify
                                 clean state

  Phase 3     Book CRUD +        All book routes, approval mode middleware,
              Approval           ownership checks

  Phase 4     Admin Layer        Moderation, stats, user viewer, audit
                                 logging

  Phase 5     Super Admin Layer  Governance, ban enforcement, approval
                                 toggle, audit viewer

  Phase 6     Search & Filters   Full search endpoint with all filter
                                 params + compound index

  Phase 7     Frontend + Launch  All dashboards, E2E test, Vercel + Render
                                 deploy
  ----------- ------------------ -------------------------------------------

+-----------------------------------------------------------------------+
| **PHASE 0** · No code. Resolve everything on paper first.             |
|                                                                       |
| **Paper Alignment**                                                   |
+-----------------------------------------------------------------------+

**Objective**

Ensure the PRD, TRD, and this roadmap are fully consistent before a
single line of code is written or changed. Every conflict identified in
the V2 review session must be locked in here.

**Tasks**

-   Confirm auth method locked: Google Sign-In via Firebase
    (firebaseUid + email + displayName).

-   Confirm Book model field names: bookName, seller --- not title or
    sellerId.

-   Confirm AdminActivity model has actorType: \'user\' \| \'system\'
    and nullable actor field.

-   Confirm ban endpoint PUT /api/super-admin/users/:id/toggle-status is
    in TRD.

-   Write the V1 → V2 MongoDB migration script (no execution yet ---
    just written and reviewed).

-   Verify zero field name conflicts exist between PRD and TRD.

**Exit Criteria**

-   PRD and TRD are 100% consistent with each other.

-   Migration script is written, reviewed, and ready to run.

-   No ambiguity remains in role permissions or model schemas.

**Phase 0 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 0 tasks:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 0 ALIGNMENT CHECK                       |
|                                                                       |
| I have finished Phase 0 (Paper Alignment) of my Semester Swap V2      |
| build.                                                                |
|                                                                       |
| Please review the following decisions and flag any remaining          |
| inconsistencies,                                                      |
|                                                                       |
| missing fields, or logical gaps before I write any code.              |
|                                                                       |
| \# AUTH METHOD                                                        |
|                                                                       |
| → Google Sign-In via Firebase Auth                                    |
|                                                                       |
| → User model stores: firebaseUid (unique, indexed), email,            |
| displayName, role, isActive, createdAt                                |
|                                                                       |
| → firebaseUid is NEVER returned in any API response                   |
|                                                                       |
| \# BOOK MODEL (V2 fields)                                             |
|                                                                       |
| → bookName (was: title), seller ref to User (was: sellerId)           |
|                                                                       |
| → New fields: subject (String), condition (Enum: new\|good\|used)     |
|                                                                       |
| → Existing: price, images\[\], sellerContact, status                  |
| (pending\|approved\|rejected), isDeleted, createdAt                   |
|                                                                       |
| \# ADMIN ACTIVITY MODEL                                               |
|                                                                       |
| → actor: ObjectId \| null (null when actorType is system)             |
|                                                                       |
| → actorType: Enum (user \| system)                                    |
|                                                                       |
| → target: ObjectId, targetModel: Enum (User \| Book)                  |
|                                                                       |
| → action: String, metadata: Object, timestamp: Date                   |
|                                                                       |
| \# SYSTEM CONFIG MODEL (singleton)                                    |
|                                                                       |
| → approvalMode: Enum (manual \| automatic), default: manual           |
|                                                                       |
| → updatedBy: ObjectId ref User, updatedAt: Date                       |
|                                                                       |
| \# ROLE HIERARCHY                                                     |
|                                                                       |
| → user \< admin \< super_admin                                        |
|                                                                       |
| → Admin CANNOT promote/demote/ban --- 403 if attempted                |
|                                                                       |
| → Super Admin can: promote, demote, ban/unban, toggle approval mode,  |
| view audit logs                                                       |
|                                                                       |
| \# BAN ENFORCEMENT                                                    |
|                                                                       |
| → Layer 1: Firebase Admin SDK revokeRefreshTokens(firebaseUid) ---    |
| immediate                                                             |
|                                                                       |
| → Layer 2: isActive checked on every request in Auth Middleware ---   |
| 403 if false                                                          |
|                                                                       |
| Please confirm all of this is internally consistent, identify any     |
| gaps,                                                                 |
|                                                                       |
| and confirm I am ready to begin Phase 1.                              |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 1** · The security skeleton. Everything else depends on this. |
|                                                                       |
| **Auth + RBAC Foundation**                                            |
+-----------------------------------------------------------------------+

**Objective**

Build and harden the authentication and role-based access control layer.
This phase produces no visible features to end users, but it is the most
critical phase --- every route, every permission, and every security
guarantee in the system depends on this working correctly.

**Dependencies**

-   Phase 0 complete --- all conflicts resolved, models confirmed.

-   Firebase project created, Google Sign-In enabled in Firebase
    console.

-   Firebase Admin SDK credentials available as environment variables.

-   MongoDB Atlas cluster live with users collection seeded (or empty).

**Tasks**

**1.1 --- Firebase Admin SDK Setup**

-   Install firebase-admin package.

-   Initialise Firebase Admin SDK using service account credentials from
    environment.

-   Write a verifyFirebaseToken(token) utility that calls
    admin.auth().verifyIdToken(token).

**1.2 --- Auth Middleware**

-   Extract Bearer token from Authorization header --- return 401 if
    absent.

-   Call verifyFirebaseToken(token) --- return 401 if verification
    fails.

-   Query MongoDB Users collection by { firebaseUid: decodedToken.uid }.

-   If user not found → auto-create with { role: \'user\', isActive:
    true, email, displayName }.

-   Read isActive from the fetched/created user --- return 403 if false.

-   Attach full user document to req.user and call next().

**1.3 --- Role Middleware**

-   Export a factory: roleMiddleware(requiredRole) → returns an Express
    middleware.

-   Inside middleware: compare req.user.role against requiredRole using
    hierarchy map.

-   Hierarchy: { user: 1, admin: 2, super_admin: 3 }.

-   If req.user.role level \< requiredRole level → return 403 Forbidden.

-   For Super Admin routes: check for exact match (role must equal
    super_admin).

**1.4 --- Wire to Routes**

-   Apply \[authMiddleware, roleMiddleware(\'user\')\] to all
    authenticated user routes.

-   Apply \[authMiddleware, roleMiddleware(\'admin\')\] to all
    /api/admin routes.

-   Apply \[authMiddleware, roleMiddleware(\'super_admin\')\] to all
    /api/super-admin routes.

-   Leave GET /api/books and GET /api/books/:id as public (no
    middleware).

**1.5 --- POST /api/auth/login**

-   Accept Firebase ID token in request body or Authorization header.

-   Run through Auth Middleware flow --- return user object (excluding
    firebaseUid).

-   Return: { \_id, email, displayName, role, isActive, createdAt }.

**Security Checkpoint**

  ------- ------------------------------------------ ------------------------
          **Test**                                   **Expected Result**

  **✓**   Send request to GET /api/admin/stats with  Returns 403 Forbidden
          a valid User token                         

  **✓**   Send request to GET /api/super-admin/stats Returns 403 Forbidden
          with a valid Admin token                   

  **✓**   Send request to POST /api/auth/login with  Returns 401 Unauthorized
          no token                                   

  **✓**   Send request with an expired/invalid       Returns 401 Unauthorized
          Firebase token                             

  **✓**   Set a test user\'s isActive to false in    Returns 403 Forbidden
          DB, then send a valid token                

  **✓**   Send valid User token to GET /api/books    Returns 200 --- no auth
          (public route)                             required

  **✓**   First login with a new Google account ---  New user doc created:
          check DB                                   role:\'user\',
                                                     isActive:true
  ------- ------------------------------------------ ------------------------

**Phase 1 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 1:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 1 TEST: AUTH + RBAC                     |
|                                                                       |
| I have built the Auth Middleware and Role Middleware for my           |
| Express.js backend.                                                   |
|                                                                       |
| Here is my implementation. Please review it for security              |
| vulnerabilities,                                                      |
|                                                                       |
| logic errors, and missing edge cases.                                 |
|                                                                       |
| \# AUTH MIDDLEWARE (paste your authMiddleware.js here)                |
|                                                                       |
| → \[PASTE YOUR authMiddleware.js CODE HERE\]                          |
|                                                                       |
| \# ROLE MIDDLEWARE (paste your roleMiddleware.js here)                |
|                                                                       |
| → \[PASTE YOUR roleMiddleware.js CODE HERE\]                          |
|                                                                       |
| \# USER MODEL (paste your User mongoose schema here)                  |
|                                                                       |
| → \[PASTE YOUR User.js SCHEMA HERE\]                                  |
|                                                                       |
| \# CHECK THE FOLLOWING SPECIFIC THINGS:                               |
|                                                                       |
| ! 1. Does the middleware correctly return 401 for missing/invalid     |
| tokens?                                                               |
|                                                                       |
| ! 2. Does it return 403 (not 401) for banned users (isActive: false)? |
|                                                                       |
| ! 3. Is firebaseUid excluded from the user object returned to the     |
| frontend?                                                             |
|                                                                       |
| ! 4. Does the role hierarchy correctly block user tokens from admin   |
| routes?                                                               |
|                                                                       |
| ! 5. Does the super_admin check use exact match (not just \>=)?       |
|                                                                       |
| ! 6. Are there any async/await errors that could crash the            |
| middleware?                                                           |
|                                                                       |
| ! 7. Is there a race condition where a banned user could slip         |
| through?                                                              |
|                                                                       |
| Please list every issue found and provide corrected code for each.    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 2** · Clean the foundation before building on it.             |
|                                                                       |
| **Database Migration**                                                |
+-----------------------------------------------------------------------+

**Objective**

Run the V1 → V2 migration on the Books collection to rename fields and
add new ones. Seed the SystemConfig singleton. Verify the database is in
a clean V2 state before any new backend code touches it.

**Dependencies**

-   Phase 1 complete and security checkpoint passed.

-   MongoDB Atlas connection confirmed with write access.

-   Migration script from Phase 0 reviewed and ready.

**Tasks**

**2.1 --- Books Collection Migration**

-   Run migration: rename title → bookName on all existing documents.

-   Run migration: rename sellerId → seller on all existing documents.

-   Add condition: null to all documents missing the field.

-   Add subject: null to all documents missing the field.

-   Add isDeleted: false to all documents missing the field.

Migration script:

> db.books.updateMany({}, \[
>
> { \$set: {
>
> bookName: { \$ifNull: \[\'\$title\', \'\$bookName\'\] },
>
> seller: { \$ifNull: \[\'\$sellerId\', \'\$seller\'\] },
>
> condition: { \$ifNull: \[\'\$condition\', null\] },
>
> subject: { \$ifNull: \[\'\$subject\', null\] },
>
> isDeleted: { \$ifNull: \[\'\$isDeleted\', false\] }
>
> }},
>
> { \$unset: \[\'title\', \'sellerId\'\] }
>
> \])

**2.2 --- Seed SystemConfig Singleton**

-   Insert one document into the systemconfig collection:

> { approvalMode: \'manual\', updatedBy: null, updatedAt: new Date() }

-   Verify only one document exists in this collection --- it must
    always remain a singleton.

**2.3 --- Verify Clean State**

-   Run: db.books.findOne({ title: { \$exists: true } }) --- must return
    null.

-   Run: db.books.findOne({ sellerId: { \$exists: true } }) --- must
    return null.

-   Run: db.systemconfig.countDocuments() --- must return 1.

-   Run: db.books.findOne({ isDeleted: { \$exists: false } }) --- must
    return null.

**Exit Criteria**

  ------- ------------------------------------------ ------------------------
          **Test**                                   **Expected Result**

  **✓**   db.books.findOne({ title: { \$exists: true Returns null
          } })                                       

  **✓**   db.books.findOne({ sellerId: { \$exists:   Returns null
          true } })                                  

  **✓**   db.systemconfig.countDocuments()           Returns 1

  **✓**   db.books.findOne({ isDeleted: { \$exists:  Returns null
          false } })                                 

  **✓**   Sample book document has bookName field    Correct --- no title
                                                     field present
  ------- ------------------------------------------ ------------------------

**Phase 2 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 2:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 2 TEST: DATABASE MIGRATION              |
|                                                                       |
| I have run the V1 → V2 database migration on my Semester Swap MongoDB |
| instance.                                                             |
|                                                                       |
| Here are the results of my verification queries. Please confirm the   |
| migration                                                             |
|                                                                       |
| is complete and the database is in a valid V2 state.                  |
|                                                                       |
| \# VERIFICATION RESULTS                                               |
|                                                                       |
| → db.books.findOne({ title: { \$exists: true } }) = \[PASTE RESULT\]  |
|                                                                       |
| → db.books.findOne({ sellerId: { \$exists: true } }) = \[PASTE        |
| RESULT\]                                                              |
|                                                                       |
| → db.books.findOne({ isDeleted: { \$exists: false } }) = \[PASTE      |
| RESULT\]                                                              |
|                                                                       |
| → db.systemconfig.countDocuments() = \[PASTE RESULT\]                 |
|                                                                       |
| → db.systemconfig.findOne() = \[PASTE RESULT\]                        |
|                                                                       |
| \# SAMPLE BOOK DOCUMENT                                               |
|                                                                       |
| → \[PASTE ONE SAMPLE db.books.findOne() RESULT HERE\]                 |
|                                                                       |
| \# CHECK THE FOLLOWING:                                               |
|                                                                       |
| ! 1. Are all V1 field names (title, sellerId) fully removed?          |
|                                                                       |
| ! 2. Does every book document have: bookName, seller, condition,      |
| subject, isDeleted?                                                   |
|                                                                       |
| ! 3. Is the SystemConfig singleton correct with approvalMode:         |
| \'manual\'?                                                           |
|                                                                       |
| ! 4. Are there any documents in an inconsistent state?                |
|                                                                       |
| ! 5. Is there anything in the schema that could cause issues in Phase |
| 3?                                                                    |
|                                                                       |
| Confirm migration is clean or list exactly what still needs to be     |
| fixed.                                                                |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 3** · User-facing book operations on the clean V2 model.      |
|                                                                       |
| **Book CRUD + Approval Mode**                                         |
+-----------------------------------------------------------------------+

**Objective**

Build all user-facing book routes on top of the migrated V2 model. Wire
in the Approval Mode Middleware so that POST /api/books respects the
SystemConfig toggle. Enforce ownership on PUT and DELETE.

**Dependencies**

-   Phase 1 --- Auth + Role middleware working and tested.

-   Phase 2 --- Books collection migrated, SystemConfig seeded.

**Tasks**

**3.1 --- Book Routes**

-   GET /api/books --- return all { status: \'approved\', isDeleted:
    false } documents.

-   GET /api/books/:id --- return one document; 404 if not found or
    isDeleted.

-   POST /api/books --- protected (User+); run Approval Mode Middleware
    before saving.

-   PUT /api/books/:id --- protected (Owner only); check req.user.\_id
    === listing.seller.

    -   If current status is \'approved\' → reset to \'pending\' before
        saving.

    -   Return 403 if requester is not the owner.

-   DELETE /api/books/:id --- protected (Owner only); set isDeleted:
    true, do NOT remove document.

**3.2 --- Approval Mode Middleware**

-   Read SystemConfig.approvalMode from MongoDB on every POST /api/books
    request.

-   If \'manual\' → set listing.status = \'pending\'. No audit log
    needed.

-   If \'automatic\' → set listing.status = \'approved\', then write
    AdminActivity:

    -   action: \'AUTO_APPROVE_LISTING\'

    -   actorType: \'system\'

    -   actor: null

    -   target: listing.\_id, targetModel: \'Book\'

**3.3 --- Input Validation**

-   Validate POST /api/books body: bookName required string, price
    positive number, condition in \[\'new\',\'good\',\'used\'\], images
    array length 1--3.

-   Validate PUT /api/books/:id body: same schema, all fields optional
    for partial update.

-   Return 400 Bad Request with descriptive error message on validation
    failure.

**Security Checkpoint**

  ------- ------------------------------------------ ------------------------
          **Test**                                   **Expected Result**

  **✓**   POST /api/books with valid User token,     Listing created with
          manual mode                                status: \'pending\'

  **✓**   POST /api/books with valid User token,     Listing created with
          automatic mode                             status: \'approved\',
                                                     audit log entry written

  **✓**   PUT /api/books/:id where requester is NOT  Returns 403 Forbidden
          the owner                                  

  **✓**   PUT /api/books/:id on an approved listing  Status resets to
          (as owner)                                 \'pending\'

  **✓**   DELETE /api/books/:id as owner             isDeleted: true, listing
                                                     hidden from GET
                                                     /api/books

  **✓**   GET /api/books --- deleted listing not in  Correct ---
          results                                    isDeleted:true excluded

  **✓**   POST /api/books with missing bookName      Returns 400 Bad Request

  **✓**   Auto-approve audit log entry               actor: null, actorType:
                                                     \'system\' in
                                                     AdminActivity
  ------- ------------------------------------------ ------------------------

**Phase 3 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 3:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 3 TEST: BOOK CRUD + APPROVAL MODE       |
|                                                                       |
| I have built the book CRUD routes and Approval Mode Middleware.       |
|                                                                       |
| Please review the following code and test scenarios.                  |
|                                                                       |
| \# BOOK ROUTER (paste your books.js route file)                       |
|                                                                       |
| → \[PASTE YOUR books.js ROUTER HERE\]                                 |
|                                                                       |
| \# APPROVAL MODE MIDDLEWARE (paste approvalMode.js)                   |
|                                                                       |
| → \[PASTE YOUR approvalModeMiddleware.js HERE\]                       |
|                                                                       |
| \# BOOK MONGOOSE SCHEMA (paste Book.js)                               |
|                                                                       |
| → \[PASTE YOUR Book.js SCHEMA HERE\]                                  |
|                                                                       |
| \# CHECK THE FOLLOWING:                                               |
|                                                                       |
| ! 1. Can a user edit or delete a listing they do not own? Should      |
| return 403.                                                           |
|                                                                       |
| ! 2. Does editing an approved listing correctly reset status to       |
| pending?                                                              |
|                                                                       |
| ! 3. Does the soft delete set isDeleted:true WITHOUT removing the     |
| document?                                                             |
|                                                                       |
| ! 4. Does GET /api/books exclude isDeleted:true AND                   |
| status!=\'approved\' listings?                                        |
|                                                                       |
| ! 5. Does automatic mode write the audit log with actor:null +        |
| actorType:\'system\'?                                                 |
|                                                                       |
| ! 6. Are there any N+1 query problems in the approval mode            |
| middleware?                                                           |
|                                                                       |
| ! 7. What happens if SystemConfig document is missing --- does the    |
| app crash?                                                            |
|                                                                       |
| ! 8. Is there a missing await or async error that could silently      |
| fail?                                                                 |
|                                                                       |
| List all issues with corrected code.                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 4** · Moderation tooling on top of the stable book layer.     |
|                                                                       |
| **Admin Layer**                                                       |
+-----------------------------------------------------------------------+

**Objective**

Build the full Admin Dashboard API layer. Every action an Admin takes
that modifies data must be logged to AdminActivity. The Admin role must
be strictly gated --- Admins cannot touch user roles or bans.

**Dependencies**

-   Phase 3 complete and security checkpoint passed.

-   AdminActivity model exists in MongoDB.

**Tasks**

**4.1 --- Stats Endpoint**

-   GET /api/admin/stats --- protected (Admin+).

-   Return: { totalUsers, totalListings, pendingListings,
    approvedListings, rejectedListings }.

-   Use MongoDB aggregation or parallel countDocuments calls.

**4.2 --- Moderation Endpoints**

-   GET /api/admin/books/pending --- return all { status: \'pending\',
    isDeleted: false }.

-   PUT /api/admin/books/:id/approve --- set status: \'approved\', log
    LISTING_APPROVED.

-   PUT /api/admin/books/:id/reject --- set status: \'rejected\', log
    LISTING_REJECTED.

-   DELETE /api/admin/books/:id --- remove listing (or set isDeleted:
    true), log LISTING_DELETED.

For every admin moderation action, write to AdminActivity:

-   actor: req.user.\_id, actorType: \'user\'

-   target: listing.\_id, targetModel: \'Book\'

-   action: \'LISTING_APPROVED\' \| \'LISTING_REJECTED\' \|
    \'LISTING_DELETED\'

**4.3 --- User Viewer**

-   GET /api/admin/users --- list all users; exclude firebaseUid from
    response.

-   GET /api/admin/users/:id --- return one user profile; exclude
    firebaseUid.

-   Both routes are read-only --- no mutation allowed from these
    endpoints.

-   Project fields explicitly: { \_id:1, email:1, displayName:1, role:1,
    isActive:1, createdAt:1 }.

**Security Checkpoint**

  ------- ------------------------------------------ ------------------------
          **Test**                                   **Expected Result**

  **✓**   Admin token on PUT                         Returns 200, status
          /api/admin/books/:id/approve               updated, audit log
                                                     written

  **✓**   User token on PUT                          Returns 403 Forbidden
          /api/admin/books/:id/approve               

  **✓**   GET /api/admin/users response --- check    firebaseUid must NOT be
          for firebaseUid field                      present

  **✓**   Admin token on PUT                         Returns 403 Forbidden
          /api/super-admin/users/:id/promote         

  **✓**   GET /api/admin/stats returns correct       Counts match actual DB
          counts                                     document counts

  **✓**   Every approve/reject/delete action         Creates an AdminActivity
                                                     document in DB

  **✓**   AdminActivity entry: actor field           Equals the Admin\'s
                                                     \_id, actorType:
                                                     \'user\'
  ------- ------------------------------------------ ------------------------

**Phase 4 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 4:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 4 TEST: ADMIN LAYER                     |
|                                                                       |
| I have built the Admin Dashboard API layer. Please review the         |
| following.                                                            |
|                                                                       |
| \# ADMIN ROUTER (paste your admin.js route file)                      |
|                                                                       |
| → \[PASTE YOUR admin.js ROUTER HERE\]                                 |
|                                                                       |
| \# ADMIN ACTIVITY MODEL (paste AdminActivity.js schema)               |
|                                                                       |
| → \[PASTE YOUR AdminActivity.js SCHEMA HERE\]                         |
|                                                                       |
| \# SAMPLE AUDIT LOG ENTRY from your DB after an approve action:       |
|                                                                       |
| → \[PASTE A db.adminactivities.findOne() RESULT HERE\]                |
|                                                                       |
| \# CHECK THE FOLLOWING:                                               |
|                                                                       |
| ! 1. Is firebaseUid excluded from ALL user responses in admin routes? |
|                                                                       |
| ! 2. Does every moderation action (approve/reject/delete) write to    |
| AdminActivity?                                                        |
|                                                                       |
| ! 3. Can an Admin reach any /api/super-admin route? Should return     |
| 403.                                                                  |
|                                                                       |
| ! 4. Is the audit log entry structure correct: actor, actorType,      |
| target, targetModel, action?                                          |
|                                                                       |
| ! 5. What happens if an Admin tries to approve an already-approved    |
| listing?                                                              |
|                                                                       |
| ! 6. What happens if an Admin tries to approve a listing that does    |
| not exist? Should 404.                                                |
|                                                                       |
| ! 7. Are the stats counts accurate --- do they use the right MongoDB  |
| query filters?                                                        |
|                                                                       |
| ! 8. Is there any route that inadvertently exposes all book data      |
| including deleted ones?                                               |
|                                                                       |
| List all issues with corrected code.                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 5** · Full governance, ban enforcement, approval toggle.      |
|                                                                       |
| **Super Admin Layer**                                                 |
+-----------------------------------------------------------------------+

**Objective**

Build the Super Admin governance layer. This is the most sensitive phase
--- incorrect implementation here can allow privilege escalation or
unrevoked access for banned users. Build Phase 4 security checkpoint
must pass before starting this phase.

**Dependencies**

-   Phase 4 complete and security checkpoint passed.

-   Firebase Admin SDK set up (from Phase 1).

-   SystemConfig singleton seeded (from Phase 2).

**Tasks**

**5.1 --- Role Management**

-   PUT /api/super-admin/users/:id/promote --- set role: \'admin\', log
    USER_PROMOTED.

    -   metadata: { oldRole: \'user\', newRole: \'admin\' }

-   PUT /api/super-admin/users/:id/demote --- set role: \'user\', log
    USER_DEMOTED.

    -   metadata: { oldRole: \'admin\', newRole: \'user\' }

-   Prevent Super Admin from demoting themselves.

-   Return 400 if trying to promote an already-Admin user or demote a
    non-Admin.

**5.2 --- Ban / Unban (Two-Layer)**

-   PUT /api/super-admin/users/:id/toggle-status

-   Step 1 --- Database: flip user.isActive (true → false or false →
    true).

-   Step 2 --- Firebase: call
    admin.auth().revokeRefreshTokens(user.firebaseUid).

    -   This invalidates the user\'s current session token at the
        Firebase level immediately.

-   Log action to AdminActivity: USER_BANNED or USER_UNBANNED.

-   Return the updated user object (excluding firebaseUid).

-   Handle Firebase SDK errors gracefully --- if revocation fails, still
    update isActive and log the failure.

**5.3 --- Approval Mode Toggle**

-   PUT /api/super-admin/config/approval-mode

-   Read current SystemConfig.approvalMode.

-   Flip value: \'manual\' → \'automatic\' or \'automatic\' →
    \'manual\'.

-   Update SystemConfig: { approvalMode: newMode, updatedBy:
    req.user.\_id, updatedAt: now }.

-   Log APPROVAL_MODE_CHANGED to AdminActivity with metadata: { oldMode,
    newMode }.

-   Return the updated SystemConfig document.

**5.4 --- Audit Log Viewer**

-   GET /api/super-admin/activity

-   Paginated --- accept page and limit query params, default page=1,
    limit=20.

-   Filter params: action (string match), actorType
    (\'user\'\|\'system\'), actor (ObjectId), dateFrom, dateTo.

-   Populate actor field with displayName and email (if actor is not
    null).

-   Sort by timestamp descending (most recent first).

**5.5 --- Advanced Stats**

-   GET /api/super-admin/stats

-   Include all Admin stats plus: adminCount, bannedUserCount,
    autoApprovedCount, manualApprovedCount, currentApprovalMode.

**Security Checkpoint**

  ------- ------------------------------------------ ------------------------
          **Test**                                   **Expected Result**

  **✓**   Admin token on PUT                         Returns 403 Forbidden
          /api/super-admin/users/:id/promote         

  **✓**   Ban a user, then send their                Returns 403 Forbidden
          previously-valid token                     immediately

  **✓**   Check DB after ban                         isActive: false in Users
                                                     collection

  **✓**   Toggle approval mode to \'automatic\',     Listing status:
          create a listing                           \'approved\', audit log:
                                                     AUTO_APPROVE_LISTING

  **✓**   Toggle approval mode back to \'manual\',   Listing status:
          create a listing                           \'pending\'

  **✓**   APPROVAL_MODE_CHANGED audit log entry      metadata has oldMode and
                                                     newMode fields

  **✓**   Unban a user, resend their token (after    Returns 200 --- access
          Firebase re-auth)                          restored

  **✓**   Super Admin demoting themselves            Returns 400 Bad Request
  ------- ------------------------------------------ ------------------------

**Phase 5 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 5:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 5 TEST: SUPER ADMIN LAYER               |
|                                                                       |
| I have built the Super Admin layer including ban enforcement and      |
| approval toggle.                                                      |
|                                                                       |
| This is the most security-critical phase. Please do a thorough        |
| review.                                                               |
|                                                                       |
| \# SUPER ADMIN ROUTER (paste your superAdmin.js route file)           |
|                                                                       |
| → \[PASTE YOUR superAdmin.js ROUTER HERE\]                            |
|                                                                       |
| \# TOGGLE STATUS HANDLER (paste the ban/unban function specifically)  |
|                                                                       |
| → \[PASTE YOUR toggleUserStatus HANDLER HERE\]                        |
|                                                                       |
| \# APPROVAL MODE TOGGLE HANDLER                                       |
|                                                                       |
| → \[PASTE YOUR toggleApprovalMode HANDLER HERE\]                      |
|                                                                       |
| \# CHECK THE FOLLOWING:                                               |
|                                                                       |
| ! 1. Does the ban call BOTH revokeRefreshTokens AND set               |
| isActive:false?                                                       |
|                                                                       |
| ! 2. What happens if Firebase token revocation throws an error? Does  |
| it crash?                                                             |
|                                                                       |
| ! 3. Can a Super Admin demote themselves? Should return 400.          |
|                                                                       |
| ! 4. Can a Super Admin promote someone who is already an Admin?       |
| Should return 400.                                                    |
|                                                                       |
| ! 5. Is the approval mode change logged with oldMode AND newMode in   |
| metadata?                                                             |
|                                                                       |
| ! 6. Is there any privilege escalation path --- can an Admin call     |
| Super Admin routes?                                                   |
|                                                                       |
| ! 7. Is firebaseUid exposed in any Super Admin API response?          |
|                                                                       |
| ! 8. Does the audit log viewer correctly handle actor:null (system)   |
| entries without crashing on populate?                                 |
|                                                                       |
| ! 9. Is there a race condition where two Super Admins toggling at the |
| same time could corrupt SystemConfig?                                 |
|                                                                       |
| This phase gates everything else. List every issue found.             |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 6** · Purely additive. Zero conflict risk if Phases 1--5 are  |
| solid.                                                                |
|                                                                       |
| **Search & Filters**                                                  |
+-----------------------------------------------------------------------+

**Objective**

Build the GET /api/books/search endpoint with full filter and sort
support. Add a compound MongoDB index for query performance. This phase
is purely additive --- it adds a new endpoint and touches no existing
logic.

**Dependencies**

-   Phase 3 complete --- Books collection is clean V2 with all fields
    present.

**Tasks**

**6.1 --- Search Endpoint**

-   GET /api/books/search --- public, no auth required.

-   Always apply base filters: { status: \'approved\', isDeleted: false
    }.

-   q param → case-insensitive regex match on bookName: { \$regex: q,
    \$options: \'i\' }.

-   condition param → exact enum match.

-   minPrice param → { price: { \$gte: Number(minPrice) } }.

-   maxPrice param → { price: { \$lte: Number(maxPrice) } }.

-   subject param → case-insensitive regex match on subject.

-   sort param: \'newest\' → { createdAt: -1 }, \'price_asc\' → { price:
    1 }, \'price_desc\' → { price: -1 }.

-   Default sort: newest if no sort param provided.

**6.2 --- Compound Index**

Add to your Book model or run via MongoDB Atlas:

> books.createIndex({
>
> status: 1, isDeleted: 1, bookName: 1,
>
> subject: 1, condition: 1, price: 1
>
> })

**6.3 --- Input Sanitisation**

-   Validate minPrice and maxPrice are numbers if provided --- return
    400 if not.

-   Validate condition is one of \[\'new\', \'good\', \'used\'\] if
    provided.

-   Validate sort is one of \[\'newest\', \'price_asc\',
    \'price_desc\'\] if provided.

**Exit Criteria**

  ------- -------------------------------------------- ------------------------
          **Test**                                     **Expected Result**

  **✓**   GET /api/books/search?q=maths                Returns approved
                                                       listings matching
                                                       \'maths\' in bookName

  **✓**   GET /api/books/search?condition=new          Returns only listings
                                                       with condition:\'new\'

  **✓**   GET                                          Returns listings within
          /api/books/search?minPrice=50&maxPrice=200   price range

  **✓**   GET /api/books/search?sort=price_asc         Results sorted by price
                                                       low to high

  **✓**   GET /api/books/search --- with no params     Returns all approved,
                                                       non-deleted listings

  **✓**   GET /api/books/search --- pending listing    Correct --- status
          not in results                               filter applied

  **✓**   GET /api/books/search?condition=invalid      Returns 400 Bad Request
  ------- -------------------------------------------- ------------------------

**Phase 6 --- Test Prompt**

Paste this prompt into an AI assistant after completing Phase 6:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 6 TEST: SEARCH & FILTERS                |
|                                                                       |
| I have built the search endpoint for Semester Swap. Please review the |
| code                                                                  |
|                                                                       |
| and test the query logic.                                             |
|                                                                       |
| \# SEARCH ROUTE HANDLER (paste your search handler)                   |
|                                                                       |
| → \[PASTE YOUR search handler code HERE\]                             |
|                                                                       |
| \# CHECK THE FOLLOWING:                                               |
|                                                                       |
| ! 1. Does every search always include { status:\'approved\',          |
| isDeleted:false }?                                                    |
|                                                                       |
| ! 2. Is the regex search case-insensitive for both bookName and       |
| subject?                                                              |
|                                                                       |
| ! 3. Are minPrice/maxPrice correctly cast to Number before the query? |
|                                                                       |
| ! 4. What happens if minPrice \> maxPrice --- does it return empty    |
| results or error?                                                     |
|                                                                       |
| ! 5. Is the sort default correctly set to newest if no sort param is  |
| provided?                                                             |
|                                                                       |
| ! 6. Can a malicious regex in the q param cause a ReDoS attack?       |
|                                                                       |
| ! 7. Are invalid condition or sort values rejected with a 400?        |
|                                                                       |
| ! 8. Is the compound index created on the correct fields?             |
|                                                                       |
| List all issues with corrected code.                                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **PHASE 7** · Wire all layers together. E2E test all 3 roles before   |
| deploy.                                                               |
|                                                                       |
| **Frontend + Launch**                                                 |
+-----------------------------------------------------------------------+

**Objective**

Build the Next.js frontend dashboards for all three roles, perform
end-to-end testing with real Firebase tokens across all roles, and
deploy to Vercel + Render.

**Dependencies**

-   All Phases 1--6 complete with checkpoints passed.

-   Vercel account connected to the GitHub repo.

-   Render service created for the Express backend.

-   All environment variables set in Vercel and Render dashboards.

**Tasks**

**7.1 --- Public Pages**

-   Home / Browse page --- GET /api/books with search bar and filter UI.

-   Single listing detail page --- GET /api/books/:id.

-   Google Sign-In button --- calls Firebase
    signInWithPopup(googleProvider).

**7.2 --- User Dashboard**

-   My Listings page --- shows user\'s own listings with status badges
    (Pending / Approved / Rejected).

-   Create Listing form --- bookName, subject, condition, price, image
    upload (1--3).

-   Edit Listing form --- pre-filled, shows warning if approved listing
    will reset to pending.

-   Delete button --- confirmation dialog, then soft delete.

**7.3 --- Admin Dashboard**

-   Pending Queue --- list of pending listings with Approve / Reject /
    Delete actions.

-   Stats Panel --- total users, listings, pending, approved counts.

-   User Browser --- searchable list of all users with read-only profile
    view.

**7.4 --- Super Admin Panel**

-   User Management table --- role badges, promote / demote / ban /
    unban buttons.

-   Approval Mode toggle --- shows current mode, switch with
    confirmation.

-   Audit Log viewer --- paginated table with filters for action, actor,
    date range.

-   Advanced Stats panel.

**7.5 --- Pre-Deploy E2E Test**

-   Sign in as User → create listing → verify status pending (manual
    mode).

-   Sign in as Admin → approve listing → verify appears in public
    browse.

-   Sign in as User → edit approved listing → verify status resets to
    pending.

-   Toggle to automatic mode → create listing as User → verify instantly
    approved.

-   Sign in as Super Admin → ban User → verify banned User token returns
    403.

-   Unban User → verify access restored after re-authentication.

-   Verify audit log has entries for all above actions.

**Final Deployment Checklist**

  ------- ------------------------------------------ ------------------------------
          **Test**                                   **Expected Result**

  **✓**   All environment variables set in Render    MONGO_URI,
          (backend)                                  FIREBASE_SERVICE_ACCOUNT,
                                                     CLOUDINARY keys

  **✓**   All environment variables set in Vercel    NEXT_PUBLIC_FIREBASE_CONFIG,
          (frontend)                                 NEXT_PUBLIC_API_URL

  **✓**   CORS configured on Express to allow Vercel Backend accepts requests from
          domain                                     production frontend URL

  **✓**   Rate limiting live on POST /api/auth/login Prevents brute force on auth
                                                     endpoint

  **✓**   Rate limiting live on POST /api/books      Prevents spam listing creation

  **✓**   E2E test passed for all 3 roles            All flows work in production
                                                     environment
  ------- ------------------------------------------ ------------------------------

**Phase 7 --- Test Prompt**

Paste this prompt into an AI assistant before going live:

+-----------------------------------------------------------------------+
| \# SEMESTER SWAP V2 --- PHASE 7: PRE-LAUNCH REVIEW                    |
|                                                                       |
| I am about to launch Semester Swap V2 to LPU campus. Please do a      |
| final                                                                 |
|                                                                       |
| security and architecture review based on the following information.  |
|                                                                       |
| \# ARCHITECTURE SUMMARY                                               |
|                                                                       |
| → Frontend: Next.js on Vercel                                         |
|                                                                       |
| → Backend: Express.js on Render                                       |
|                                                                       |
| → DB: MongoDB Atlas                                                   |
|                                                                       |
| → Auth: Firebase Google Sign-In                                       |
|                                                                       |
| → Images: Cloudinary                                                  |
|                                                                       |
| \# ENVIRONMENT VARIABLES IN USE (list names only, not values)         |
|                                                                       |
| → \[LIST YOUR ENV VAR NAMES HERE e.g. MONGO_URI,                      |
| FIREBASE_SERVICE_ACCOUNT, etc.\]                                      |
|                                                                       |
| \# E2E TEST RESULTS                                                   |
|                                                                       |
| → User create listing (manual mode): \[PASS/FAIL\]                    |
|                                                                       |
| → Admin approve listing: \[PASS/FAIL\]                                |
|                                                                       |
| → User edit approved listing resets to pending: \[PASS/FAIL\]         |
|                                                                       |
| → Automatic mode instant approval: \[PASS/FAIL\]                      |
|                                                                       |
| → Ban user blocks token immediately: \[PASS/FAIL\]                    |
|                                                                       |
| → Audit log entries present for all actions: \[PASS/FAIL\]            |
|                                                                       |
| \# FINAL CHECKS REQUESTED:                                            |
|                                                                       |
| ! 1. Are there any security headers missing (helmet.js, CORS config)? |
|                                                                       |
| ! 2. Is rate limiting configured on the right endpoints?              |
|                                                                       |
| ! 3. Is there any route that accidentally exposes firebaseUid?        |
|                                                                       |
| ! 4. Are MongoDB Atlas network access rules restricted (not           |
| 0.0.0.0/0)?                                                           |
|                                                                       |
| ! 5. Are Cloudinary upload permissions restricted to backend-only?    |
|                                                                       |
| ! 6. Is there a Super Admin user seeded in the DB for first access?   |
|                                                                       |
| ! 7. Is the Firebase project in production mode (not test/emulator)?  |
|                                                                       |
| ! 8. Any remaining issues that could cause problems at launch?        |
|                                                                       |
| Give me a go/no-go recommendation with a list of any blockers.        |
+-----------------------------------------------------------------------+

*Semester Swap V2 --- Build Roadmap Complete*
