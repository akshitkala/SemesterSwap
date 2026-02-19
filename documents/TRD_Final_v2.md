**SEMESTER SWAP**

Technical Requirements Document · Version 2.0

Stack: MERN + Next.js \| Auth: Firebase Google Sign-In \| Scope: LPU
Only

DB: MongoDB Atlas \| Images: Cloudinary \| Hosting: Vercel + Render

**1. Technology Stack**

  ------------------ ---------------------- ------------------------------
  **Layer**          **Technology**         **Notes**

  Frontend           Next.js (React)        App Router; SSR for SEO, CSR
                                            for dashboard

  Backend            Node.js + Express      REST API with layered
                                            middleware

  Database           MongoDB Atlas +        NoSQL; Mongoose ODM for schema
                     Mongoose               enforcement

  Authentication     Firebase Auth (Google  Firebase verifies token;
                     Sign-In)               backend reads claims

  Image Storage      Cloudinary             Images uploaded via backend;
                                            only URLs stored in DB

  Frontend Hosting   Vercel                 Auto-deploy from Git on push

  Backend Hosting    Render                 Always-on service; environment
                                            variables in dashboard
  ------------------ ---------------------- ------------------------------

**2. System Architecture**

Browser → Next.js Frontend → Express REST API → MongoDB Atlas

Images flow from the browser to Express, then from Express to
Cloudinary. Only the returned Cloudinary URL is persisted in MongoDB.
Firebase verifies the Google ID Token on every protected request; the
backend extracts claims and constructs req.user --- no second JWT is
issued.

**3. Database Models**

**3.1 User**

> *⚠ firebaseUid is the canonical identity key --- indexed and unique.
> role defaults to \'user\' on creation. isActive: false triggers an
> immediate ban.*

  ------------------ --------------- -------------------------------------
  **Field**          **Type**        **Notes**

  \_id               ObjectId        Auto-generated primary key

  firebaseUid        String ---      Comes from Firebase decoded token
                     Unique, Indexed (uid)

  email              String ---      From Firebase Google profile
                     Unique          

  displayName        String          From Firebase Google profile

  role               Enum            \'user\' \| \'admin\' \|
                                     \'super_admin\' --- default: \'user\'

  isActive           Boolean         default: true. false = banned.
                                     Checked on every request.

  createdAt          Date            Auto-set on document creation
  ------------------ --------------- -------------------------------------

**3.2 Book**

> *⚠ Renamed from v1: title → bookName, sellerId → seller. New fields:
> subject, condition. Soft delete via isDeleted flag --- never
> hard-delete user listings.*

  ------------------ ----------------- -------------------------------------
  **Field**          **Type**          **Notes**

  \_id               ObjectId          Auto-generated primary key

  bookName           String ---        Title of the book
                     required          

  subject            String            Subject or department (e.g. CSE,
                                       Maths)

  price              Number ---        Asking price in INR
                     required          

  condition          Enum --- required \'new\' \| \'good\' \| \'used\'

  images             Array\<String\>   1--3 Cloudinary URLs

  seller             ObjectId → User   Reference to the seller\'s User
                                       document

  sellerContact      String            Denormalised for quick display (email
                                       or name)

  status             Enum              \'pending\' \| \'approved\' \|
                                       \'rejected\' --- default: \'pending\'

  isDeleted          Boolean           default: false. Soft delete flag.

  createdAt          Date              Auto-set on document creation
  ------------------ ----------------- -------------------------------------

**3.3 SystemConfig (Singleton)**

> *⚠ Only one document exists in this collection. All approval mode
> reads reference this document. Super Admin is the only role that can
> write to it.*

  ------------------ --------------- -------------------------------------
  **Field**          **Type**        **Notes**

  \_id               ObjectId        Singleton --- always the same
                                     document

  approvalMode       Enum            \'manual\' \| \'automatic\' ---
                                     default: \'manual\'

  updatedBy          ObjectId → User Last Super Admin who changed this
                                     setting

  updatedAt          Date            Timestamp of last change
  ------------------ --------------- -------------------------------------

**3.4 AdminActivity (Audit Log)**

> *⚠ actor is nullable --- system-triggered actions (auto-approvals) log
> with actor: null and actorType: \'system\'. This prevents null
> reference errors and keeps the schema forward-compatible with future
> automated actions.*

  ------------------ --------------- -------------------------------------
  **Field**          **Type**        **Notes**

  \_id               ObjectId        Auto-generated

  actor              ObjectId → User null when actorType is \'system\'
                     \| null         

  actorType          Enum ---        \'user\' \| \'system\'
                     required        

  target             ObjectId ---    The User or Book document affected
                     required        

  targetModel        Enum ---        \'User\' \| \'Book\'
                     required        

  action             String ---      e.g. APPROVE_LISTING, PROMOTE_USER,
                     required        AUTO_APPROVE_LISTING

  metadata           Object          Optional context --- e.g. { oldRole:
                                     \'user\', newRole: \'admin\' }

  timestamp          Date            Auto-set when the log entry is
                                     created
  ------------------ --------------- -------------------------------------

**4. API Endpoints**

**4.1 Authentication**

  ------------ ------------------------ ------------ -----------------------------
  **Method**   **Endpoint**             **Access**   **Description**

  **POST**     /api/auth/login          Public       Receive Firebase ID token →
                                                     verify → create or fetch user
                                                     → return user object

  **GET**      /api/auth/me             Any auth     Return current authenticated
                                                     user\'s profile
  ------------ ------------------------ ------------ -----------------------------

**4.2 Books --- Public & User**

  ------------ ------------------------ ------------ -----------------------------
  **Method**   **Endpoint**             **Access**   **Description**

  **GET**      /api/books               Public       List all approved,
                                                     non-deleted listings

  **GET**      /api/books/search        Public       Search + filter: q,
                                                     condition, minPrice,
                                                     maxPrice, subject, sort

  **GET**      /api/books/:id           Public       Get single listing detail

  **POST**     /api/books               User         Create listing --- approval
                                                     mode middleware applies here

  **PUT**      /api/books/:id           Owner        Edit own listing --- resets
                                                     approved status back to
                                                     pending

  **DELETE**   /api/books/:id           Owner        Soft delete own listing
                                                     (isDeleted: true)
  ------------ ------------------------ ------------ -----------------------------

**4.3 Admin Routes (/api/admin)**

> *⚠ All routes in this group require role: admin or super_admin.*

  ------------ ------------------------------ ------------ -----------------------------
  **Method**   **Endpoint**                   **Access**   **Description**

  **GET**      /api/admin/stats               Admin+       Platform stats: users,
                                                           listings, pending, approved
                                                           counts

  **GET**      /api/admin/books/pending       Admin+       All listings with status:
                                                           pending

  **PUT**      /api/admin/books/:id/approve   Admin+       Approve listing → status:
                                                           approved, log action

  **PUT**      /api/admin/books/:id/reject    Admin+       Reject listing → status:
                                                           rejected, log action

  **DELETE**   /api/admin/books/:id           Admin+       Delete any listing, log to
                                                           audit trail

  **GET**      /api/admin/users               Admin+       List all users --- never
                                                           expose firebaseUid in
                                                           response

  **GET**      /api/admin/users/:id           Admin+       View single user profile ---
                                                           read only
  ------------ ------------------------------ ------------ -----------------------------

**4.4 Super Admin Routes (/api/super-admin)**

> *⚠ All routes require role: super_admin exactly. Admin tokens return
> 403.*

  ------------ ------------------------------------------ ------------ -----------------------------
  **Method**   **Endpoint**                               **Access**   **Description**

  **PUT**      /api/super-admin/users/:id/promote         Super Admin  Set role to \'admin\', log to
                                                                       audit trail

  **PUT**      /api/super-admin/users/:id/demote          Super Admin  Set role to \'user\', log to
                                                                       audit trail

  **PUT**      /api/super-admin/users/:id/toggle-status   Super Admin  Flip isActive + revoke
                                                                       Firebase refresh tokens
                                                                       immediately

  **PUT**      /api/super-admin/config/approval-mode      Super Admin  Toggle \'manual\' ↔
                                                                       \'automatic\', log old+new
                                                                       value in metadata

  **GET**      /api/super-admin/activity                  Super Admin  Paginated audit log ---
                                                                       filter by action, actorType,
                                                                       actor, date range

  **GET**      /api/super-admin/stats                     Super Admin  Advanced metrics: role
                                                                       breakdown, ban counts,
                                                                       approval mode history
  ------------ ------------------------------------------ ------------ -----------------------------

**5. Middleware Architecture**

**5.1 Auth Middleware (runs on every protected route)**

-   Extract Bearer token from Authorization header.

-   Verify token signature using Firebase Admin SDK --- return 401 if
    missing or invalid.

-   Decode Firebase UID from token claims.

-   Fetch User document from MongoDB by firebaseUid --- return 401 if
    user not found.

-   Check isActive === true --- return 403 immediately if false (banned
    users are blocked even with a valid token).

-   Attach the full user document to req.user and proceed.

**5.2 Role Middleware (runs after Auth Middleware)**

-   Read req.user.role and compare against the route\'s required role.

-   Role hierarchy enforced: user \< admin \< super_admin.

-   Return 403 Forbidden if the user\'s role is insufficient.

> *⚠ Super Admin routes check for exact role match --- an admin token
> returns 403 on /api/super-admin routes.*

**5.3 Approval Mode Middleware (runs on POST /api/books only)**

-   Read SystemConfig.approvalMode from the database.

-   If \'manual\': set listing status to \'pending\' --- no further
    action.

-   If \'automatic\': set listing status to \'approved\', then write an
    AdminActivity log entry with actorType: \'system\', actor: null,
    action: \'AUTO_APPROVE_LISTING\'.

> *⚠ This middleware reads from the DB on every create-listing request.
> For future scale, consider caching SystemConfig in memory with a short
> TTL (e.g. 30 seconds).*

**6. Search & Filter Specification**

Endpoint: GET /api/books/search --- always scoped to status:
\'approved\' and isDeleted: false.

  ------------ ------------ ----------------------------------------------
  **Param**    **Type**     **Behaviour**

  q            String       Case-insensitive regex match on bookName field

  condition    Enum         Filter: \'new\' \| \'good\' \| \'used\'

  minPrice     Number       price \>= minPrice

  maxPrice     Number       price \<= maxPrice

  subject      String       Case-insensitive match on subject field

  sort         Enum         \'newest\' → createdAt desc \| \'price_asc\' →
                            price asc \| \'price_desc\' → price desc
  ------------ ------------ ----------------------------------------------

Recommended MongoDB compound index: { status: 1, isDeleted: 1, bookName:
1, subject: 1, condition: 1, price: 1 }

**7. Security Implementation**

**7.1 Ban Enforcement --- Two-Layer**

-   Layer 1 --- Firebase token revocation: on toggle-status, call
    Firebase Admin SDK getAuth().revokeRefreshTokens(firebaseUid). The
    user\'s existing token is invalidated at the Firebase level
    immediately.

-   Layer 2 --- isActive check: Auth Middleware reads isActive from
    MongoDB on every request. A banned user\'s request returns 403 even
    if they somehow present a token before Firebase propagates the
    revocation.

-   Both layers together guarantee sub-second ban enforcement with no
    gap window.

**7.2 Input Validation**

-   All POST and PUT request bodies validated with Joi or Zod schemas on
    the backend.

-   Cloudinary upload restricted to image MIME types only; maximum 3
    files per listing.

-   Price must be a positive number. Condition must be a valid enum
    value.

**7.3 Rate Limiting**

-   express-rate-limit applied to: POST /api/auth/login and POST
    /api/books.

-   Prevents spam listing creation and brute-force auth attempts.

**7.4 Data Exposure Rules**

-   firebaseUid is never included in any API response sent to the
    frontend.

-   User list responses (admin routes) expose only: \_id, displayName,
    email, role, isActive, createdAt.

-   Soft-deleted listings (isDeleted: true) are excluded from all public
    and user-facing queries.

**8. V1 → V2 Database Migration Plan**

Run the following migration script against existing Books collection
before deploying any V2 backend code. This is a one-time operation.

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
>
> *⚠ Verify with db.books.findOne({ title: { \$exists: true } }) ---
> should return null after migration.*

**9. Deployment Plan**

  ----------- ------------------ ------------------------------------------
  **Phase**   **Focus**          **Key Tasks**

  Phase 0     Paper Alignment    PRD + TRD fully consistent, migration plan
                                 written, conflicts resolved

  Phase 1     Auth + RBAC        Auth Middleware, Role Middleware, Google
              Foundation         login, isActive ban check

  Phase 2     DB Migration       Run migration script, seed SystemConfig,
                                 verify zero v1 field names remain

  Phase 3     Book CRUD +        All book routes, Approval Mode Middleware,
              Approval Mode      input validation, ownership check

  Phase 4     Admin Layer        Admin dashboard routes, moderation
                                 actions, stats, user viewer, audit logging

  Phase 5     Super Admin Layer  Promote/demote/ban, Firebase token
                                 revocation, approval toggle, audit log
                                 viewer

  Phase 6     Search & Filters   Search endpoint, compound index, frontend
                                 filter UI

  Phase 7     Frontend + QA      Dashboards for all 3 roles, E2E testing,
                                 Vercel + Render deploy, campus launch
  ----------- ------------------ ------------------------------------------
