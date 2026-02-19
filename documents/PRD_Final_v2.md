**SEMESTER SWAP**

Product Requirements Document · Version 2.0

Platform: Web Application \| Scope: LPU Campus (MVP) \| Exchange:
Offline

Auth: Google Sign-In via Firebase \| Stack: MERN + Next.js

**1. Executive Summary**

Semester Swap is a university-scoped web marketplace exclusively for LPU
students to buy and sell used semester textbooks. Version 2.0 formalises
a three-tier role system (User, Admin, Super Admin), introduces a
configurable listing approval mode, richer search and filter
capabilities, and a full audit log --- evolving the platform from a
validated MVP into a governed, scalable campus marketplace.

**2. Problem Statement**

Students currently rely on personal contacts and WhatsApp groups to sell
books, resulting in low visibility, disorganised communication, and high
failure rates in finding buyers or sellers. Version 1.0 validated
demand. Version 2.0 addresses governance, listing quality, and
discoverability at scale.

**3. Goals & Objectives**

-   Provide frictionless Google Sign-In so any LPU student can onboard
    in seconds.

-   Enforce clear role-based permissions so Users, Admins, and Super
    Admins each operate within their scope.

-   Reduce listing approval friction with a Super Admin-controlled
    auto/manual approval toggle.

-   Improve discoverability through keyword search and multi-dimensional
    filters.

-   Ensure platform safety with real-time ban enforcement and a full
    audit trail.

-   Remain architecturally open to multi-university expansion post-MVP.

**4. Target Users**

  --------------- ------------------------ -------------------------------
  **Role**        **Who**                  **Primary Goal**

  User            Any LPU student          Browse listings or sell their
                  (1st--4th year)          own books

  Admin           Appointed by Super Admin Moderate listings, manage
                                           users, view stats

  Super Admin     Platform owner / trusted Full governance, system config,
                  operator                 audit access
  --------------- ------------------------ -------------------------------

**5. Role Permissions & Feature Access**

**5.1 User**

-   Sign up and log in via Google Sign-In (Firebase Auth).

-   Browse all approved, non-deleted listings publicly.

-   Create a new book listing with: Book Name, Subject, Condition,
    Price, 1--3 images.

-   Edit their own listing --- editing any approved listing resets its
    status to \'pending\' for re-moderation.

-   Soft-delete their own listing (removed from public view; data
    retained).

-   View the status of their own listings (Pending / Approved /
    Rejected).

> *ℹ Browsing is fully public. Google login is required only to post a
> listing.*

**5.2 Admin**

-   All User permissions.

-   Access a dedicated Admin Dashboard.

-   View pending listing queue and take approve or reject actions.

-   Delete any listing on the platform regardless of owner.

-   View platform statistics: total users, total listings, pending
    count, approved count.

-   View any user\'s profile in read-only mode.

-   Cannot promote, demote, or ban users --- that is exclusively Super
    Admin territory.

**5.3 Super Admin**

-   All Admin permissions.

-   Promote any User to Admin; demote any Admin back to User.

-   Ban or unban any user --- takes effect instantly and simultaneously
    revokes their Firebase token.

-   Toggle the global listing approval mode between Manual and
    Automatic:

    -   Manual (default): every new listing goes to \'pending\' and
        requires Admin review.

    -   Automatic: new listings are instantly set to \'approved\' with
        no Admin review required. Toggling back to Manual does not
        affect already-approved listings.

-   View the full audit log, filterable by action type, actor, and date
    range.

-   View advanced system-wide statistics.

> *ℹ The approval mode toggle applies only to new listings created after
> the toggle. Existing pending listings are unaffected.*

**6. Core Features (V2.0)**

**6.1 Authentication**

-   Google Sign-In via Firebase --- users authenticate with their Google
    account.

-   On first login, the backend auto-creates a User document with role:
    \'user\' and isActive: true.

-   All subsequent API requests carry a Firebase-verified JWT; the
    backend issues no second token.

**6.2 Book Listing**

-   Fields: Book Name, Subject, Condition (New / Good / Used), Price
    (INR), 1--3 images.

-   Status lifecycle: pending → approved or rejected. Editing an
    approved listing resets it to pending.

-   Soft delete: listings are flagged isDeleted: true and hidden from
    public view; data is never erased.

**6.3 Search & Filters**

-   Keyword search on Book Name (case-insensitive).

-   Filter by Condition: New / Good / Used.

-   Filter by Price range: min and max (INR).

-   Filter by Subject / Department.

-   Sort by: Newest first · Price low to high · Price high to low.

> *ℹ Search always scopes to approved, non-deleted listings only.*

**6.4 Admin Dashboard**

-   Pending queue: list of all listings awaiting review.

-   One-click approve or reject on any pending listing.

-   Delete any listing (hard remove from public view, logged to audit
    trail).

-   Platform stats panel: users, listings, pending, approved counts.

-   User browser: read-only view of any user\'s profile and their
    listings.

**6.5 Super Admin Panel**

-   All Admin Dashboard capabilities.

-   User management table: promote to Admin, demote to User, ban or
    unban.

-   Approval mode toggle with current state displayed (Manual /
    Automatic).

-   Audit log viewer: paginated table filterable by action, actor, and
    date range.

-   Advanced stats: role breakdown, ban counts, auto vs manual approvals
    over time.

**6.6 Audit Log**

-   Every sensitive action is logged automatically.

-   Logged actions: LISTING_CREATED, LISTING_APPROVED, LISTING_REJECTED,
    LISTING_DELETED, USER_PROMOTED, USER_DEMOTED, USER_BANNED,
    USER_UNBANNED, APPROVAL_MODE_CHANGED, AUTO_APPROVE_LISTING.

-   Each entry captures: actor (User ID or null for system), actorType
    (user / system), target, action, metadata (e.g. old and new values),
    timestamp.

-   Auto-approved listings log with actorType: \'system\' and actor:
    null --- no null reference errors.

-   Accessible to Super Admin only.

**7. In Scope vs Out of Scope**

  ----------------------------------- -----------------------------------
  **In Scope --- V2.0**               **Out of Scope (Future Versions)**

  Books only                          In-app payment / escrow

  LPU campus only                     Chat / messaging system

  Offline exchange (seller contact    Ratings & reviews
  via profile)                        

  Google Sign-In (Firebase)           Multi-university support

  Three-tier RBAC                     Native mobile app

  Search + multi-filter               Email / push notifications

  Auto / manual approval toggle       Book condition verification /
                                      photos review

  Full audit log                      Social features (follow, wishlist)

  Instant ban with Firebase token     Analytics dashboard for users
  revocation                          
  ----------------------------------- -----------------------------------

**8. Success Metrics --- First 3 Months**

  ------------- ------------------- ------------------- -------------------
  **Month**     **Listings**        **Registered        **Active Users**
                                    Users**             

  Month 1       50+                 100+                60+

  Month 2       150+                200+                120+

  Month 3       300+                350+                300+
  ------------- ------------------- ------------------- -------------------
